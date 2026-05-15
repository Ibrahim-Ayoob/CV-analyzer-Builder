import os, json, re, tempfile
from flask import Flask, request, jsonify

# Load .env automatically
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        r = app.make_default_options_response()
        r.headers["Access-Control-Allow-Origin"]  = "*"
        r.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        r.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return r

# ── Groq client ───────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
groq_client  = None

if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"[OK] Groq client ready (key: {GROQ_API_KEY[:12]}...)")
    except ImportError:
        print("[ERROR] groq package missing. Run: pip install groq")
    except Exception as e:
        print(f"[ERROR] Groq init failed: {e}")
else:
    print("[WARN] GROQ_API_KEY not set – add it to backend/.env")

ALLOWED = {"pdf", "docx", "doc", "txt"}
MAX_MB  = 10 * 1024 * 1024

# ── File helpers ───────────────────────────────────────────────────────────
def ok_file(name):
    return "." in name and name.rsplit(".", 1)[1].lower() in ALLOWED

def read_pdf(path):
    if not PDF_AVAILABLE:
        return None, "PyPDF2 not installed"
    try:
        txt = ""
        with open(path, "rb") as f:
            for page in PyPDF2.PdfReader(f).pages:
                txt += page.extract_text() or ""
        return txt.strip(), None
    except Exception as e:
        return None, str(e)

def read_docx(path):
    if not DOCX_AVAILABLE:
        return None, "python-docx not installed"
    try:
        doc = Document(path)
        txt = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return txt.strip(), None
    except Exception as e:
        return None, str(e)

def read_txt(path):
    try:
        return open(path, encoding="utf-8", errors="ignore").read().strip(), None
    except Exception as e:
        return None, str(e)

def extract(path, filename):
    ext = filename.rsplit(".", 1)[1].lower()
    if ext == "pdf":           return read_pdf(path)
    if ext in ("docx","doc"):  return read_docx(path)
    if ext == "txt":           return read_txt(path)
    return None, "Unsupported format"
# ── CV analysis helpers ────────────────────────────────────────────────────
def detect_sections(text):
    KW = {
        "Personal Information": ["email","phone","linkedin","github","contact"],
        "Summary / Objective":  ["summary","objective","profile","about me"],
        "Education":            ["education","university","degree","bachelor","master","phd","college","gpa"],
        "Experience":           ["experience","employment","internship","position","worked at"],
        "Skills":               ["skills","technologies","tools","frameworks","proficiencies"],
        "Projects":             ["projects","portfolio","personal project","open source"],
        "Certifications":       ["certification","certificate","certified"],
        "Languages":            ["languages","fluent","native","bilingual"],
        "Achievements":         ["award","achievement","honor","scholarship"],
    }
    lo = text.lower()
    found, missing = [], []
    core = {"Education","Experience","Skills","Projects"}
    for s, kws in KW.items():
        if any(k in lo for k in kws):
            found.append(s)
        elif s in core:
            missing.append(s)
    return found, missing

def structure_stats(text):
    lines   = [l.strip() for l in text.splitlines() if l.strip()]
    words   = len(text.split())
    bullets = sum(1 for l in lines if l[:1] in "-*•–▪")
    return {
        "word_count":   words,
        "line_count":   len(lines),
        "bullet_count": bullets,
        "has_bullets":  bullets >= 3,
        "good_length":  300 <= words <= 1200,
        "length_note": (
            "Too short – add more detail" if words < 300 else
            "Too long – consider trimming" if words > 1200 else
            "Good length"
        ),
    }

SYSTEM = """You are a world-class CV/resume evaluator with 20 years of hiring experience.

Analyze the CV and return ONLY a raw JSON object — no markdown, no backticks, no explanation, no extra text.

{
  "score": <integer 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "breakdown": {
    "content_quality":      {"score": <0-30>, "max": 30, "comment": "<insight>"},
    "structure_formatting": {"score": <0-25>, "max": 25, "comment": "<insight>"},
    "skills_relevance":     {"score": <0-20>, "max": 20, "comment": "<insight>"},
    "experience_strength":  {"score": <0-25>, "max": 25, "comment": "<insight>"}
  },
  "sections_found":   ["<section name>"],
  "missing_sections": ["<section name>"],
  "strengths":  ["<specific strength>", "<specific strength>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness>", "<specific weakness>", "<specific weakness>", "<specific weakness>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>", "<actionable tip 4>", "<actionable tip 5>"],
  "ats_score": <integer 0-100>,
  "ats_notes": "<2 sentence ATS assessment>",
  "industry_fit": ["<role/industry 1>", "<role/industry 2>", "<role/industry 3>"]
}"""

