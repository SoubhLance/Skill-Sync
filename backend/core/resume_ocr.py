"""
backend/core/resume_ocr.py
=========================
Resume text & signal extraction for SkillSync.

Handles three input formats:
1. Digital PDF (has a text layer)      -> pdfplumber (fast, exact + hyperlink extraction)
2. Scanned PDF (image-only pages)      -> pdf2image + pytesseract OCR
3. Photo upload (JPG/PNG/WEBP/BMP)     -> Pillow + pytesseract OCR

Features:
- PDF Hyperlink Extraction: Extracts embedded PDF hyperlink annotations (`mailto:`, `github.com`, `linkedin.com`, live demos) that plain text extractors miss.
- Contact & Profile Link Parsing: Candidate GitHub URL, LinkedIn URL, emails, and phone numbers.
- Section Parsing: Extracts skills, achievements, awards, education, and experience.
- Project Link Quality Evaluation: For each project, extracts tech stack, descriptions, and repository/demo links. Evaluates each project's link status:
  - `link_status: "good"` if a GitHub repository or live demo link is present.
  - `link_status: "bad"` if no repository/demo link is provided.
  - `verdict_reason`: Clear human-readable quality justification.
"""

from __future__ import annotations

import io
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal, Optional

import sys
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

logger = logging.getLogger(__name__)

# ── Optional dependency imports, fail gracefully with clear warnings ──────────
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

try:
    from pdf2image import convert_from_bytes, convert_from_path
except ImportError:
    convert_from_path = None
    convert_from_bytes = None

try:
    from backend.core.extractor import extract_skills_from_resume
except ImportError:
    try:
        from .extractor import extract_skills_from_resume
    except ImportError:
        extract_skills_from_resume = None



# ── Result Container ────────────────────────────────────────────────────────

@dataclass
class ExtractionResult:
    text: str
    method: Literal["text_layer", "ocr_pdf", "ocr_image", "failed"]
    pages_total: int = 0
    pages_ocr: int = 0                       # how many pages needed OCR fallback
    avg_ocr_confidence: float | None = None   # 0-100, only set when OCR was used
    warnings: list[str] = field(default_factory=list)

    # ── Extracted Structured Signals ──
    name: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    leetcode_url: str | None = None
    emails: list[str] = field(default_factory=list)
    phone_numbers: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    achievements: list[str] = field(default_factory=list)
    education: list[dict[str, Any]] = field(default_factory=list)
    experience: list[dict[str, Any]] = field(default_factory=list)
    projects: list[dict[str, Any]] = field(default_factory=list)
    projects_summary: dict[str, Any] = field(default_factory=dict)

    @property
    def is_low_confidence(self) -> bool:
        """
        Treat output as low-confidence if OCR score < 60 or method failed.
        """
        if self.method == "failed":
            return True
        if self.avg_ocr_confidence is not None and self.avg_ocr_confidence < 60:
            return True
        return False


MIN_CHARS_FOR_TEXT_LAYER = 40  # below this, treat page as scanned image


# ── Structured Signal Extraction Helpers ─────────────────────────────────────

# Section header keywords (normalized lowercase) for resume parsing
_SEC_KEYWORDS: list[str] = [
    "summary", "objective", "profile",
    "education", "academic background",
    "experience", "work experience", "professional experience", "employment",
    "internship", "internships",
    "projects", "personal projects", "academic projects", "key projects",
    "technical skills", "skills", "core competencies", "technologies",
    "achievements", "honors & awards", "honors and awards", "awards",
    "certifications", "certificates", "licenses",
    "publications", "research",
    "extracurricular", "activities", "volunteer",
    "references",
]

