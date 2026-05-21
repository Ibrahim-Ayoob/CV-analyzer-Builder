# CV Analyzer — AI-Powered Resume Evaluator (Grok / xAI)

A full-stack web application that analyzes CVs and returns a detailed score, section breakdown, strengths, weaknesses, and actionable tips — powered by Grok (xAI).

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python 3.9+ · Flask · OpenAI SDK (xAI) |
| Frontend | React 18 · Axios · react-dropzone      |
| AI       | Grok-3 (xAI)                           |
| Parsing  | PyPDF2 (PDF) · python-docx (DOCX)      |

---

## Quick Start

### Prerequisites
- Python 3.9 or higher
- Node.js 16 or higher
- A [Grok API key](https://console.x.ai) (free tier available)

### 1 — Add your API key

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# GROK_API_KEY=xai-...
```

### 2 — Run (Mac / Linux)

```bash
chmod +x start.sh
./start.sh
```

### 2 — Run (Windows)

Double-click `start.bat`

The script automatically installs all dependencies and starts both servers.

Open **http://localhost:3000** in your browser.

---

## Manual Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # add your GROK_API_KEY
python app.py
# Flask running on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm start
# React running on http://localhost:3000
```

---

## Get a Grok API Key

1. Go to **https://console.x.ai**
2. Sign in with your X (Twitter) account
3. Create a new API key
4. Paste it into `backend/.env` as `GROK_API_KEY=xai-...`

---

## API Endpoints

| Method | Endpoint  | Description                            |
|--------|-----------|----------------------------------------|
| GET    | /health   | Check backend + library status         |
| POST   | /upload   | Upload file, get extracted text back   |
| POST   | /analyze  | Send CV text, get AI analysis JSON     |
| POST   | /result   | Upload file + full analysis in one go  |

### Example JSON response

```json
{
  "score": 78,
  "grade": "B+",
  "summary": "A solid CV with good technical depth...",
  "breakdown": {
    "content_quality":      { "score": 22, "max": 30, "comment": "Good action verbs but lacks metrics" },
    "structure_formatting": { "score": 20, "max": 25, "comment": "Clean layout, consistent formatting" },
    "skills_relevance":     { "score": 15, "max": 20, "comment": "Relevant modern stack" },
    "experience_strength":  { "score": 21, "max": 25, "comment": "Strong progression, missing impact numbers" }
  },
  "sections_found": ["Education", "Skills", "Experience"],
  "missing_sections": ["Projects", "Summary / Objective"],
  "strengths": ["Clear work history", "Relevant technical skills"],
  "weaknesses": ["No quantified achievements", "Missing projects section"],
  "tips": [
    "Add metrics to every role (e.g. 'reduced load time by 40%')",
    "Include a 3-line professional summary at the top",
    "Add a Projects section with GitHub links",
    "Use stronger action verbs: 'architected' vs 'worked on'",
    "Tailor the skills section to match job description keywords"
  ],
  "ats_score": 72,
  "ats_notes": "Good keyword density. Avoid tables and columns for better ATS parsing.",
  "industry_fit": ["Software Engineering", "Backend Development", "Full Stack"],
  "structure_info": {
    "word_count": 542,
    "line_count": 87,
    "has_bullets": true,
    "bullet_count": 14,
    "length_note": "Good length"
  }
}
```

---

## Project Structure

```
cv-analyzer/
├── start.sh               ← Mac/Linux launcher
├── start.bat              ← Windows launcher
├── README.md
├── backend/
│   ├── app.py             ← Flask app (routes + Grok AI logic)
│   ├── requirements.txt   ← flask, openai, PyPDF2, python-docx
│   ├── .env.example
│   └── .env               ← your GROK_API_KEY goes here
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        ├── App.js         ← All React components
        └── App.css        ← Full dark-theme stylesheet
```

---

## Scoring System

| Category              | Weight | Evaluated on                                |
|-----------------------|--------|---------------------------------------------|
| Content Quality       | 30 pts | Action verbs, quantified achievements, depth|
| Structure & Formatting| 25 pts | Section order, readability, bullet usage     |
| Skills Relevance      | 20 pts | Modern/in-demand technologies, soft skills  |
| Experience Strength   | 25 pts | Impact, career progression, accomplishments |

---

## Supported File Formats

| Format | Library     | Notes                    |
|--------|-------------|--------------------------|
| PDF    | PyPDF2      | Text-based PDFs only     |
| DOCX   | python-docx | All standard Word files  |
| TXT    | built-in    | Plain text, always works |

---

## Troubleshooting

**"GROK_API_KEY not set"** → Edit `backend/.env` and add your key from console.x.ai

**React blank page** → Make sure Flask is running on port 5000 first.

**PDF shows no text** → The PDF may be scanned/image-based. Save your CV as a TXT file instead.

**CORS error** → The `proxy` field in `frontend/package.json` must be `http://localhost:8080`.
# CI/CD tested and working
