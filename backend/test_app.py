"""
Simple tests for app.py
Run with: pytest test_app.py -v
"""

import io
import json
import pytest
import os

os.environ["GROQ_API_KEY"] = ""

import app as flask_app


@pytest.fixture
def client():
    flask_app.app.config["TESTING"] = True
    with flask_app.app.test_client() as client:
        yield client


# ── 1. Test allowed file types ─────────────────────────────────────────────

def test_pdf_is_allowed():
    assert flask_app.ok_file("resume.pdf") is True

def test_docx_is_allowed():
    assert flask_app.ok_file("resume.docx") is True

def test_txt_is_allowed():
    assert flask_app.ok_file("resume.txt") is True

def test_png_is_not_allowed():
    assert flask_app.ok_file("resume.png") is False

def test_exe_is_not_allowed():
    assert flask_app.ok_file("virus.exe") is False


# ── 2. Test section detection ──────────────────────────────────────────────

def test_detects_education():
    found, _ = flask_app.detect_sections("Education: Cairo University")
    assert "Education" in found

def test_detects_skills():
    found, _ = flask_app.detect_sections("Skills: Python, React")
    assert "Skills" in found

def test_detects_experience():
    found, _ = flask_app.detect_sections("Work Experience at Google")
    assert "Experience" in found

def test_detects_projects():
    found, _ = flask_app.detect_sections("Projects: CV Analyzer")
    assert "Projects" in found

def test_missing_projects_detected():
    _, missing = flask_app.detect_sections("Education and Skills only")
    assert "Projects" in missing

def test_missing_experience_detected():
    _, missing = flask_app.detect_sections("Education: university")
    assert "Experience" in missing


# ── 3. Test structure stats ────────────────────────────────────────────────

def test_word_count():
    stats = flask_app.structure_stats("hello world foo bar")
    assert stats["word_count"] == 4

def test_short_cv_flagged():
    stats = flask_app.structure_stats("too short")
    assert stats["good_length"] is False
    assert "Too short" in stats["length_note"]

def test_good_length_cv():
    text = "word " * 500
    stats = flask_app.structure_stats(text)
    assert stats["good_length"] is True
    assert stats["length_note"] == "Good length"

def test_bullet_points_counted():
    text = "- point one\n- point two\n- point three"
    stats = flask_app.structure_stats(text)
    assert stats["bullet_count"] == 3
    assert stats["has_bullets"] is True


# ── 4. Test /health route ──────────────────────────────────────────────────

def test_health_returns_200(client):
    res = client.get("/health")
    assert res.status_code == 200

def test_health_returns_ok(client):
    data = json.loads(client.get("/health").data)
    assert data["status"] == "ok"

def test_health_has_ai_ready(client):
    data = json.loads(client.get("/health").data)
    assert "ai_ready" in data


# ── 5. Test /upload route ──────────────────────────────────────────────────

def test_upload_no_file_returns_400(client):
    res = client.post("/upload")
    assert res.status_code == 400

def test_upload_wrong_file_type_returns_400(client):
    data = {"file": (io.BytesIO(b"hello"), "photo.png")}
    res = client.post("/upload", data=data, content_type="multipart/form-data")
    assert res.status_code == 400

def test_upload_too_short_text_returns_422(client):
    data = {"file": (io.BytesIO(b"hi"), "resume.txt")}
    res = client.post("/upload", data=data, content_type="multipart/form-data")
    assert res.status_code == 422

def test_upload_valid_txt_returns_200(client):
    cv = b"Ibrahim Mohammed software engineer Python Flask React. " * 10
    data = {"file": (io.BytesIO(cv), "resume.txt")}
    res = client.post("/upload", data=data, content_type="multipart/form-data")
    assert res.status_code == 200

def test_upload_returns_text_field(client):
    cv = b"Ibrahim Mohammed software engineer Python Flask React. " * 10
    data = {"file": (io.BytesIO(cv), "resume.txt")}
    res = client.post("/upload", data=data, content_type="multipart/form-data")
    body = json.loads(res.data)
    assert "text" in body

def test_upload_too_large_returns_400(client):
    big = io.BytesIO(b"x" * (11 * 1024 * 1024))
    data = {"file": (big, "resume.txt")}
    res = client.post("/upload", data=data, content_type="multipart/form-data")
    assert res.status_code == 400


# ── 6. Test /analyze route ─────────────────────────────────────────────────

def test_analyze_empty_body_returns_422(client):
    res = client.post("/analyze", content_type="application/json",
                      data=json.dumps({}))
    assert res.status_code == 422

def test_analyze_short_text_returns_422(client):
    res = client.post("/analyze", content_type="application/json",
                      data=json.dumps({"text": "too short"}))
    assert res.status_code == 422

def test_analyze_no_api_key_returns_error(client):
    text = "Ibrahim Mohammed software engineer Python experience. " * 20
    res = client.post("/analyze", content_type="application/json",
                      data=json.dumps({"text": text}))
    assert res.status_code == 500
    assert "error" in json.loads(res.data)


# ── 7. Test CORS headers ───────────────────────────────────────────────────

def test_health_has_cors_header(client):
    res = client.get("/health")
    assert res.headers.get("Access-Control-Allow-Origin") == "*"

def test_upload_has_cors_header(client):
    res = client.post("/upload")
    assert res.headers.get("Access-Control-Allow-Origin") == "*"

def test_analyze_has_cors_header(client):
    res = client.post("/analyze", content_type="application/json", data="{}")
    assert res.headers.get("Access-Control-Allow-Origin") == "*"