def ai_analyze(text, stats, found, missing):
    if not groq_client:
        return None, "GROQ_API_KEY is not set. Open backend/.env and add your key from https://console.groq.com"

    prompt = (
        f"CV TEXT:\n{text[:6000]}\n\n"
        f"Word count: {stats['word_count']}, Bullets: {stats['bullet_count']}, "
        f"Length: {stats['length_note']}\n"
        f"Sections detected: {', '.join(found) or 'none'}\n"
        f"Core sections missing: {', '.join(missing) or 'none'}\n\n"
        "Return ONLY the JSON object, nothing else."
    )
    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=1500,
            temperature=0.3,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip any accidental markdown fences
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"^```\s*",     "", raw)
        raw = re.sub(r"\s*```$",     "", raw)
        return json.loads(raw), None
    except json.JSONDecodeError as e:
        return None, f"AI returned invalid JSON: {e}"
    except Exception as e:
        return None, f"Groq API error: {e}"
    # ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({
        "status":       "ok",
        "pdf_support":  PDF_AVAILABLE,
        "docx_support": DOCX_AVAILABLE,
        "ai_ready":     bool(groq_client),
        "ai_provider":  "Groq (llama-3.3-70b-versatile)",
    })

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file field in request"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "No file selected"}), 400
    if not ok_file(f.filename):
        return jsonify({"error": "Unsupported type – use PDF, DOCX or TXT"}), 400
    f.seek(0, 2)
    if f.tell() > MAX_MB:
        return jsonify({"error": "File too large (max 10 MB)"}), 400
    f.seek(0)
    ext = f.filename.rsplit(".", 1)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix="." + ext) as tmp:
        f.save(tmp.name); path = tmp.name
    try:    text, err = extract(path, f.filename)
    finally: os.unlink(path)
    if err:           return jsonify({"error": f"Extraction failed: {err}"}), 500
    if len(text) < 50: return jsonify({"error": "Too little text extracted – try a TXT copy"}), 422
    return jsonify({"text": text, "word_count": len(text.split())})

@app.route("/analyze", methods=["POST"])
def analyze():
    body  = request.get_json(silent=True) or {}
    text  = body.get("text", "")
    if len(text) < 50:
        return jsonify({"error": "Text too short"}), 422
    stats = structure_stats(text)
    found, missing = detect_sections(text)
    result, err = ai_analyze(text, stats, found, missing)
    if err: return jsonify({"error": err}), 500
    result["structure_info"] = stats
    return jsonify(result)

@app.route("/result", methods=["POST"])
def result():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if not f.filename or not ok_file(f.filename):
        return jsonify({"error": "Invalid or unsupported file"}), 400
    f.seek(0, 2)
    if f.tell() > MAX_MB:
        return jsonify({"error": "File too large"}), 400
    f.seek(0)
    ext = f.filename.rsplit(".", 1)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix="." + ext) as tmp:
        f.save(tmp.name); path = tmp.name
    try:    text, err = extract(path, f.filename)
    finally: os.unlink(path)
    if err or len(text) < 50:
        return jsonify({"error": err or "Too little text extracted"}), 422
    stats = structure_stats(text)
    found, missing = detect_sections(text)
    result, err = ai_analyze(text, stats, found, missing)
    if err: return jsonify({"error": err}), 500
    result["structure_info"] = stats
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"\n{'='*48}")
    print(f"  CV Analyzer backend — Groq AI")
    print(f"  Running on http://localhost:{port}")
    print(f"  Health: http://localhost:{port}/health")
    print(f"{'='*48}\n")
    app.run(debug=True, host="0.0.0.0", port=port)