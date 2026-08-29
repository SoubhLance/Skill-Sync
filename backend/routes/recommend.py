"""
routes/recommend.py
-------------------
All recommendation endpoints.

POST  /recommend              — comma-separated skills → ranked jobs
POST  /recommend/resume       — raw resume text → ranked jobs
POST  /recommend/pdf          — PDF file upload → ranked jobs
POST  /extract-skills         — raw text → detailed skill extraction (primary / secondary)
POST  /extract-skills/pdf     — PDF upload → detailed skill extraction + page count
GET   /recommend/jobs         — browse / filter all indexed jobs
GET   /recommend/domains      — list all domains available for filtering
"""

from __future__ import annotations
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Request

import numpy as np

from ..core.engine import Engine, W_SEMANTIC, W_PROFILE
from ..core.extractor import extract_skills, extract_skills_from_resume, skills_str
from ..core.profile_extractor import (
    fetch_github_stats,
    fetch_leetcode_stats,
    fetch_codechef_stats,
    fetch_hackerrank_stats,
    compute_profile_score,
)
from ..core.resume_ocr import extract_resume_text, _extract_structured_data
from ..core.jd_extractor import extract_jd_text
from ..models.schemas import (
    SkillsRequest,
    ResumeTextRequest,
    ExtractRequest,
    ProfileRequest,
    JDMatchRequest,
    JobMatchOut,
    RecommendOut,
    ExtractDetailedOut,
    ProfileOut,
    JDMatchOut,
)



router = APIRouter(tags=["Recommendations"])

# ── resume session state storage ──────────────────────────────────────────────

class ResumeState:
    def __init__(self):
        self.text: str = ""
        self.github_url: Optional[str] = None
        self.linkedin_url: Optional[str] = None
        self.leetcode_url: Optional[str] = None

    def update(
        self,
        text: str,
        github_url: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        leetcode_url: Optional[str] = None,
    ):
        if text and text.strip():
            self.text = text
        if github_url is not None:
            self.github_url = github_url
        if linkedin_url is not None:
            self.linkedin_url = linkedin_url
        if leetcode_url is not None:
            self.leetcode_url = leetcode_url

_RESUME_STATE = ResumeState()

# ── shared helpers ─────────────────────────────────────────────────────────────

def _engine() -> Engine:
    return Engine.get()


def _weights() -> dict[str, float]:
    return {"semantic": W_SEMANTIC, "profile": W_PROFILE}


def _format(result, student_track: str = "cs") -> RecommendOut:
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
        student_track=    student_track,
    )


# ── POST /recommend ────────────────────────────────────────────────────────────

@router.post("/recommend", response_model=RecommendOut,
             summary="Skills string → job recommendations")
async def recommend_from_skills(body: SkillsRequest):
    """
    Main recommendation endpoint.

    Pass a comma-separated skill string. Returns top_k ranked jobs with
    skill gap analysis and blended score (0.60 semantic + 0.40 profile for CS track).

    Example payload:
    ```json
    {
      "skills": "Python, Machine Learning, PyTorch, FastAPI, Docker",
      "top_k": 10,
      "profile_score": 0.75,
      "student_track": "cs"
    }
    ```
    """
    try:
        track = body.student_track
        if track is None:
            track = "cs" if body.profile_score > 0 else "non_cs"

        result = _engine().recommend(
            skills_str=    body.skills,
            top_k=         body.top_k,
            profile_score= body.profile_score,
            domain_filter= body.domain_filter,
            exp_filter=    body.exp_filter,
            student_track= track,
        )
        return _format(result, student_track=track)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /recommend/resume ─────────────────────────────────────────────────────

@router.post("/recommend/resume", response_model=RecommendOut,
             summary="Raw resume text → job recommendations")
