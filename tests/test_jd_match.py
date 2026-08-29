"""
tests/test_jd_match.py
-----------------------
Pytest suite for POST /jd-match & JD Extractor:
1. Pasted jd_text (JSON / Form) works with stored or explicit resume_text
2. extract_jd_text with PDF file -> returns non-empty text
3. extract_jd_text with DOCX file -> returns non-empty text matching known content
4. extract_jd_text with unsupported file -> raises ValueError
5. /jd-match with uploaded PDF file -> returns sensible match_percent and skill_gap
6. Resume with GitHub, LinkedIn, and LeetCode extracts all three links
7. Resume with only GitHub extracts GitHub and leaves linkedin/leetcode as None
8. Empty / missing input yields HTTP 422
"""

import sys
import io
import zipfile
import pytest
from pathlib import Path

# Ensure project root is in sys.path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from fastapi.testclient import TestClient
from backend.main import app
from backend.core.resume_ocr import _extract_structured_data
from backend.core.jd_extractor import extract_jd_text

client = TestClient(app)


def _create_mock_docx(text: str) -> bytes:
    """Helper to generate a valid in-memory DOCX file."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as z:
        xml_content = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>{text}</w:t></w:r></w:p>
  </w:body>
</w:document>"""
        z.writestr("word/document.xml", xml_content)
    return buffer.getvalue()


def test_jd_match_pasted_text_still_works():
    """Pasted jd_text with explicit resume_text in JSON payload works as expected."""
    text = "Senior Python Developer proficient in FastAPI, PyTorch, Docker, and PostgreSQL."
    response = client.post(
        "/jd-match",
        json={"resume_text": text, "jd_text": text},
    )
    assert response.status_code == 200
    data = response.json()
    assert "match_percent" in data
    assert "skill_overlap" in data
    assert "skill_gap" in data
    assert data["match_percent"] >= 99.0
    assert data["skill_gap"] == []
    assert "python" in data["skill_overlap"]
    assert "fastapi" in data["skill_overlap"]


def test_jd_match_pulls_stored_resume():
    """First upload/parse a resume, then call /jd-match passing ONLY jd_text (no resume_text)."""
    resume_text = "Backend Software Engineer experienced in Python, Django, PostgreSQL, Docker, AWS, and Microservices."
    rec_resp = client.post("/recommend/resume", json={"resume_text": resume_text})
    assert rec_resp.status_code == 200

    jd_text = "Looking for a Python Developer with Docker, Kubernetes, and FastAPI skills."
    match_resp = client.post("/jd-match", json={"jd_text": jd_text})
    assert match_resp.status_code == 200
    data = match_resp.json()
    assert data["match_percent"] > 0
    assert "python" in data["skill_overlap"]
    assert "docker" in data["skill_overlap"]
    assert "kubernetes" in data["skill_gap"]


def test_extract_jd_text_pdf():
    """Test extract_jd_text with a real PDF file from workspace."""
    pdf_path = _ROOT / "resume.pdf"
    if pdf_path.exists():
        pdf_bytes = pdf_path.read_bytes()
        text = extract_jd_text(pdf_bytes, "job_description.pdf")
        assert isinstance(text, str)
        assert len(text.strip()) > 0


def test_extract_jd_text_docx():
    """Test extract_jd_text with a generated DOCX file."""
    content = "Job Description: Senior Python Backend Developer. Key skills required: Python, FastAPI, Docker, Kubernetes, PostgreSQL."
    docx_bytes = _create_mock_docx(content)
    text = extract_jd_text(docx_bytes, "job_description.docx")
    assert isinstance(text, str)
    assert "Python" in text
    assert "FastAPI" in text


def test_extract_jd_text_unsupported():
    """Test extract_jd_text with an unsupported file extension raises ValueError."""
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_jd_text(b"some invalid binary data", "executable_file.xyz")


