"""
LinkedIn PDF Profile Scorer
----------------------------
Parses a LinkedIn "Save to PDF" export (text-based, not scanned) and produces
a structured completeness/quality score with actionable gaps.

No real OCR is needed for standard LinkedIn exports since they contain
selectable text. This module uses PyMuPDF (fitz) to read text spans with
font-size/weight metadata, which lets us detect section headers reliably
(LinkedIn renders section titles in a larger/bold font than body text).

If you ever need to support scanned/image-only PDFs, see the optional
`ocr_fallback.py` companion module which uses pytesseract on rasterized
pages.

Usage:
    from linkedin_scorer import score_linkedin_pdf
    result = score_linkedin_pdf("profile.pdf")
    print(result)
"""

import re
import statistics
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional

import pymupdf as fitz  # PyMuPDF (using new import name)


# ---------------------------------------------------------------------------
# 1. LOW-LEVEL PDF TEXT EXTRACTION
# ---------------------------------------------------------------------------

@dataclass
class Span:
    text: str
    size: float
    bold: bool
    page: int


def extract_spans(pdf_path: str) -> List[Span]:
    """Extract all text spans with font metadata from the PDF."""
    spans: List[Span] = []
    doc = fitz.open(pdf_path)
    for page_num, page in enumerate(doc):
        page_dict = page.get_text("dict")
        for block in page_dict.get("blocks", []):
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span["text"].strip()
                    if not text:
                        continue
                    spans.append(
                        Span(
                            text=text,
                            size=round(span["size"], 1),
                            bold="Bold" in span["font"] or "bold" in span["font"],
                            page=page_num,
                        )
                    )
    doc.close()
    return spans


# ---------------------------------------------------------------------------
# 2. SECTION DETECTION
# ---------------------------------------------------------------------------

# Canonical LinkedIn section header names we try to match against
KNOWN_HEADERS = [
    "Summary", "About",
    "Experience",
    "Education",
    "Licenses & Certifications", "Licenses and Certifications",
    "Skills",
    "Recommendations",
    "Projects",
    "Publications",
    "Honors & Awards", "Honors and Awards",
    "Volunteering",
    "Languages",
    "Featured",
    "Interests",
]

HEADER_NORMALIZE = {
    "summary": "about",
    "about": "about",
    "experience": "experience",
    "education": "education",
    "licenses & certifications": "certifications",
    "licenses and certifications": "certifications",
    "skills": "skills",
    "recommendations": "recommendations",
    "projects": "projects",
    "publications": "publications",
    "honors & awards": "honors",
    "honors and awards": "honors",
    "volunteering": "volunteering",
    "languages": "languages",
    "featured": "featured",
    "interests": "interests",
}


def detect_sections(spans: List[Span]) -> Dict[str, List[Span]]:
    """
    Split the flat span list into named sections.

    Strategy: find spans whose (normalized) text matches a known LinkedIn
    header AND which are visually distinct (larger or bold relative to the
    surrounding body text). Everything between one header and the next
    belongs to that section.
    """
    if not spans:
        return {}

    body_sizes = [s.size for s in spans]
    median_size = statistics.median(body_sizes) if body_sizes else 10.0

    header_indices = []
    for i, s in enumerate(spans):
        norm = s.text.strip().lower().rstrip(":")
        if norm in HEADER_NORMALIZE and (s.bold or s.size > median_size + 1):
            header_indices.append((i, HEADER_NORMALIZE[norm]))

    sections: Dict[str, List[Span]] = {}
    # Anything before the first detected header is treated as the header
    # block (name, headline, contact info).
    first_idx = header_indices[0][0] if header_indices else len(spans)
    sections["_header_block"] = spans[0:first_idx]

    for idx, (pos, name) in enumerate(header_indices):
        end = header_indices[idx + 1][0] if idx + 1 < len(header_indices) else len(spans)
        # skip the header span itself
        sections.setdefault(name, [])
        sections[name].extend(spans[pos + 1:end])

    return sections


def section_text(spans: List[Span]) -> str:
    return " ".join(s.text for s in spans).strip()


# ---------------------------------------------------------------------------
# 3. FIELD-LEVEL PARSING
# ---------------------------------------------------------------------------

DATE_RANGE_RE = re.compile(
    r"([A-Z][a-z]{2,8}\.?\s+\d{4}|\d{4})\s*[-–—]\s*"
    r"(Present|present|[A-Z][a-z]{2,8}\.?\s+\d{4}|\d{4})"
)

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_month_year(token: str) -> Optional[datetime]:
    token = token.strip().rstrip(".")
    if token.lower() == "present":
        return datetime.now()
    parts = token.split()
    try:
        if len(parts) == 2:
            month = MONTHS.get(parts[0][:3].lower())
            year = int(parts[1])
            if month:
                return datetime(year, month, 1)
        if len(parts) == 1 and parts[0].isdigit():
            return datetime(int(parts[0]), 1, 1)
    except (ValueError, KeyError):
        return None
    return None


@dataclass
class ExperienceEntry:
    raw_text: str
    title: Optional[str] = None
    company: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    duration_months: Optional[int] = None
    has_description: bool = False
    bullet_count: int = 0
    has_quantified_impact: bool = False


