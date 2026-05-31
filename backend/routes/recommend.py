"""
routes/recommend.py
-------------------
All recommendation endpoints.

POST  /recommend              — comma-separated skills → ranked jobs
POST  /recommend/resume       — raw resume text → ranked jobs
POST  /recommend/pdf          — PDF file upload → ranked jobs
POST  /extract-skills         — text → extracted skill list (debug / UI preview)
GET   /recommend/jobs         — browse / filter all indexed jobs
GET   /recommend/domains      — list all domains available for filtering
"""

from __future__ import annotations
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from ..core.engine import Engine, W_SEMANTIC, W_PROFILE, W_DSA
from ..core.extractor import extract_skills, skills_str
from ..models.schemas import (
    SkillsRequest, ResumeTextRequest, ExtractRequest,
    JobMatchOut, RecommendOut, ExtractOut,
)

router = APIRouter(tags=["Recommendations"])

# ── shared helpers ─────────────────────────────────────────────────────────────

def _engine() -> Engine:
    return Engine.get()


def _weights() -> dict[str, float]:
    return {"semantic": W_SEMANTIC, "profile": W_PROFILE, "dsa": W_DSA}


def _format(result) -> RecommendOut:
    return RecommendOut(
        matches=[
            JobMatchOut(
                job_id=           m.job_id,
                job_role=         m.job_role,
                domain=           m.domain,
                experience_label= m.experience_label,
                experience_level= m.experience_level,
                skills=           m.skills,
                skills_list=      m.skills_list,
                projects=         m.projects,
                companies=        m.companies,
                salary_range=     m.salary_range,
                salary_min=       m.salary_min,
                salary_max=       m.salary_max,
                salary_avg=       m.salary_avg,
                has_salary_data=  m.has_salary_data,
                skill_count=      m.skill_count,
                semantic_score=   m.semantic_score,
                blended_score=    m.blended_score,
                skill_overlap=    m.skill_overlap,
                skill_gap=        m.skill_gap,
                match_pct=        m.match_pct,
            )
            for m in result.matches
        ],
        candidate_skills= result.candidate_skills,
        query_ms=         result.query_ms,
        total_jobs=       result.total_jobs,
        weights=          _weights(),
    )


# ── POST /recommend ────────────────────────────────────────────────────────────

@router.post("/recommend", response_model=RecommendOut,
             summary="Skills string → job recommendations")
async def recommend_from_skills(body: SkillsRequest):
    """
    Main recommendation endpoint.

    Pass a comma-separated skill string (copy-paste from a resume skills section
    or assembled by the profile aggregator).  Returns top_k ranked jobs with
    skill gap analysis and blended score.

    Example payload:
    ```json
    {
      "skills": "Python, Machine Learning, PyTorch, FastAPI, Docker",
      "top_k": 10,
      "profile_score": 0.75,
      "dsa_score": 0.60
    }
    ```
    """
    try:
        result = _engine().recommend(
            skills_str=    body.skills,
            top_k=         body.top_k,
            profile_score= body.profile_score,
            dsa_score=     body.dsa_score,
            domain_filter= body.domain_filter,
            exp_filter=    body.exp_filter,
        )
        return _format(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /recommend/resume ─────────────────────────────────────────────────────

@router.post("/recommend/resume", response_model=RecommendOut,
             summary="Raw resume text → job recommendations")
async def recommend_from_resume(body: ResumeTextRequest):
    """
    Paste raw resume text (or text extracted from a PDF elsewhere).
    Skills are auto-extracted then sent to the BERT encoder.

    The response includes `candidate_skills` so the frontend can show
    the user exactly which skills were picked up.
    """
    try:
        extracted = extract_skills(body.resume_text)
        if not extracted:
            raise HTTPException(
                status_code=422,
                detail="No recognisable skills found in resume text. "
                       "Try /extract-skills first to see what was detected.",
            )
        result = _engine().recommend(
            skills_str=    skills_str(extracted),
            top_k=         body.top_k,
            profile_score= body.profile_score,
            dsa_score=     body.dsa_score,
            domain_filter= body.domain_filter,
            exp_filter=    body.exp_filter,
        )
        return _format(result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /recommend/pdf ────────────────────────────────────────────────────────

@router.post("/recommend/pdf", response_model=RecommendOut,
             summary="Upload PDF resume → job recommendations")
async def recommend_from_pdf(
    file:          UploadFile = File(...),
    top_k:         int   = Query(10, ge=1, le=30),
    profile_score: float = Query(0.0, ge=0.0, le=1.0),
    dsa_score:     float = Query(0.0, ge=0.0, le=1.0),
    domain_filter: Optional[str]  = Query(None),
    exp_filter:    Optional[float] = Query(None),
):
    """
    Upload a PDF resume.  Text is extracted with pdfplumber, skills are
    auto-identified, then recommendations are returned.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted.")
    try:
        import pdfplumber
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"

        if len(text.strip()) < 30:
            raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

        extracted = extract_skills(text)
        if not extracted:
            raise HTTPException(status_code=422, detail="No skills detected in PDF text.")

        result = _engine().recommend(
            skills_str=    skills_str(extracted),
            top_k=         top_k,
            profile_score= profile_score,
            dsa_score=     dsa_score,
            domain_filter= domain_filter,
            exp_filter=    exp_filter,
        )
        return _format(result)
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="pdfplumber not installed. Run: pip install pdfplumber",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /extract-skills ───────────────────────────────────────────────────────

@router.post("/extract-skills", response_model=ExtractOut,
             summary="Preview skill extraction from text")
async def extract_skills_endpoint(body: ExtractRequest):
    """
    Debug / UI helper.  Shows what skills the extractor picks up from text
    before committing to a recommendation call.  Use this to let the user
    confirm/edit the extracted skill list in the frontend.
    """
    skills = extract_skills(body.text)
    return ExtractOut(skills=skills, skill_count=len(skills))


# ── GET /recommend/jobs ────────────────────────────────────────────────────────

@router.get("/recommend/jobs", summary="Browse all indexed jobs")
async def list_jobs(
    domain:    Optional[str]  = Query(None, description="Filter by domain"),
    exp_level: Optional[float] = Query(None, description="0/1/2/3"),
    search:    Optional[str]  = Query(None, description="Partial role name search"),
    target:    Optional[str]  = Query(None, description="'College' or 'School'"),
):
    """
    Returns all jobs in the FAISS index with optional filters.
    Useful for the browse / explore UI — not for recommendations.
    """
    jobs = list(_engine().meta.values())
    if domain:
        jobs = [j for j in jobs if j.get("domain", "").lower() == domain.lower()]
    if exp_level is not None:
        jobs = [j for j in jobs if j.get("experience_level") == exp_level]
    if search:
        s = search.lower()
        jobs = [j for j in jobs if s in j.get("job_role", "").lower()]
    if target:
        jobs = [j for j in jobs if j.get("target_students", "").lower() == target.lower()]
    return {"jobs": jobs, "count": len(jobs)}


# ── GET /recommend/domains ─────────────────────────────────────────────────────

@router.get("/recommend/domains", summary="List all domains in the dataset")
async def list_domains():
    """Returns sorted unique domain values for the frontend filter dropdown."""
    domains = sorted({
        j.get("domain", "") for j in _engine().meta.values() if j.get("domain")
    })
    return {"domains": domains}
