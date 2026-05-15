"""
Backend tests for app.py
Run: pytest test_app.py -v
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


# ── File validation tests ──────────────────────

def test_pdf_allowed():
    assert flask_app.ok_file("cv.pdf")


def test_png_not_allowed():
    assert not flask_app.ok_file("cv.png")


# ── Section detection tests ────────────────────

def test_detect_education():
    found, _ = flask_app.detect_sections("Education at Cairo University")
    assert "Education" in found


def test_detect_skills():
    found, _ = flask_app.detect_sections("Skills: Python React")
    assert "Skills" in found


# ── Structure stats tests ──────────────────────

def test_word_count():
    stats = flask_app.structure_stats("one two three four")
    assert stats["word_count"] == 4


def test_bullet_count():
    stats = flask_app.structure_stats("- one\n- two")
    assert stats["bullet_count"] == 2


# ── Health route tests ─────────────────────────

def test_health_route(client):
    res = client.get("/health")

    assert res.status_code == 200

    data = json.loads(res.data)

    assert data["status"] == "ok"


# ── Upload route tests ─────────────────────────

def test_upload_without_file(client):
    res = client.post("/upload")

    assert res.status_code == 400


def test_upload_valid_file(client):
    cv = b"Python Flask React software engineer experience " * 10

    data = {
        "file": (io.BytesIO(cv), "cv.txt")
    }

    res = client.post(
        "/upload",
        data=data,
        content_type="multipart/form-data"
    )

    assert res.status_code == 200


# ── Analyze route tests ────────────────────────

def test_analyze_without_text(client):
    res = client.post("/analyze", json={})

    assert res.status_code == 422


def test_analyze_without_api_key(client):
    res = client.post(
        "/analyze",
        json={"text": "word " * 100}
    )

    assert res.status_code == 500