def _is_section_header(line: str) -> str | None:
    """
    Return the matched section keyword if *line* looks like a resume section
    header, else None.  Handles:
      - Exact match ("Education")
      - Trailing colon / pipe ("Technical Skills:" or "SKILLS |")
      - ALL-CAPS single-word ("EXPERIENCE")
      - Prefix match ("Work Experience  2021 – 2024")
    """
    stripped = line.strip()
    if not stripped or len(stripped) > 80:
        return None

    # Normalize: lowercase, strip trailing colon / pipe / dashes / underscores
    norm = re.sub(r"[\s|:\-_]+$", "", stripped).lower()
    # Also strip leading special chars sometimes seen in OCR
    norm = re.sub(r"^[\s|:\-_]+", "", norm)

    for kw in _SEC_KEYWORDS:
        if norm == kw:
            return kw
        # Allow "Technical Skills & Tools" → still matches "technical skills"
        if norm.startswith(kw + " ") or norm.startswith(kw + ":"):
            return kw
        # Suffix: "My Work Experience" → matches "work experience"
        if norm.endswith(" " + kw):
            return kw

    return None


def _looks_like_name(line: str) -> bool:
    """
    Heuristic: a line is likely a name if it has 2-5 title-cased words,
    no digits, no URLs, no @-signs, and is short (< 50 chars).
    """
    s = line.strip()
    if not s or len(s) > 50:
        return False
    if re.search(r"[\d@:/]", s):
        return False
    words = s.split()
    if len(words) < 2 or len(words) > 5:
        return False
    # All words should start with uppercase (title case) — allow small
    # connecting words like "de", "van"
    small_words = {"de", "van", "von", "di", "la", "le", "el", "al", "bin"}
    for w in words:
        if w.lower() in small_words:
            continue
        if not w[0].isupper():
            return False
    return True


def _parse_phone_numbers(text: str) -> list[str]:
    """
    Extract phone numbers with tighter regex to avoid matching dates and IDs.
    Requires either a leading +, or common phone patterns like (xxx) or area codes.
    """
    patterns = [
        r"\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}",          # +91 (555) 019-2834
        r"\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}",                                     # (555) 019-2834
        r"\+\d[\d\s-]{7,14}\d",                                                    # +1 555 019 2834
    ]
    found: set[str] = set()
    for pat in patterns:
        for m in re.finditer(pat, text):
            candidate = m.group().strip()
            # Skip if it looks like a date (e.g. "2021 - 2024")
            if re.fullmatch(r"\d{4}\s*[-–—]\s*\d{4}", candidate):
                continue
            # Require at least 7 digits
            digits_only = re.sub(r"\D", "", candidate)
            if len(digits_only) >= 7:
                found.add(candidate)
    return sorted(list(found))


def _parse_education(lines: list[str]) -> list[dict[str, str]]:
    """
    Parse education section lines into structured dicts.
    Tries to detect {school, degree, year, score} from each entry.
    """
    entries: list[dict[str, str]] = []
    current: dict[str, str] | None = None

    year_re = re.compile(r"((?:19|20)\d{2})\s*(?:[-–—]\s*(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent))?")
    score_re = re.compile(
        r"(?:CGPA|GPA|CPI|SPI|Percentage|Score|Grade)[:\s]*(\d[\d.]+(?:\s*[/%])?)",
        re.I,
    )
    degree_kws = [
        "b.tech", "m.tech", "b.sc", "m.sc", "b.e", "m.e", "bca", "mca",
        "b.a", "m.a", "bba", "mba", "ph.d", "phd", "diploma", "bachelor",
        "master", "associate", "doctor", "b.com", "m.com", "bsc", "msc",
        "engineering", "computer science",
    ]

    for line in lines:
        s = line.strip()
        if not s:
            continue
        s_lower = s.lower()
        is_bullet = s.startswith(("•", "-", "*", "–", "—"))

        if is_bullet and current:
            # Bullet under current entry — check for score
            clean = s.lstrip("•-*–— ").strip()
            sm = score_re.search(clean)
            if sm and not current.get("score"):
                current["score"] = sm.group(0)
            continue

        # Check if this line starts a new education entry
        has_degree = any(kw in s_lower for kw in degree_kws)
        ym = year_re.search(s)
        # A new entry is likely if it contains a degree keyword or looks like an institution name
        if has_degree or (not is_bullet and len(s) > 8 and not s.startswith(("•", "-", "*"))):
            if current and (current.get("school") or current.get("degree")):
                entries.append(current)

            school = ""
            degree = ""
            year = ""
            score = ""

            # Try to split on common separators
            parts = re.split(r"\s*[|,—–]\s*", s)
            for part in parts:
                p_lower = part.strip().lower()
                if any(kw in p_lower for kw in degree_kws):
                    degree = part.strip()
                elif year_re.search(part):
                    ym2 = year_re.search(part)
                    year = ym2.group(0) if ym2 else ""
                    # If part has more than just the year, it might be school name + year
                    rest = year_re.sub("", part).strip(" -–—,")
                    if rest and not school:
                        school = rest
                elif not school and len(part.strip()) > 2:
                    school = part.strip()

            # Fallback: if we only got year from the whole line
            if not school and not degree:
                school = re.sub(r"[\(\)]", "", year_re.sub("", s)).strip(" -–—,|")

            sm = score_re.search(s)
            if sm:
                score = sm.group(0)

            current = {"school": school, "degree": degree, "year": year, "score": score}
        elif current:
            # Continuation line — try to fill missing fields
            sm = score_re.search(s)
            if sm and not current.get("score"):
                current["score"] = sm.group(0)
            elif not current.get("degree") and has_degree:
                current["degree"] = s
            elif not current.get("school") and not is_bullet:
                current["school"] = s

    if current and (current.get("school") or current.get("degree")):
        entries.append(current)

    return entries


