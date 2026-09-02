"""
FastAPI endpoint for the LinkedIn PDF Optimizer.

Mount this router into your existing SkillSync FastAPI app, e.g.:

    from api import router as linkedin_router
    app.include_router(linkedin_router, prefix="/api/optimizer")

Endpoint:
    POST /api/optimizer/linkedin
        multipart/form-data, field name: "file" (the LinkedIn PDF export)

    Response (200):
        {
          "score": 72,
          "breakdown": { ... },
          "gaps": [ "...", "..." ],
          "sections_detected": [ "about", "experience", "skills", ... ]
        }

    Response (422): PDF has no extractable text (likely scanned/image-only)
"""

import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict

try:
    from backend.core.linkedin_scorer import score_linkedin_pdf
    from backend.core.ocr_fallback import is_pdf_text_extractable
except ImportError:
    from linkedin_scorer import score_linkedin_pdf
    from ocr_fallback import is_pdf_text_extractable

router = APIRouter(tags=["optimizer"])

MAX_FILE_SIZE_MB = 10


class LinkedInScoreResponse(BaseModel):
    score: int
    breakdown: Dict[str, float]
    gaps: List[str]
    sections_detected: List[str]


@router.post("/linkedin", response_model=LinkedInScoreResponse)
async def score_linkedin_profile(file: UploadFile = File(...)):
    # Accept the file if:
    #   (a) content-type is application/pdf  — standard PDF upload, OR
    #   (b) content-type is application/octet-stream AND the filename ends in .pdf
    #       — some browser/OS combos (e.g. Firefox on macOS, some Windows builds) label
    #         a valid LinkedIn PDF export as generic binary; the filename extension acts
    #         as a secondary guard.  We do NOT blindly accept all octet-stream uploads
    #         because that would allow arbitrary binary files through.
    filename = (file.filename or "").lower()
    is_pdf_content_type = file.content_type == "application/pdf"
    is_octet_stream_pdf = (
        file.content_type == "application/octet-stream" and filename.endswith(".pdf")
    )

    if not (is_pdf_content_type or is_octet_stream_pdf):
        raise HTTPException(
            status_code=400,
            detail=(
                "File must be a PDF (.pdf). "
                "Received content-type: " + str(file.content_type) +
                (f", filename: {file.filename}" if file.filename else "") + "."
            ),
        )

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_SIZE_MB} MB.",
        )

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        if not is_pdf_text_extractable(tmp_path):
            raise HTTPException(
                status_code=422,
                detail=(
                    "This PDF has no extractable text. Please upload LinkedIn's "
                    "native 'Save to PDF' export (Profile -> More -> Save to PDF), "
                    "not a scanned image or screenshot."
                ),
            )

        result = score_linkedin_pdf(tmp_path)
        return LinkedInScoreResponse(
            score=result.score,
            breakdown=result.breakdown,
            gaps=result.gaps,
            sections_detected=result.sections_detected,
        )
    finally:
        os.unlink(tmp_path)