NUMBER_METRIC_RE = re.compile(r"\d+(\.\d+)?\s*(%|percent|x\b|k\+|k\b|million|users|customers)", re.I)


def parse_experience(spans: List[Span]) -> List[ExperienceEntry]:
    """
    Heuristic split of the Experience section into individual roles.
    LinkedIn typically renders each role's job title in bold, slightly
    larger than the description text that follows it.
    """
    if not spans:
        return []

    sizes = [s.size for s in spans]
    median = statistics.median(sizes)

    entries: List[ExperienceEntry] = []
    current: List[Span] = []

    def flush(chunk: List[Span]):
        if not chunk:
            return
        text = section_text(chunk)
        entry = ExperienceEntry(raw_text=text)

        date_match = DATE_RANGE_RE.search(text)
        if date_match:
            start = _parse_month_year(date_match.group(1))
            end = _parse_month_year(date_match.group(2))
            entry.start, entry.end = start, end
            if start and end:
                entry.duration_months = max(
                    0, (end.year - start.year) * 12 + (end.month - start.month)
                )

        # crude title/company split: first bold/large line is usually
        # "Title" and the next is "Company · Employment type"
        lines = [c.text for c in chunk if c.bold or c.size > median]
        if lines:
            entry.title = lines[0]
        if len(lines) > 1:
            entry.company = lines[1]

        body = text
        entry.has_description = len(body) > 40
        entry.bullet_count = body.count("•") + body.count("- ") + text.count("\n- ")
        entry.has_quantified_impact = bool(NUMBER_METRIC_RE.search(body))
        entries.append(entry)

    # A new entry starts whenever we hit a bold/large span after having
    # already accumulated some body text (rough but effective heuristic).
    seen_body_since_header = False
    for s in spans:
        is_header_like = s.bold or s.size > median + 0.5
        if is_header_like and seen_body_since_header:
            flush(current)
            current = [s]
            seen_body_since_header = False
        else:
            current.append(s)
            if not is_header_like:
                seen_body_since_header = True
    flush(current)

    return entries


def parse_skills(spans: List[Span]) -> List[str]:
    text = section_text(spans)
    # LinkedIn skill exports are usually comma or newline separated
    raw = re.split(r"[,\n•]", text)
    skills = [s.strip() for s in raw if s.strip() and len(s.strip()) < 60]
    # de-duplicate, preserve order
    seen = set()
    out = []
    for s in skills:
        key = s.lower()
        if key not in seen:
            seen.add(key)
            out.append(s)
    return out


# ---------------------------------------------------------------------------
# 4. SCORING
# ---------------------------------------------------------------------------

WEIGHTS = {
    "headline": 0.10,
    "about": 0.20,
    "experience": 0.25,
    "skills": 0.15,
    "education": 0.10,
    "projects": 0.10,
    "recommendations": 0.05,
    "certifications_bonus": 0.05,
}


@dataclass
class ScoreResult:
    score: int
    breakdown: Dict[str, float] = field(default_factory=dict)
    gaps: List[str] = field(default_factory=list)
    sections_detected: List[str] = field(default_factory=list)


def score_headline(header_spans: List[Span]) -> (float, List[str]):
    text = section_text(header_spans)
    gaps = []
    # crude heuristic: header block text minus the person's name line
    # tends to include the headline; just judge overall descriptiveness
    headline_candidates = [s.text for s in header_spans if 15 < len(s.text) < 220]
    headline = headline_candidates[0] if headline_candidates else ""

    score = 10.0
    if not headline:
        gaps.append("No descriptive headline detected under your name — "
                     "add a keyword-rich headline instead of just your job title.")
        score = 2.0
    elif len(headline) < 40:
        gaps.append("Headline is short — expand it beyond your job title with "
                     "skills or focus areas recruiters search for.")
        score = 6.0
    return score, gaps


def score_about(spans: List[Span]) -> (float, List[str]):
    text = section_text(spans)
    gaps = []
    if not text:
        return 0.0, ["About section is missing entirely — add a 3-5 sentence "
                      "narrative summary; profiles with an About section get "
                      "significantly more views."]
    score = 20.0
    if len(text) < 150:
        score = 8.0
        gaps.append("About section is very short (<150 characters) — expand "
                     "with your background, focus area, and what you're looking for.")
    elif len(text) < 300:
        score = 14.0
        gaps.append("About section could be longer — aim for 300+ characters "
                     "with a clear narrative and 1-2 quantified achievements.")
    if not NUMBER_METRIC_RE.search(text):
        score -= 2
        gaps.append("About section has no quantified achievements (numbers, "
                     "%, metrics) — adding one strengthens credibility.")
    return max(score, 0), gaps