def _parse_experience(lines: list[str]) -> list[dict[str, Any]]:
    """
    Parse experience section lines into structured dicts.
    Tries to detect {role, company, dates, bullets} from each entry.
    """
    entries: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    date_re = re.compile(
        r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
        r"[\s.]*\d{0,4}\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
        r"[\s.]*\d{0,4}|[Pp]resent|[Cc]urrent|\d{4})",
        re.I,
    )
    year_range_re = re.compile(r"((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|[Pp]resent|[Cc]urrent)")
    role_company_re = re.compile(
        r"^(.+?)\s*(?:@|at|,)\s*(.+?)(?:\s*[|—–-]\s*(.+))?$",
        re.I,
    )

    for line in lines:
        s = line.strip()
        if not s:
            continue
        is_bullet = s.startswith(("•", "-", "*", "–", "—")) or bool(re.match(r"^\d+\.\s", s))

        if is_bullet and current:
            clean = s.lstrip("•-*–— ").strip()
            if re.match(r"^\d+\.\s", clean):
                clean = re.sub(r"^\d+\.\s*", "", clean)
            if clean:
                current["bullets"].append(clean)
            continue

        # Check if this looks like an experience header line
        dm = date_re.search(s) or year_range_re.search(s)
        rm = role_company_re.match(s)

        is_new_entry = False
        role = ""
        company = ""
        dates = ""

        if dm:
            dates = dm.group(0).strip()
            is_new_entry = True

        if rm and is_new_entry:
            role = rm.group(1).strip()
            company = rm.group(2).strip()
            if rm.group(3):
                dates = rm.group(3).strip()
        elif is_new_entry:
            # Try splitting on | or —
            parts = re.split(r"\s*[|—–]\s*", s)
            if len(parts) >= 2:
                role = parts[0].strip()
                company = parts[1].strip() if len(parts) > 2 else ""
                # dates may be last part or already extracted
                for p in parts:
                    dm2 = date_re.search(p) or year_range_re.search(p)
                    if dm2:
                        dates = dm2.group(0).strip()
                        # Remove dates from role/company if embedded
                        if p.strip() == role:
                            role = date_re.sub("", year_range_re.sub("", role)).strip(" -–—|,")
                        elif p.strip() == company:
                            company = date_re.sub("", year_range_re.sub("", company)).strip(" -–—|,")
            else:
                # Single line with date — treat whole pre-date part as role
                pre_date = s[:dm.start()].strip(" -–—|,@") if dm else s
                role = pre_date

        if not is_new_entry and not is_bullet:
            # Non-bullet, non-date line — might be a company name or role on its own
            # If we have a current entry with no company, treat as company
            if current and not current.get("company"):
                current["company"] = s
                continue
            elif len(s) > 5 and not s[0].isdigit():
                # Might be starting a new entry without clear date
                is_new_entry = True
                role = s

        if is_new_entry:
            if current and (current.get("role") or current.get("company")):
                entries.append(current)
            current = {"role": role, "company": company, "dates": dates, "bullets": []}

    if current and (current.get("role") or current.get("company")):
        entries.append(current)

    return entries


