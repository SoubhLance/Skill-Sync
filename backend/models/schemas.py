"""
models/schemas.py
-----------------
Pydantic v2 request / response models.
Field names match the notebook's job_metadata.json keys exactly.
"""

from __future__ import annotations
from typing import Optional
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
    profile_score: float = Field(0.0, ge=0.0, le=1.0, description="GitHub/LinkedIn score (0-1)")
    dsa_score:     float = Field(0.0, ge=0.0, le=1.0, description="DSA tracker score (0-1)")
    domain_filter: Optional[str] = Field(
        None,
        description="Return only jobs from this domain  e.g. 'Technical', 'Finance', 'Medical'",
    )
    exp_filter: Optional[float] = Field(
        None,
        description="0=Beginner  1=Entry-level  2=Mid-level  3=Senior-level",
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
    dsa_score:     float = Field(0.0, ge=0.0, le=1.0)
    domain_filter: Optional[str]  = None
    exp_filter:    Optional[float] = None


class ExtractRequest(BaseModel):
    """POST /extract-skills"""
    text: str = Field(..., min_length=5)


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


class ExtractOut(BaseModel):
    skills:      list[str]
    skill_count: int


class HealthOut(BaseModel):
    model_config = {"protected_namespaces": ()}
    status:      str
    model_id:    str
    dimensions:  int
    jobs_indexed: int
    device:      str
    version:     str
