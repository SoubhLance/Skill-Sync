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
    github_url: str | None = None
    linkedin_url: str | None = None
    leetcode_url: str | None = None
    emails: list[str] = field(default_factory=list)
    phone_numbers: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    achievements: list[str] = field(default_factory=list)
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

def _extract_structured_data(
    raw_text: str,
    hyperlinks: list[str],
) -> dict[str, Any]:
    """
    Extract contact links, GitHub/LinkedIn URLs, skills, achievements,
    and evaluate project link quality ("good" vs "bad").
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
                # Catch repository URL if user profile link is not separate
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
    phone_numbers = sorted(list(set(re.findall(r"\+?\d[\d\s-]{8,}\d", raw_text))))

    # 2. Section Parsing (Projects, Achievements, Skills)
    sec_headers = [
        "summary", "education", "experience", "work experience",
        "projects", "personal projects", "technical skills", "skills",
        "achievements", "honors & awards", "awards", "certifications",
    ]
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    sec_map: dict[str, list[str]] = {"header": []}
    current_sec = "header"

    for line in lines:
        l_lower = line.lower()
        matched = None
        for sh in sec_headers:
            if l_lower == sh or l_lower.startswith(sh + " ") or l_lower.endswith(" " + sh):
                matched = sh
                break
        if matched:
            current_sec = matched
            sec_map[current_sec] = []
        else:
            sec_map[current_sec].append(line)

    # 3. Parse Skills
    extracted_skills: list[str] = []
    if extract_skills_from_resume is not None:
        skill_res = extract_skills_from_resume(raw_text)
        extracted_skills = skill_res.get("all_skills", [])

    # 4. Parse Achievements
    achievements: list[str] = []
    for key in ["achievements", "honors & awards", "awards", "certifications"]:
        if key in sec_map:
            for l in sec_map[key]:
                clean_bullet = l.lstrip("•-*–— ").strip()
                if clean_bullet:
                    achievements.append(clean_bullet)

    # 5. Parse Projects & Evaluate Link Quality
    proj_lines = sec_map.get("projects", []) or sec_map.get("personal projects", [])
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

            # Link matching logic: match project name with hyperlink annotations or text URLs
            title_clean = re.sub(r"[^a-zA-Z0-9]", "", title.lower())
            for link in clean_links:
                link_lower = link.lower()
                # Skip profile links
                if "/in/" in link_lower or link_lower.endswith(("soubhlance", "soubhiksadhu")):
                    continue
                link_clean = re.sub(r"[^a-zA-Z0-9]", "", link_lower)
                # Check match against project title words
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
        "github_url": github_url,
        "linkedin_url": linkedin_url,
        "leetcode_url": leetcode_url,
        "emails": emails,
        "phone_numbers": phone_numbers,
        "skills": extracted_skills,
        "achievements": achievements,
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
