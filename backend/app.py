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

