import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def create_sample_text_pdf() -> bytes:
    """Create a minimal valid PDF in memory with text content."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Alex Developer\nSoftware Engineer\nExperience\nSenior Engineer at Tech Corp\nSkills\nPython FastAPI PyTorch React\nEducation\nBS Computer Science")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def create_sample_scanned_pdf() -> bytes:
    """Create a PDF page with zero embedded text (e.g. image-only / scan)."""
    doc = fitz.open()
    page = doc.new_page()
    # Drawing graphics without inserting text elements
    if hasattr(page, 'draw_rect'):
        page.draw_rect(fitz.Rect(10, 10, 200, 200), fill=(0.8, 0.8, 0.8), color=(0, 0, 0))
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_linkedin_optimizer_valid_pdf():
    pdf_bytes = create_sample_text_pdf()
    files = {"file": ("linkedin_profile.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/optimizer/linkedin", files=files)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "score" in data
    assert "breakdown" in data
    assert "gaps" in data
    assert "sections_detected" in data
    assert isinstance(data["score"], int)

def test_linkedin_optimizer_non_pdf():
    files = {"file": ("test.txt", b"Hello world text", "text/plain")}
    response = client.post("/api/optimizer/linkedin", files=files)
    assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
    assert "File must be a PDF" in response.json()["detail"]

def test_linkedin_optimizer_scanned_pdf():
    pdf_bytes = create_sample_scanned_pdf()
    files = {"file": ("scanned_profile.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/optimizer/linkedin", files=files)
    assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
    assert "no extractable text" in response.json()["detail"]