def _extract_structured_data(
    raw_text: str,
    hyperlinks: list[str],
) -> dict[str, Any]:
    """
    Extract contact links, GitHub/LinkedIn URLs, name, skills, achievements,
    education, experience, and evaluate project link quality ("good" vs "bad").
    """
    clean_links = list(set([l.strip() for l in hyperlinks if l]))

    # 1. Contact & Social Links
    github_url: str | None = None
    linkedin_url: str | None = None
    leetcode_url: str | None = None

    for link in clean_links:
        link_lower = link.lower()
        if "github.com" in link_lower and not github_url:
            m = re.search(r"https?://(?:www\.)?github\.com/([a-zA-Z0-9_-]+)/?$", link, re.I)
            if m and m.group(1).lower() not in ("features", "explore", "topics", "pulls", "issues"):
                github_url = f"https://github.com/{m.group(1)}"
            elif "github.com" in link_lower and not github_url:
                m_repo = re.search(r"https?://(?:www\.)?github\.com/([a-zA-Z0-9_-]+)", link, re.I)
                if m_repo and m_repo.group(1).lower() not in ("features", "explore", "topics"):
                    github_url = f"https://github.com/{m_repo.group(1)}"

        if "linkedin.com" in link_lower and not linkedin_url:
            m = re.search(r"https?://(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)", link, re.I)
            if m:
                linkedin_url = f"https://linkedin.com/in/{m.group(1)}"

        if "leetcode.com" in link_lower and not leetcode_url:
            m = re.search(r"https?://(?:www\.)?leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)", link, re.I)
            if m and m.group(1).lower() not in ("problems", "contest", "explore", "discuss", "studyplan"):
                leetcode_url = f"https://leetcode.com/u/{m.group(1)}"

    # Text regex fallbacks for GitHub, LinkedIn & LeetCode
    if not github_url:
        m = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)", raw_text, re.I)
        if m and m.group(1).lower() not in ("features", "explore", "topics", "pulls"):
            github_url = f"https://github.com/{m.group(1)}"

    if not linkedin_url:
        m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)", raw_text, re.I)
        if m:
            linkedin_url = f"https://linkedin.com/in/{m.group(1)}"

    if not leetcode_url:
        m = re.search(r"(?:https?://)?(?:www\.)?leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)", raw_text, re.I)
        if m and m.group(1).lower() not in ("problems", "contest", "explore", "discuss", "studyplan"):
            leetcode_url = f"https://leetcode.com/u/{m.group(1)}"

    emails = sorted(list(set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", raw_text))))
    phone_numbers = _parse_phone_numbers(raw_text)

    # 2. Section Parsing — improved header detection
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    sec_map: dict[str, list[str]] = {"header": []}
    current_sec = "header"

    for line in lines:
        matched = _is_section_header(line)
        if matched:
            # Normalize similar sections
            if matched in ("work experience", "professional experience", "employment"):
                matched = "experience"
            elif matched in ("technical skills", "core competencies", "technologies"):
                matched = "skills"
            elif matched in ("honors & awards", "honors and awards", "awards"):
                matched = "achievements"
            elif matched in ("certificates", "licenses"):
                matched = "certifications"
            elif matched in ("personal projects", "academic projects", "key projects"):
                matched = "projects"
            elif matched in ("objective", "profile"):
                matched = "summary"
            current_sec = matched
            if current_sec not in sec_map:
                sec_map[current_sec] = []
        else:
            if current_sec not in sec_map:
                sec_map[current_sec] = []
            sec_map[current_sec].append(line)

    # 3. Extract candidate name — heuristic on "header" lines (before any section)
    extracted_name: str | None = None
    header_lines = sec_map.get("header", [])
    for hl in header_lines[:5]:  # name is almost always in the first few lines
        # Skip lines that are emails, phone numbers, URLs
        if "@" in hl or re.search(r"https?://", hl) or re.search(r"\+?\d[\d\s-]{7,}", hl):
            continue
        if _looks_like_name(hl):
            extracted_name = hl.strip()
            break

    # 4. Parse Skills
    extracted_skills: list[str] = []
    if extract_skills_from_resume is not None:
        skill_res = extract_skills_from_resume(raw_text)
        extracted_skills = skill_res.get("all_skills", [])

    # 5. Parse Achievements
    achievements: list[str] = []
    for key in ["achievements", "certifications"]:
        if key in sec_map:
            for l in sec_map[key]:
                clean_bullet = l.lstrip("•-*–— ").strip()
                if clean_bullet:
                    achievements.append(clean_bullet)

    # 6. Parse Education
    edu_lines = sec_map.get("education", []) or sec_map.get("academic background", [])
    education = _parse_education(edu_lines)

    # 7. Parse Experience
    exp_lines = sec_map.get("experience", [])
    experience = _parse_experience(exp_lines)

    # 8. Parse Projects & Evaluate Link Quality
    proj_lines = sec_map.get("projects", [])
    projects: list[dict[str, Any]] = []
    curr_p: dict[str, Any] | None = None

    for line in proj_lines:
        is_bullet = line.startswith(("•", "-", "*", "–", "—")) or bool(re.match(r"^\d+\.", line))
        is_header = False

        if not is_bullet:
            if "|" in line:
                is_header = True
            elif re.search(r"^(?:[A-Z][a-zA-Z0-9_\s-]{2,30})\s*(?:\||-|–|—|\()\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})", line, re.I):
                is_header = True
            elif not line.startswith(("•", "-", "*", "–", "—")) and len(line) < 60 and not projects and not curr_p:
                # First non-bullet short line in projects — likely a project name
                is_header = True

        if is_header:
            if curr_p:
                projects.append(curr_p)

            parts = [p.strip() for p in line.split("|")]
            title = parts[0].strip()
            tech_stack = [t.strip() for t in parts[1:-1]] if len(parts) > 2 else ([parts[1].strip()] if len(parts) > 1 else [])

            curr_p = {
                "name": title,
                "raw_header": line,
                "tech_stack": tech_stack,
                "description_bullets": [],
                "repo_or_demo_link": None,
                "has_link": False,
                "link_status": "bad",
                "verdict_reason": "No GitHub repository or live demo link provided for this project",
            }

            # Link matching logic
            title_clean = re.sub(r"[^a-zA-Z0-9]", "", title.lower())
            for link in clean_links:
                link_lower = link.lower()
                if "/in/" in link_lower:
                    continue
                link_clean = re.sub(r"[^a-zA-Z0-9]", "", link_lower)
                title_words = [w.lower() for w in title.split() if len(w) > 2]
                if title_clean in link_clean or any(w in link_clean for w in title_words):
                    curr_p["repo_or_demo_link"] = link
                    curr_p["has_link"] = True
                    curr_p["link_status"] = "good"
                    curr_p["verdict_reason"] = f"Project has a valid repository/demo link ({link})"
                    break
        else:
            if curr_p:
                clean_bullet = line.lstrip("•-*–— ").strip()
                if clean_bullet:
                    curr_p["description_bullets"].append(clean_bullet)

    if curr_p:
        projects.append(curr_p)

    # Format project descriptions
    for p in projects:
        p["description"] = " ".join(p.pop("description_bullets", []))

    # Overall project link quality summary
    total_p = len(projects)
    linked_p = sum(1 for p in projects if p["has_link"])
    unlinked_p = total_p - linked_p

    if total_p == 0:
        quality_rating = "none_detected"
        summary_msg = "No distinct projects section detected in resume."
    elif linked_p == total_p:
        quality_rating = "good"
        summary_msg = f"Excellent! All {total_p} project(s) include repository or live demo links."
    elif linked_p > 0:
        quality_rating = "acceptable"
        summary_msg = f"Acceptable: {linked_p}/{total_p} projects have links, but {unlinked_p} project(s) lack a repository/demo link."
    else:
        quality_rating = "bad"
        summary_msg = f"Needs Improvement: 0/{total_p} projects have a repository or demo link."

    projects_summary = {
        "total_projects": total_p,
        "linked_projects": linked_p,
        "unlinked_projects": unlinked_p,
        "overall_quality": quality_rating,
        "recommendation": summary_msg,
    }

    return {
        "name": extracted_name,
        "github_url": github_url,
        "linkedin_url": linkedin_url,
        "leetcode_url": leetcode_url,
        "emails": emails,
        "phone_numbers": phone_numbers,
        "skills": extracted_skills,
        "achievements": achievements,
        "education": education,
        "experience": experience,
        "projects": projects,
        "projects_summary": projects_summary,
    }


# ── PDF Extraction Engine ────────────────────────────────────────────────────

def extract_from_pdf(path: str | Path | None = None, file_bytes: bytes | None = None) -> ExtractionResult:
    """
    Extract text and PDF hyperlink annotations from a PDF resume.
    Tries pdfplumber text-layer first; falls back to OCR per-page for scanned image pages.
    """
    if pdfplumber is None:
        return ExtractionResult(
            text="", method="failed",
            warnings=["pdfplumber not installed — run: pip install pdfplumber"],
        )

    if path is None and file_bytes is None:
        return ExtractionResult(text="", method="failed", warnings=["No path or file_bytes provided"])

    source = str(path) if path is not None else io.BytesIO(file_bytes)

    warnings: list[str] = []
    page_texts: list[str] = []
    pages_needing_ocr: list[int] = []
    hyperlinks: list[str] = []

    try:
        with pdfplumber.open(source) as pdf:
            total_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                page_text = (page.extract_text() or "").strip()
                if len(page_text) < MIN_CHARS_FOR_TEXT_LAYER:
                    pages_needing_ocr.append(i)
                    page_texts.append("")
                else:
                    page_texts.append(page_text)

                # Extract PDF hyperlink annotations
                if hasattr(page, "hyperlinks") and page.hyperlinks:
                    for h in page.hyperlinks:
                        uri = h.get("uri")
                        if uri:
                            hyperlinks.append(str(uri))
                elif hasattr(page, "annots") and page.annots:
                    for a in page.annots:
                        uri = a.get("uri") or (a.get("data") or {}).get("A", {}).get("URI")
                        if uri:
                            if isinstance(uri, bytes):
                                uri = uri.decode("utf-8", errors="ignore")
                            hyperlinks.append(str(uri))
    except Exception as exc:
        logger.warning(f"[resume_ocr] pdfplumber error: {exc}")
        return ExtractionResult(text="", method="failed", warnings=[f"pdfplumber error: {exc}"])

    # 1. Pure Digital PDF (No OCR needed)
    if not pages_needing_ocr:
        full_text = "\n\n".join(page_texts).strip()
        structured = _extract_structured_data(full_text, hyperlinks)
        return ExtractionResult(
            text=full_text,
            method="text_layer",
            pages_total=total_pages,
            pages_ocr=0,
            warnings=warnings,
            **structured,
        )

    # 2. Scanned PDF (OCR fallback required)
    if pytesseract is None or convert_from_path is None:
        warnings.append(
            f"{len(pages_needing_ocr)} page(s) appear to be scanned images, but OCR dependencies "
            f"aren't installed (pip install pytesseract pdf2image, plus tesseract-ocr system binary)."
        )
        full_text = "\n\n".join(t for t in page_texts if t).strip()
        structured = _extract_structured_data(full_text, hyperlinks)
        return ExtractionResult(
            text=full_text,
            method="text_layer",
            pages_total=total_pages,
            pages_ocr=0,
            warnings=warnings,
            **structured,
        )

    try:
        if path is not None:
            images = convert_from_path(str(path), dpi=300)
        else:
            images = convert_from_bytes(file_bytes, dpi=300)
    except Exception as exc:
        warnings.append(f"pdf2image conversion failed ({exc}) — is poppler installed?")
        full_text = "\n\n".join(t for t in page_texts if t).strip()
        structured = _extract_structured_data(full_text, hyperlinks)
        return ExtractionResult(
            text=full_text, method="text_layer", pages_total=total_pages,
            pages_ocr=0, warnings=warnings, **structured,
        )

    confidences: list[float] = []
    for page_idx in pages_needing_ocr:
        if page_idx >= len(images):
            continue
        try:
            ocr_text, conf = _ocr_single_image(images[page_idx])
            page_texts[page_idx] = ocr_text
            if conf is not None:
                confidences.append(conf)
        except Exception as exc:
            warnings.append(f"OCR failed on page {page_idx + 1}: {exc}")

    full_text = "\n\n".join(t for t in page_texts if t).strip()
    avg_conf = sum(confidences) / len(confidences) if confidences else None
    structured = _extract_structured_data(full_text, hyperlinks)

    return ExtractionResult(
        text=full_text,
        method="ocr_pdf",
        pages_total=total_pages,
        pages_ocr=len(pages_needing_ocr),
        avg_ocr_confidence=avg_conf,
        warnings=warnings,
        **structured,
    )


# ── Photo / Image Extraction Engine ──────────────────────────────────────────

def extract_from_image(path: str | Path | None = None, file_bytes: bytes | None = None) -> ExtractionResult:
    """
    Extract text & signals from a photo/image of a resume (JPG, PNG, WEBP, etc.) via OCR.
    """
    if pytesseract is None or Image is None:
        return ExtractionResult(
            text="", method="failed",
            warnings=["pytesseract/Pillow not installed — run: pip install pytesseract Pillow"],
        )

    if path is None and file_bytes is None:
        return ExtractionResult(text="", method="failed", warnings=["No path or file_bytes provided"])

    try:
        image = Image.open(str(path)) if path is not None else Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        return ExtractionResult(text="", method="failed", warnings=[f"Could not open image: {exc}"])

    try:
        text, conf = _ocr_single_image(image)
    except Exception as exc:
        return ExtractionResult(text="", method="failed", warnings=[f"OCR failed: {exc}"])

    # Pull URLs from OCR text regex
    extracted_urls = re.findall(r"https?://[^\s]+", text)
    structured = _extract_structured_data(text, extracted_urls)

    return ExtractionResult(
        text=text,
        method="ocr_image",
        pages_total=1,
        pages_ocr=1,
        avg_ocr_confidence=conf,
        **structured,
    )


# ── Shared Tesseract OCR Helper ──────────────────────────────────────────────

def _ocr_single_image(image) -> tuple[str, float | None]:
    """
    Run Tesseract OCR on a PIL image with grayscale pre-processing.
    Returns (text, avg_confidence_0_to_100_or_None).
    """
    if image.mode != "L":
        image = image.convert("L")  # grayscale conversion improves photo OCR

    text = pytesseract.image_to_string(image)

    avg_conf = None
    try:
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        confs = [float(c) for c in data.get("conf", []) if c not in ("-1", -1) and float(c) >= 0]
        if confs:
            avg_conf = sum(confs) / len(confs)
    except Exception as exc:
        logger.warning(f"[resume_ocr] Could not compute OCR confidence: {exc}")

    return text.strip(), avg_conf


# ── DOCX Extraction Engine ───────────────────────────────────────────────────

def extract_from_docx(path: str | Path | None = None, file_bytes: bytes | None = None) -> ExtractionResult:
    """
    Extract text and structured signals from a Microsoft Word (.docx) file.
    Uses Python standard library (zipfile + xml.etree.ElementTree) to extract text from word/document.xml.
    """
    if path is None and file_bytes is None:
        return ExtractionResult(text="", method="failed", warnings=["No path or file_bytes provided"])

    try:
        data = file_bytes if file_bytes is not None else Path(path).read_bytes()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_content = z.read("word/document.xml")

        tree = ET.fromstring(xml_content)
        paragraphs: list[str] = []
        for elem in tree.iter():
            if elem.tag.endswith("p"):
                texts = [node.text for node in elem.iter() if node.tag.endswith("t") and node.text]
                if texts:
                    paragraphs.append("".join(texts))

        full_text = "\n\n".join(paragraphs).strip()

        hyperlinks: list[str] = []
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                if "word/_rels/document.xml.rels" in z.namelist():
                    rels_xml = z.read("word/_rels/document.xml.rels")
                    rels_tree = ET.fromstring(rels_xml)
                    for rel in rels_tree.iter():
                        target = rel.attrib.get("Target", "")
                        if target.startswith(("http://", "https://", "mailto:")):
                            hyperlinks.append(target)
        except Exception:
            pass

        structured = _extract_structured_data(full_text, hyperlinks)
        return ExtractionResult(
            text=full_text,
            method="text_layer",
            pages_total=1,
            pages_ocr=0,
            warnings=[],
            **structured,
        )
    except Exception as exc:
        logger.warning(f"[resume_ocr] DOCX parsing error: {exc}")
        return ExtractionResult(
            text="",
            method="failed",
            warnings=[f"DOCX parsing error: {exc}"],
        )


# ── Unified Route Entry Point ────────────────────────────────────────────────

def extract_resume_text(
    filename: str,
    file_bytes: bytes,
) -> ExtractionResult:
    """
    Single entry point for FastAPI routes. Dispatches based on file extension.
    Extensive support for .pdf, .docx, .jpg, .jpeg, .png, .webp, .bmp, .tiff files.
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return extract_from_pdf(file_bytes=file_bytes)
    elif ext == ".docx":
        return extract_from_docx(file_bytes=file_bytes)
    elif ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"):
        return extract_from_image(file_bytes=file_bytes)
    else:
        return ExtractionResult(
            text="", method="failed",
            warnings=[f"Unsupported file type: {ext}. Supported: .pdf, .docx, .jpg, .jpeg, .png, .webp, .bmp, .tiff"],
        )


# ── CLI Manual Tester ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Test SkillSync Resume OCR & Signal Extraction")
    parser.add_argument("file", help="Path to PDF or image file to test")
    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"File not found: {file_path}")
        raise SystemExit(1)

    result = extract_resume_text(file_path.name, file_path.read_bytes())

    print("\n" + "=" * 70)
    print("  SkillSync Resume OCR & Structured Signal Extraction")
    print("=" * 70)
    print(f"Method              : {result.method}")
    print(f"Pages total         : {result.pages_total}")
    print(f"Pages needing OCR   : {result.pages_ocr}")
    print(f"Avg OCR confidence  : {result.avg_ocr_confidence}")
    print(f"Low confidence?     : {result.is_low_confidence}")
    print(f"\n[Contact Signals]")
    print(f"  GitHub Profile    : {result.github_url}")
    print(f"  LinkedIn Profile  : {result.linkedin_url}")
    print(f"  Emails            : {result.emails}")
    print(f"  Phones            : {result.phone_numbers}")

    print(f"\n[Extracted Skills ({len(result.skills)})]")
    print(f"  {result.skills[:15]}...")

    print(f"\n[Extracted Achievements ({len(result.achievements)})]")
    for a in result.achievements:
        print(f"  • {a}")

    print(f"\n[Project Link Quality Analysis ({len(result.projects)} projects)]")
    print(f"  Summary: {json.dumps(result.projects_summary, indent=2)}")
    for p in result.projects:
        status_icon = "[GOOD]" if p["has_link"] else "[BAD ]"
        print(f"\n  {status_icon} {p['name']}")
        print(f"         Link   : {p['repo_or_demo_link']}")
        print(f"         Verdict: {p['verdict_reason']}")
        print(f"         Tech   : {p['tech_stack']}")

    if result.warnings:
        print(f"\nWarnings: {json.dumps(result.warnings, indent=2)}")

    print("=" * 70 + "\n")