async def recommend_from_resume(body: ResumeTextRequest):
    """
    Paste raw resume text. Skills are auto-extracted then sent to the BERT encoder.
    """
    try:
        extracted = extract_skills(body.resume_text)
        if not extracted:
            raise HTTPException(
                status_code=422,
                detail="No recognisable skills found in resume text. "
                       "Try /extract-skills first to see what was detected.",
            )

        structured = _extract_structured_data(body.resume_text, [])
        _RESUME_STATE.update(
            body.resume_text,
            structured.get("github_url"),
            structured.get("linkedin_url"),
            structured.get("leetcode_url"),
        )

        track = body.student_track
        if track is None:
            track = "cs" if body.profile_score > 0 else "non_cs"

        result = _engine().recommend(
            skills_str=    skills_str(extracted),
            top_k=         body.top_k,
            profile_score= body.profile_score,
            domain_filter= body.domain_filter,
            exp_filter=    body.exp_filter,
            student_track= track,
        )
        return _format(result, student_track=track)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /recommend/pdf (and file uploads: PDF, JPG, PNG) ──────────────────────

@router.post("/recommend/pdf", response_model=RecommendOut,
             summary="Upload PDF or photo resume → job recommendations")
async def recommend_from_pdf(
    file:          UploadFile = File(...),
    top_k:         int   = Query(10, ge=1, le=30),
    profile_score: float = Query(0.0, ge=0.0, le=1.0),
    domain_filter: Optional[str]  = Query(None),
    exp_filter:    Optional[float] = Query(None),
    student_track: Optional[str]  = Query(None, description="'cs' or 'non_cs'"),
):
    """
    Upload a resume file (digital PDF, scanned PDF, or photo: JPG, PNG, WEBP).
    Hybrid parser tries fast text-layer first, then falls back to OCR if scanned/image.
    """
    try:
        contents = await file.read()
        ocr_res = extract_resume_text(file.filename, contents)

        if ocr_res.method == "failed" or not ocr_res.text.strip():
            err_msg = ocr_res.warnings[0] if ocr_res.warnings else "Could not extract text from uploaded file."
            raise HTTPException(status_code=422, detail=err_msg)

        extracted = extract_skills(ocr_res.text)
        if not extracted:
            raise HTTPException(status_code=422, detail="No skills detected in uploaded file.")

        _RESUME_STATE.update(
            ocr_res.text,
            ocr_res.github_url,
            ocr_res.linkedin_url,
            ocr_res.leetcode_url,
        )

        track = student_track
        if track is None:
            track = "cs" if profile_score > 0 else "non_cs"

        result = _engine().recommend(
            skills_str=    skills_str(extracted),
            top_k=         top_k,
            profile_score= profile_score,
            domain_filter= domain_filter,
            exp_filter=    exp_filter,
            student_track= track,
        )
        return _format(result, student_track=track)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /extract-skills ─────────────────────────────────────────────────────────────

@router.post("/extract-skills", response_model=ExtractDetailedOut,
             summary="Preview skill extraction from plain text")
async def extract_skills_endpoint(body: ExtractRequest):
    """
    Debug / UI helper. Returns detailed breakdown of extracted skills.
    """
    result = extract_skills_from_resume(body.text)
    structured = _extract_structured_data(body.text, [])
    _RESUME_STATE.update(
        body.text,
        structured.get("github_url"),
        structured.get("linkedin_url"),
        structured.get("leetcode_url"),
    )
    return ExtractDetailedOut(
        **result,
        github_url=structured.get("github_url"),
        linkedin_url=structured.get("linkedin_url"),
        leetcode_url=structured.get("leetcode_url"),
        emails=structured.get("emails", []),
        phone_numbers=structured.get("phone_numbers", []),
        achievements=structured.get("achievements", []),
        projects=structured.get("projects", []),
        projects_summary=structured.get("projects_summary", {}),
    )


# ── POST /extract-skills/pdf ────────────────────────────────────────────────────────

@router.post("/extract-skills/pdf", response_model=ExtractDetailedOut,
             summary="Upload a PDF or image resume and preview extracted skills with OCR metadata")