def test_jd_match_uploaded_pdf_returns_match_pct_and_gap():
    """Confirm /jd-match with an uploaded JD file returns sensible match_percent and skill_gap."""
    # Ensure resume session state is initialized
    client.post("/recommend/resume", json={"resume_text": "Software Engineer with Python, FastAPI, Docker, PyTorch experience."})

    # Upload DOCX file to /jd-match endpoint
    docx_content = "Job Requirement: Senior Machine Learning Engineer with Python, PyTorch, Kubernetes, and Terraform."
    docx_bytes = _create_mock_docx(docx_content)
    
    response = client.post(
        "/jd-match",
        files={"file": ("job_description.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "match_percent" in data
    assert data["match_percent"] > 0.0
    assert "python" in data["skill_overlap"]
    assert "pytorch" in data["skill_overlap"]
    assert "kubernetes" in data["skill_gap"]


def test_extract_all_three_profile_links():
    """Resume containing GitHub, LinkedIn, and LeetCode profile URLs extracts all three."""
    raw_text = """
    John Doe
    Email: john@example.com
    GitHub: https://github.com/johndoe
    LinkedIn: https://linkedin.com/in/johndoe
    LeetCode: https://leetcode.com/u/johndoe
    Skills: Python, FastAPI, Docker
    """
    extracted = _extract_structured_data(raw_text, [])
    assert extracted["github_url"] == "https://github.com/johndoe"
    assert extracted["linkedin_url"] == "https://linkedin.com/in/johndoe"
    assert extracted["leetcode_url"] == "https://leetcode.com/u/johndoe"


def test_extract_only_github_profile_link():
    """Resume containing ONLY GitHub profile URL extracts GitHub and leaves linkedin/leetcode as None."""
    raw_text = """
    Jane Smith
    Email: jane@example.com
    GitHub: github.com/janesmith
    Skills: Python, Machine Learning
    """
    extracted = _extract_structured_data(raw_text, [])
    assert extracted["github_url"] == "https://github.com/janesmith"
    assert extracted["linkedin_url"] is None
    assert extracted["leetcode_url"] is None


def test_jd_match_empty_input():
    """Empty or missing inputs when no resume state is set should return HTTP 400 Bad Request."""
    from backend.routes.recommend import _RESUME_STATE
    _RESUME_STATE.text = ""

    resp = client.post("/jd-match", json={"jd_text": "   "})
    assert resp.status_code == 400


def test_jd_match_both_files_uploaded_standalone():
    """resume_file + jd file both uploaded, no prior session data -> works end to end standalone."""
    from backend.routes.recommend import _RESUME_STATE
    _RESUME_STATE.text = ""

    resume_content = "Candidate Resume: Software Engineer with Python, FastAPI, Docker, and PyTorch experience."
    resume_bytes = _create_mock_docx(resume_content)

    jd_content = "Job Requirement: Machine Learning Engineer proficient in Python, PyTorch, and Kubernetes."
    jd_bytes = _create_mock_docx(jd_content)

    response = client.post(
        "/jd-match",
        files={
            "resume_file": ("resume.docx", resume_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            "file": ("jd.docx", jd_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "python" in data["skill_overlap"]
    assert "pytorch" in data["skill_overlap"]
    assert "kubernetes" in data["skill_gap"]


def test_jd_match_resume_file_overrides_pasted_text():
    """resume_file uploaded overrides resume_text if both are given."""
    resume_content = "Candidate Resume: Frontend Engineer experienced in React, TypeScript, JavaScript, and Redux."
    resume_bytes = _create_mock_docx(resume_content)

    response = client.post(
        "/jd-match",
        data={"resume_text": "Python backend engineer with Django skills.", "jd_text": "Looking for React and TypeScript developers."},
        files={"resume_file": ("resume.docx", resume_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "react" in data["skill_overlap"]
    assert "typescript" in data["skill_overlap"]


def test_jd_match_no_resume_returns_400_error():
    """neither resume_file, resume_text, nor prior session -> clear 400 error."""
    from backend.routes.recommend import _RESUME_STATE
    _RESUME_STATE.text = ""

    response = client.post(
        "/jd-match",
        json={"jd_text": "Looking for Python developers."},
    )
    assert response.status_code == 400
    assert "No resume provided" in response.json()["detail"]


def test_jd_match_placeholder_string_ignored_and_file_used():
    """Submit resume_text='string' and jd_text='string' alongside file upload — confirm file & stored resume are used."""
    client.post("/recommend/resume", json={"resume_text": "Senior Software Engineer with Python, FastAPI, Docker, and PostgreSQL experience."})

    docx_content = "Job Requirement: Machine Learning Developer proficient in Python, PyTorch, and Kubernetes."
    docx_bytes = _create_mock_docx(docx_content)

    response = client.post(
        "/jd-match",
        data={"jd_text": "string", "resume_text": "string"},
        files={"file": ("job.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "python" in data["skill_overlap"]
    assert "kubernetes" in data["skill_gap"]


def test_jd_match_empty_string_ignored():
    """Submit empty strings for resume_text and jd_text with file upload — confirm file & stored resume are used."""
    client.post("/recommend/resume", json={"resume_text": "Backend Engineer proficient in Python, Django, Docker, and PostgreSQL."})

    docx_content = "Job Description: Backend Engineer with Python, FastAPI, and Docker skills."
    docx_bytes = _create_mock_docx(docx_content)

    response = client.post(
        "/jd-match",
        data={"jd_text": "   ", "resume_text": ""},
        files={"file": ("job.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "python" in data["skill_overlap"]


def test_jd_match_real_pasted_text_overrides():
    """Confirm real pasted jd_text works correctly when no file is sent."""
    res = client.post("/recommend/resume", json={"resume_text": "Senior Backend Software Engineer with Python, FastAPI, Docker, and PostgreSQL experience."})
    assert res.status_code == 200

    response = client.post(
        "/jd-match",
        json={"jd_text": "Looking for Python, PyTorch, and Docker skills.", "resume_text": "Senior Backend Software Engineer with Python, FastAPI, Docker, and PostgreSQL experience."},
    )
    assert response.status_code == 200
    data = response.json()
    assert "python" in data["skill_overlap"]
    assert "pytorch" in data["skill_gap"]


def test_extract_profile_request_schema():
    """Verify ProfileRequest includes hackerrank field without throwing AttributeError."""
    resp = client.post(
        "/extract-profile",
        json={
            "github": "tourist",
            "leetcode": "tourist",
            "codechef": "tourist",
            "hackerrank": "tourist",
            "hackathon_wins": 0,
            "papers_published": 1,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "profile_score" in data