def score_experience(entries: List[ExperienceEntry]) -> (float, List[str]):
    gaps = []
    if not entries:
        return 0.0, ["No Experience entries detected — add at least one role, "
                      "even an internship or academic project role."]

    max_score = 25.0
    per_entry = max_score / max(len(entries), 1)
    total = 0.0
    no_desc = 0
    no_bullets = 0
    no_metrics = 0

    for e in entries:
        entry_score = 0.0
        if e.has_description:
            entry_score += per_entry * 0.4
        else:
            no_desc += 1
        if e.bullet_count >= 2:
            entry_score += per_entry * 0.3
        else:
            no_bullets += 1
        if e.has_quantified_impact:
            entry_score += per_entry * 0.3
        else:
            no_metrics += 1
        total += entry_score

    if no_desc:
        gaps.append(f"{no_desc} of {len(entries)} role(s) have no description — "
                     f"add 2-4 bullet points per role.")
    if no_bullets:
        gaps.append(f"{no_bullets} of {len(entries)} role(s) have fewer than 2 "
                     f"bullet points — recruiters scan bullets, not paragraphs.")
    if no_metrics:
        gaps.append(f"{no_metrics} of {len(entries)} role(s) have no quantified "
                     f"impact (numbers, %, scale) — add measurable outcomes.")

    # gap detection between roles
    dated = [e for e in entries if e.start and e.end]
    dated.sort(key=lambda e: e.start)
    for a, b in zip(dated, dated[1:]):
        if a.end and b.start:
            gap_months = (b.start.year - a.end.year) * 12 + (b.start.month - a.end.month)
            if gap_months > 6:
                gaps.append(f"Unexplained gap of ~{gap_months} months between roles "
                            f"— consider adding context (study, freelance, etc.)")

    return round(total, 1), gaps


def score_skills(skills: List[str]) -> (float, List[str]):
    gaps = []
    count = len(skills)
    if count == 0:
        return 0.0, ["No Skills listed — add at least 15-20 relevant skills; "
                      "profiles with more skills surface in more recruiter searches."]
    if count < 5:
        score = 4.0
        gaps.append(f"Only {count} skills listed — add more (aim for 15-20+).")
    elif count < 15:
        score = 10.0
        gaps.append(f"{count} skills listed — LinkedIn profiles with 20+ skills "
                     f"get significantly more recruiter searches; add more.")
    else:
        score = 15.0
    return score, gaps


def score_education(spans: List[Span]) -> (float, List[str]):
    text = section_text(spans)
    if not text:
        return 0.0, ["No Education entries detected — add your degree(s)."]
    return 10.0, []


def score_projects(spans: List[Span]) -> (float, List[str]):
    text = section_text(spans)
    if not text:
        return 0.0, ["No Projects/Featured section detected — add 1-2 projects "
                      "with links; this is a strong signal for technical roles."]
    return 10.0, []


def score_recommendations(spans: List[Span]) -> (float, List[str]):
    text = section_text(spans)
    if not text:
        return 0.0, ["No Recommendations — ask a manager, professor, or "
                      "teammate for one; even 1-2 boosts credibility."]
    return 5.0, []


def score_certifications(spans: List[Span]) -> (float, List[str]):
    text = section_text(spans)
    if not text:
        return 0.0, []  # bonus only, not penalized in gaps
    return 5.0, []


def score_linkedin_pdf(pdf_path: str) -> ScoreResult:
    spans = extract_spans(pdf_path)
    if not spans:
        return ScoreResult(
            score=0,
            breakdown={},
            gaps=["Could not extract any text from this PDF. If this is a "
                  "scanned/image-only export, use the OCR fallback path "
                  "instead of the standard text extractor."],
            sections_detected=[],
        )

    sections = detect_sections(spans)

    headline_score, headline_gaps = score_headline(sections.get("_header_block", []))
    about_score, about_gaps = score_about(sections.get("about", []))

    experience_entries = parse_experience(sections.get("experience", []))
    experience_score, experience_gaps = score_experience(experience_entries)

    skills_list = parse_skills(sections.get("skills", []))
    skills_score, skills_gaps = score_skills(skills_list)

    education_score, education_gaps = score_education(sections.get("education", []))
    projects_score, projects_gaps = score_projects(
        sections.get("projects", []) or sections.get("featured", [])
    )
    recs_score, recs_gaps = score_recommendations(sections.get("recommendations", []))
    certs_score, certs_gaps = score_certifications(sections.get("certifications", []))

    breakdown = {
        "headline": round(headline_score, 1),
        "about": round(about_score, 1),
        "experience": round(experience_score, 1),
        "skills": round(skills_score, 1),
        "education": round(education_score, 1),
        "projects": round(projects_score, 1),
        "recommendations": round(recs_score, 1),
        "certifications_bonus": round(certs_score, 1),
    }

    total = sum(breakdown.values())
    total = min(round(total), 100)

    all_gaps = (
        headline_gaps + about_gaps + experience_gaps + skills_gaps
        + education_gaps + projects_gaps + recs_gaps + certs_gaps
    )

    detected = [k for k in sections.keys() if k != "_header_block" and sections[k]]

    return ScoreResult(
        score=total,
        breakdown=breakdown,
        gaps=all_gaps,
        sections_detected=detected,
    )


if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python linkedin_scorer.py <path_to_linkedin_export.pdf>")
        sys.exit(1)

    result = score_linkedin_pdf(sys.argv[1])
    print(json.dumps(result.__dict__, indent=2, default=str))