async def extract_skills_from_pdf(file: UploadFile = File(...)):
    """
    Upload a resume file (PDF, JPG, PNG, WEBP). Dispatches to hybrid text-layer + OCR parser.
    Returns primary/secondary skills, page count, and OCR confidence metadata.
    """
    try:
        contents = await file.read()
        ocr_res = extract_resume_text(file.filename, contents)

        if ocr_res.method == "failed" or not ocr_res.text.strip():
            err_msg = ocr_res.warnings[0] if ocr_res.warnings else "Could not extract text from file."
            raise HTTPException(status_code=422, detail=err_msg)

        _RESUME_STATE.update(
            ocr_res.text,
            ocr_res.github_url,
            ocr_res.linkedin_url,
            ocr_res.leetcode_url,
        )

        result = extract_skills_from_resume(ocr_res.text)
        return ExtractDetailedOut(
            **result,
            pages=ocr_res.pages_total,
            method=ocr_res.method,
            is_low_confidence=ocr_res.is_low_confidence,
            ocr_confidence=ocr_res.avg_ocr_confidence,
            warnings=ocr_res.warnings,
            github_url=ocr_res.github_url,
            linkedin_url=ocr_res.linkedin_url,
            leetcode_url=ocr_res.leetcode_url,
            emails=ocr_res.emails,
            phone_numbers=ocr_res.phone_numbers,
            achievements=ocr_res.achievements,
            projects=ocr_res.projects,
            projects_summary=ocr_res.projects_summary,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))



# ── POST /extract-profile ────────────────────────────────────────────────────────────

@router.post("/extract-profile", response_model=ProfileOut,
             summary="Extract signals from GitHub, LeetCode, CodeChef, HackerRank & compute profile_score")
