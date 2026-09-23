"""
backend/core/jd_matcher.py
===========================
ATS-Grade Pairwise Job Description (JD) vs Resume Matching Engine.

Core Innovations:
1. High-Signal Input Conditioning:
   Prioritizes core technical competencies and extracted qualifications to avoid
   noise dilution from general HR / formatting boilerplate.

2. Anisotropy-Calibrated BERT Embeddings:
   Raw BERT cosine similarity collapses into a narrow cone (0.50 - 0.95), which
   previously caused unrelated roles (e.g. nurse vs backend dev) to receive ~60-80% scores.
   We map raw cosine onto a calibrated [0.0, 1.0] contextual similarity scale.

3. Hybrid Multi-Factor ATS Scoring:
   - Skill Coverage (65% weight when JD specifies skills): Proportion of required skills
     the candidate demonstrably possesses, plus an allowance for relevant technical breadth.
   - Zero-Overlap Guardrail: If a JD requires specific core skills and the candidate matches
     ZERO of them, the score is strictly dampened (<= 20%), preventing false positives.
   - Contextual Semantic Fit (35% weight): Evaluates architectural scope, tooling alignment,
     and experience depth.
   - 100% Skill Guarantee: If candidate has all required skills, score is guaranteed >= 90%.
   - Full Fallback: If JD has no recognized skills (narrative JD), dynamically shifts to
     calibrated semantic similarity.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import numpy as np

from .engine import Engine
from .extractor import extract_skills, extract_skills_from_resume


@dataclass
class JDMatchResult:
    match_percent: float
    skill_overlap: list[str]
    skill_gap: list[str]
    candidate_skills: list[str]
    jd_skills: list[str]
    skill_score: float
    semantic_score: float
    match_label: str

    def to_dict(self) -> dict:
        return {
            "match_percent": self.match_percent,
            "skill_overlap": self.skill_overlap,
            "skill_gap": self.skill_gap,
            "candidate_skills": self.candidate_skills,
            "jd_skills": self.jd_skills,
            "skill_score": self.skill_score,
            "semantic_score": self.semantic_score,
            "match_label": self.match_label,
        }


def _get_match_label(match_pct: float) -> str:
    if match_pct >= 85.0:
        return "Strong Match"
    if match_pct >= 70.0:
        return "Good Match"
    if match_pct >= 50.0:
        return "Moderate Match"
    if match_pct >= 25.0:
        return "Low Match"
    return "Skill Pivot Needed"


def match_resume_to_jd(
    resume_text: str,
    jd_text: str,
    engine: Optional[Engine] = None,
) -> JDMatchResult:
    """
    Perform deep pairwise matching between raw resume text and job description text.

    Args:
        resume_text: Cleaned or raw text from candidate resume.
        jd_text: Cleaned or raw text from target job description.
        engine: Singleton Engine instance (loads default if None).

    Returns:
        JDMatchResult containing match_percent, skill_overlap, skill_gap,
        breakdown scores, and qualitative match label.
    """
    if engine is None:
        engine = Engine.get()

    clean_resume = " ".join(resume_text.split()).strip()
    clean_jd = " ".join(jd_text.split()).strip()

    # 1. Skill Extraction
    cand_skill_data = extract_skills_from_resume(clean_resume)
    cand_skills_list = cand_skill_data.get("all_skills", [])
    if not cand_skills_list:
        cand_skills_list = extract_skills(clean_resume)

    jd_skills_list = extract_skills(clean_jd)

    cand_set = set(cand_skills_list)
    jd_set = set(jd_skills_list)

    skill_overlap = sorted(cand_set & jd_set)
    skill_gap = sorted(jd_set - cand_set)
    extra_skills = sorted(cand_set - jd_set)

    num_jd = len(jd_set)
    num_overlap = len(skill_overlap)

    # 2. Skill Alignment Score
    if num_jd > 0:
        if num_overlap == 0:
            skill_score = 0.0
        else:
            base_coverage = num_overlap / num_jd
            # Minor breadth bonus for possessing other relevant engineering skills (max +6%)
            breadth_bonus = min(0.06, len(extra_skills) * 0.01)
            skill_score = min(1.0, base_coverage + breadth_bonus)
    else:
        skill_score = 1.0 if len(cand_set) > 0 else 0.5

    # 3. Calibrated Semantic Similarity via BERT
    # Check for identical or nearly identical inputs first
    if clean_resume.lower() == clean_jd.lower():
        calibrated_semantic = 1.0
        final_score = 1.0
        match_pct = 100.0
        return JDMatchResult(
            match_percent=match_pct,
            skill_overlap=skill_overlap,
            skill_gap=[],
            candidate_skills=sorted(cand_set),
            jd_skills=sorted(jd_set),
            skill_score=1.0,
            semantic_score=1.0,
            match_label=_get_match_label(match_pct),
        )

    # Prepare conditioned texts emphasizing core skills + context
    cand_embed_text = (
        f"Candidate Profile Skills: {', '.join(cand_skills_list)}. Experience: {clean_resume[:900]}"
        if cand_skills_list
        else f"Candidate Profile Experience: {clean_resume[:1000]}"
    )

    jd_embed_text = (
        f"Job Description Core Requirements: {', '.join(jd_skills_list)}. Responsibilities: {clean_jd[:900]}"
        if jd_skills_list
        else f"Job Description Requirements: {clean_jd[:1000]}"
    )

    embeddings = engine.encode([cand_embed_text, jd_embed_text], max_length=512)
    vec_resume = embeddings[0]
    vec_jd = embeddings[1]

    raw_cosine = float(np.dot(vec_resume, vec_jd))

    # Calibration: BERT base uncased technical cosine typically spans [0.48, 0.95]
    # Linear projection to [0.0, 1.0]
    RAW_LOWER = 0.48
    RAW_UPPER = 0.95
    calibrated_semantic = float(np.clip((raw_cosine - RAW_LOWER) / (RAW_UPPER - RAW_LOWER), 0.0, 1.0))

    # 4. Multi-Factor Hybrid Composite Score
    if num_jd > 0:
        if num_overlap == 0:
            # ZERO OVERLAP GUARDRAIL:
            # If the job requires explicit skills and candidate matches NONE of them,
            # clamp final score strictly to avoid false positive ~80% matches.
            final_score = min(0.18, calibrated_semantic * 0.22)
        else:
            # 65% skill coverage + 35% calibrated semantic fit
            composite = 0.65 * skill_score + 0.35 * calibrated_semantic

            # If all required skills are met, guarantee top-tier match
            if len(skill_gap) == 0:
                composite = max(composite, 0.90 + 0.10 * calibrated_semantic)

            final_score = composite
    else:
        # Fallback when JD text contains no recognized skill vocabulary tokens
        cand_boost = 0.08 if len(cand_set) > 0 else 0.0
        final_score = min(1.0, calibrated_semantic * 0.92 + cand_boost)

    match_pct = round(float(np.clip(final_score * 100.0, 0.0, 100.0)), 1)

    return JDMatchResult(
        match_percent=match_pct,
        skill_overlap=skill_overlap,
        skill_gap=skill_gap,
        candidate_skills=sorted(cand_set),
        jd_skills=sorted(jd_set),
        skill_score=round(float(skill_score), 4),
        semantic_score=round(float(calibrated_semantic), 4),
        match_label=_get_match_label(match_pct),
    )
