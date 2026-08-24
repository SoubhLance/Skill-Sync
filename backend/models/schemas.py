"""
models/schemas.py
-----------------
Pydantic v2 request / response models.
Field names match the notebook's job_metadata.json keys exactly.
"""

from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


# ── Requests ──────────────────────────────────────────────────────────────────

class SkillsRequest(BaseModel):
    """POST /recommend"""
    skills: str = Field(
        ...,
        min_length=2,
        description="Comma-separated skill string  e.g. 'Python, Machine Learning, FastAPI'",
        examples=["Python, Machine Learning, PyTorch, FastAPI, Docker"],
    )
    top_k: int = Field(10, ge=1, le=30, description="Number of results to return")
    profile_score: float = Field(0.0, ge=0.0, le=1.0, description="Aggregated profile score from GitHub/LeetCode/CodeChef/HackerRank (0-1)")
    domain_filter: Optional[str] = Field(
        None,
        description="Return only jobs from this domain  e.g. 'Technical', 'Finance', 'Medical'",
    )
    exp_filter: Optional[float] = Field(
        None,
        description="0=Beginner  1=Entry-level  2=Mid-level  3=Senior-level",
    )
    student_track: Optional[Literal["cs", "non_cs"]] = Field(
        None,
        description="Candidate track: 'cs' (full profile scoring) or 'non_cs' (semantic match only). Inferred if omitted.",
    )

    @field_validator("exp_filter")
    @classmethod
    def _valid_exp(cls, v):
        if v is not None and v not in (0.0, 1.0, 2.0, 3.0):
            raise ValueError("exp_filter must be 0, 1, 2, or 3")
        return v


class ResumeTextRequest(BaseModel):
    """POST /recommend/resume"""
    resume_text: str = Field(..., min_length=50, description="Raw text pasted from a resume")
    top_k: int = Field(10, ge=1, le=30)
    profile_score: float = Field(0.0, ge=0.0, le=1.0)
    domain_filter: Optional[str]  = None
    exp_filter:    Optional[float] = None
    student_track: Optional[Literal["cs", "non_cs"]] = Field(
        None,
        description="Candidate track: 'cs' or 'non_cs'. Inferred if omitted.",
    )


class ExtractRequest(BaseModel):
    """POST /extract-skills"""
    text: str = Field(..., min_length=5)


class ProfileRequest(BaseModel):
    """POST /extract-profile"""
    github:           Optional[str] = Field(None, description="GitHub username", example="soubhlance")
    leetcode:         Optional[str] = Field(None, description="LeetCode username", example="tourist")
    codechef:         Optional[str] = Field(None, description="CodeChef username", example="tourist")
    hackerrank:       Optional[str] = Field(None, description="HackerRank username", example="tourist")
    hackathon_wins:   int           = Field(0, ge=0, description="Self-reported hackathon wins (+0.05 bonus)")
    papers_published: int           = Field(0, ge=0, description="Self-reported research papers (+0.08 bonus)")


# ── Responses ─────────────────────────────────────────────────────────────────


class JobMatchOut(BaseModel):
    job_id:           int
    job_role:         str
    domain:           str
    experience_label: str
    experience_level: float
    skills:           str
    skills_list:      list[str]
    projects:         str
    companies:        str
    salary_range:     str
    salary_min:       int
    salary_max:       int
    salary_avg:       int
    has_salary_data:  bool
    skill_count:      int
    semantic_score:   float = Field(..., description="Raw cosine similarity 0-1")
    blended_score:    float = Field(..., description="Weighted final score 0-1")
    skill_overlap:    list[str] = Field(..., description="Skills candidate has that job needs")
    skill_gap:        list[str] = Field(..., description="Skills job needs that candidate lacks")
    match_pct:        float  = Field(..., description="% of job skills candidate already has")


class RecommendOut(BaseModel):
    matches:          list[JobMatchOut]
    candidate_skills: list[str]
    query_ms:         float
    total_jobs:       int
    weights:          dict[str, float]
    student_track:    str = Field("cs", description="Track evaluated: 'cs' or 'non_cs'")


class ExtractOut(BaseModel):
    """Legacy flat response — kept for backward compatibility."""
    skills:           list[str]
    skill_count:      int
    primary_skills:   list[str] = Field(default_factory=list)
    secondary_skills: list[str] = Field(default_factory=list)


class ExtractDetailedOut(BaseModel):
    """Rich skill & resume signal extraction response with OCR & project link evaluation."""
    all_skills:         list[str]      = Field(..., description="Every skill found in the text")
    primary_skills:     list[str]      = Field(..., description="Skills from dedicated skill sections (higher confidence)")
    secondary_skills:   list[str]      = Field(..., description="Skills from experience / project descriptions")
    skill_count:        int            = Field(..., description="Total unique skills found")
    pages:              int            = Field(0,   description="Number of PDF/image pages parsed")
    method:             Optional[str]  = Field(None, description="Extraction method: 'text_layer', 'ocr_pdf', 'ocr_image', or 'failed'")
    is_low_confidence:  Optional[bool] = Field(None, description="True if OCR confidence is low (<60) or best-effort")
    ocr_confidence:     Optional[float]= Field(None, description="Average OCR confidence score (0-100) if OCR was used")
    warnings:           list[str]      = Field(default_factory=list, description="Warnings or notices from extraction process")

    # ── Extracted Structured Signals & Project Link Quality ──
    github_url:         Optional[str]  = Field(None, description="Extracted GitHub profile URL")
    linkedin_url:       Optional[str]  = Field(None, description="Extracted LinkedIn profile URL")
    emails:             list[str]      = Field(default_factory=list, description="Extracted email addresses")
    phone_numbers:      list[str]      = Field(default_factory=list, description="Extracted phone numbers")
    achievements:       list[str]      = Field(default_factory=list, description="Extracted achievements & honors")
    projects:           list[dict]     = Field(default_factory=list, description="Extracted projects with repository/demo link status ('good' vs 'bad')")
    projects_summary:   dict           = Field(default_factory=dict, description="Summary of project link quality evaluation")




class ProfileOut(BaseModel):
    """Response from POST /extract-profile"""
    github:           Optional[dict] = Field(None, description="GitHub stats or null if failed/not provided")
    leetcode:         Optional[dict] = Field(None, description="LeetCode stats or null if failed/not provided")
    codechef:         Optional[dict] = Field(None, description="CodeChef stats or null if failed/not provided")
    hackerrank:       Optional[dict] = Field(None, description="HackerRank stats or null if failed/not provided")
    profile_score:    float          = Field(..., description="Normalized profile readiness score in [0.0, 1.0]")
    base_score:       float          = Field(0.0, description="Base score prior to self-reported bonuses")
    bonus_applied:    dict           = Field(default_factory=dict, description="Bonuses applied (self_reported: True)")
    active_platforms: list[str]      = Field(..., description="List of platform names successfully extracted")


class HealthOut(BaseModel):
    model_config = {"protected_namespaces": ()}
    status:      str
    model_id:    str
    dimensions:  int
    jobs_indexed: int
    device:      str
    version:     str