async def extract_profile_endpoint(body: ProfileRequest):
    """
    Pass usernames for GitHub, LeetCode, CodeChef, and/or HackerRank plus self-reported bonuses.
    Fetches public profile stats and computes normalized profile_score (0.0 to 1.0).
    """
    try:
        gh = fetch_github_stats(body.github) if body.github else None
        lc = fetch_leetcode_stats(body.leetcode) if body.leetcode else None
        cc = fetch_codechef_stats(body.codechef) if body.codechef else None
        hr = fetch_hackerrank_stats(body.hackerrank) if body.hackerrank else None

        score_res = compute_profile_score(
            github=gh,
            leetcode=lc,
            codechef=cc,
            hackerrank=hr,
            hackathon_wins=body.hackathon_wins,
            papers_published=body.papers_published,
            return_details=True,
        )

        active = []
        if gh: active.append("github")
        if lc: active.append("leetcode")
        if cc: active.append("codechef")
        if hr: active.append("hackerrank")

        return ProfileOut(
            github=gh,
            leetcode=lc,
            codechef=cc,
            hackerrank=hr,
            profile_score=score_res["profile_score"],
            base_score=score_res["base_score"],
            bonus_applied=score_res["bonus_applied"],
            active_platforms=active,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Profile extraction error: {str(exc)}")



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


def _is_real_text(val: Optional[str]) -> bool:
    """Returns True if val is a non-empty string and not a placeholder like 'string'."""
    if not val or not isinstance(val, str):
        return False
    s = val.strip()
    if not s or s.lower() == "string":
        return False
    return True


# ── POST /jd-match ─────────────────────────────────────────────────────────────

@router.post(
    "/jd-match",
    response_model=JDMatchOut,
    summary="Pairwise resume vs job description match",
)
async def match_jd(
    request: Request,
    file: Optional[UploadFile] = File(None, description="Optional JD file upload (PDF or DOCX)"),
    resume_file: Optional[UploadFile] = File(None, description="Optional Resume file upload (PDF or DOCX)"),
    jd_text: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
):
    """
    Direct single-pair comparison between raw resume text and a job description.

    Supports multiple input methods for both Job Description and Candidate Resume:

    Job Description inputs (in priority order):
    1. Uploaded JD file in `file` (PDF or DOCX).
    2. Pasted raw text via JSON body `{"jd_text": "..."}` or Form field `jd_text`.

    Candidate Resume inputs (in priority order):
    1. Uploaded Resume file in `resume_file` (PDF or DOCX).
    2. Pasted raw text via JSON body `{"resume_text": "..."}` or Form field `resume_text`.
    3. Candidate's last uploaded/processed resume from the current session (from /recommend/pdf, /recommend/resume, or /extract-skills).

    NOTE: This performs a direct pairwise 1-to-1 comparison between resume_text and jd_text
    using BERT cosine similarity. It does NOT use FAISS lookup, profile_score, or dsa_score.
    """
    content_type = request.headers.get("content-type", "")
    input_jd_text = jd_text if _is_real_text(jd_text) else None
    input_resume_text = resume_text if _is_real_text(resume_text) else None

    # Parse JSON payload if sent as application/json
    if "application/json" in content_type.lower():
        try:
            body = await request.json()
            if isinstance(body, dict):
                json_jd = body.get("jd_text")
                json_resume = body.get("resume_text")
                if not input_jd_text and _is_real_text(json_jd):
                    input_jd_text = str(json_jd).strip()
                if not input_resume_text and _is_real_text(json_resume):
                    input_resume_text = str(json_resume).strip()
        except Exception:
            pass

    # 1. Acquire JD text (file upload or pasted string)
    final_jd_text = ""
    if file is not None and file.filename:
        file_bytes = await file.read()
        if file_bytes:
            try:
                final_jd_text = extract_jd_text(file_bytes, file.filename)
            except ValueError as val_err:
                raise HTTPException(status_code=400, detail=str(val_err))

    if not _is_real_text(final_jd_text) and _is_real_text(input_jd_text):
        final_jd_text = input_jd_text.strip()

    if not _is_real_text(final_jd_text):
        raise HTTPException(
            status_code=400,
            detail="jd_text or file (JD) is required. Provide pasted jd_text or upload a PDF/DOCX file.",
        )

    # 2. Acquire Resume text (Priority: resume_file upload -> pasted text -> session store)
    final_resume_text = ""

    if resume_file is not None and resume_file.filename:
        res_bytes = await resume_file.read()
        if res_bytes:
            ocr_res = extract_resume_text(resume_file.filename, res_bytes)
            if ocr_res.method != "failed" and ocr_res.text.strip():
                final_resume_text = ocr_res.text.strip()
                _RESUME_STATE.update(
                    ocr_res.text,
                    ocr_res.github_url,
                    ocr_res.linkedin_url,
                    ocr_res.leetcode_url,
                )
            else:
                err_msg = ocr_res.warnings[0] if ocr_res.warnings else "Could not extract text from uploaded resume_file."
                raise HTTPException(status_code=400, detail=err_msg)

    if not _is_real_text(final_resume_text) and _is_real_text(input_resume_text):
        final_resume_text = input_resume_text.strip()
        structured = _extract_structured_data(final_resume_text, [])
        _RESUME_STATE.update(
            final_resume_text,
            structured.get("github_url"),
            structured.get("linkedin_url"),
            structured.get("leetcode_url"),
        )
    elif not _is_real_text(final_resume_text) and _is_real_text(_RESUME_STATE.text):
        final_resume_text = _RESUME_STATE.text.strip()

    if not _is_real_text(final_resume_text):
        raise HTTPException(
            status_code=400,
            detail="No resume provided. Upload resume_file, paste resume_text, or upload a resume via /recommend/pdf first.",
        )

    try:
        engine = _engine()
        # Embed resume_text and jd_text separately using the existing BERT encoder
        embeddings = engine.encode([final_resume_text, final_jd_text], max_length=512)
        vec_resume = embeddings[0]
        vec_jd = embeddings[1]

        # Compute cosine similarity directly between embedding vectors
        cosine_sim = float(np.dot(vec_resume, vec_jd))

        # Convert cosine similarity to match percentage (0-100 scale, rounded to 1 decimal place)
        match_pct = round(float(np.clip(cosine_sim, 0.0, 1.0)) * 100, 1)

        # Run skill vocabulary extractor on BOTH resume_text and jd_text
        resume_skills = set(extract_skills(final_resume_text))
        jd_skills = set(extract_skills(final_jd_text))

        # Skill gap = skills present in jd_text but NOT in resume_text
        skill_gap = sorted(jd_skills - resume_skills)

        # Skill overlap = intersection of both skill sets
        skill_overlap = sorted(resume_skills & jd_skills)

        return JDMatchOut(
            match_percent=match_pct,
            skill_overlap=skill_overlap,
            skill_gap=skill_gap,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


