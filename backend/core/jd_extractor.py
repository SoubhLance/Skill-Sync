"""
backend/core/jd_extractor.py
=============================
Job Description (JD) raw text extraction helper for SkillSync.

Reuses the existing low-level PDF/DOCX/OCR text extraction engine from resume_ocr.py
without performing any resume-specific section parsing, link extraction, or skill vocab filtering.
"""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.core.resume_ocr import extract_resume_text


def extract_jd_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract raw plain text from an uploaded Job Description file (PDF, DOCX, TXT, or Image).

    Args:
        file_bytes: Raw binary content of the uploaded JD file.
        filename: Name of the uploaded file (used for extension detection).

    Returns:
        Clean plain text extracted from the document.

    Raises:
        ValueError: If file type is unsupported or extraction yields empty text.
    """
    if not file_bytes:
        raise ValueError("Uploaded JD file is empty.")

    ext = Path(filename).suffix.lower()

    # Plain text file handler
    if ext == ".txt":
        try:
            text = file_bytes.decode("utf-8", errors="ignore").strip()
            if not text:
                raise ValueError("Uploaded JD text file contains no text.")
            return text
        except Exception as exc:
            raise ValueError(f"Could not read text file '{filename}': {exc}")

    # Re-use existing PDF / DOCX / OCR engine from resume_ocr.py
    result = extract_resume_text(filename, file_bytes)

    if result.method == "failed" or not result.text or not result.text.strip():
        err_msg = (
            result.warnings[0]
            if result.warnings
            else f"Could not extract text from JD file '{filename}'."
        )
        raise ValueError(err_msg)

    return result.text.strip()


