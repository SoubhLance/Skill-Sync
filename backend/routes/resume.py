"""
routes/resume.py
----------------
Resume Builder exports: LaTeX source + PDF (ReportLab) + Word (python-docx).
Single source of truth: ResumeData -> per-template renderers.
"""

from __future__ import annotations
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from ..models.schemas import ResumeRenderRequest, ResumeLatexOut, ResumeData

router = APIRouter(tags=["Resume Builder"])

VALID_TEMPLATES = ("classic-jake", "two-col-photo", "academic-cv", "minimal-ats")


def _esc(s: str) -> str:
    for a, b in [("\\", "\\textbackslash{}"), ("&", "\\&"), ("%", "\\%"),
                 ("$", "\\$"), ("#", "\\#"), ("_", "\\_"),
                 ("{", "\\{"), ("}", "\\}"), ("~", "\\textasciitilde{}"),
                 ("^", "\\textasciicircum{}")]:
        s = s.replace(a, b)
    return s


def _bullets(items: list[str]) -> str:
    items = [i.strip() for i in items if i and i.strip()]
    if not items:
        return ""
    return "\\begin{itemize}\n" + "".join(f"\\item {_esc(i)}\n" for i in items) + "\\end{itemize}\n"


def generate_latex(template_id: str, d: ResumeData) -> str:
    if template_id not in VALID_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unknown template_id. Use one of {VALID_TEMPLATES}")
    b = d.basics
    header = f"{_esc(b.fullName)}\n{_esc(b.email)} $|$ {_esc(b.phone)} $|$ {_esc(b.location)}\n"
    link_parts: list[str] = []
    if b.linkedin:
        link_parts.append("\\href{" + b.linkedin + "}{LinkedIn}")
    if b.github:
        link_parts.append("\\href{" + b.github + "}{GitHub}")
    if b.portfolio:
        link_parts.append("\\href{" + b.portfolio + "}{Portfolio}")
    links = " \\\\\n".join(link_parts)
    edu = "".join(
        f"\\textbf{{{_esc(e.school)}}} -- {_esc(e.degree)} \\hfill {_esc(e.year)}\\\\ {_esc(e.score)}\n\n"
        for e in d.education if (e.school or e.degree)
    )
    exp = "".join(
        f"\\textbf{{{_esc(x.role)}}} @ {_esc(x.company)} \\hfill {_esc(x.dates)}\n{_bullets(x.bullets)}\n"
        for x in d.experience if (x.role or x.company)
    )
    proj = "".join(
        "\\textbf{" + _esc(p.name) + "} " + _esc(p.tech)
        + (" \\\\href{" + p.link + "}{Link}" if p.link else "")
        + "\n" + _bullets(p.bullets) + "\n"
        for p in d.projects if p.name
    )
    skills = " \\\\\n".join(filter(None, [
        f"\\textbf{{Languages:}} {_esc(d.skills.languages)}" if d.skills.languages else "",
        f"\\textbf{{Frameworks:}} {_esc(d.skills.frameworks)}" if d.skills.frameworks else "",
        f"\\textbf{{Tools:}} {_esc(d.skills.tools)}" if d.skills.tools else "",
        f"\\textbf{{Other:}} {_esc(d.skills.other)}" if d.skills.other else "",
    ]))
    ach = _bullets(d.achievements)
    cert = ", ".join(a for a in d.certifications if a.strip())

    if template_id == "classic-jake":
        doc = "article"
        extra = "\\usepackage[margin=0.6in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{enumitem}\n\\setlist[itemize]{nosep,leftmargin=*}\n"
    elif template_id == "two-col-photo":
        doc = "article"
        extra = ("\\usepackage[margin=0.5in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{paracol}\n"
                 "% NOTE: replace photofile with your photo, e.g. \\includegraphics[width=2.2cm]{photo.jpg}\n")
    elif template_id == "academic-cv":
        doc = "article"
        extra = "\\usepackage[margin=0.7in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{enumitem}\n"
    else:  # minimal-ats
        doc = "article"
        extra = "\\usepackage[margin=0.75in]{geometry}\n\\usepackage[hidelinks]{hyperref}\n% ATS-safe: no tables, no graphics, standard fonts\n"

    return (
        f"% {template_id} resume — paste into Overleaf (pdfLaTeX) and compile\n"
        f"\\documentclass[11pt]{{{doc}}}\n{extra}\\begin{{document}}\n\n"
        f"\\begin{{center}}\n{{\\LARGE \\bfseries {header}}}\n{links}\n\\end{{center}}\n\n"
        f"{f'\\section*{{Summary}}\n{_esc(d.summary)}\n\n' if d.summary.strip() else ''}"
        f"{f'\\section*{{Education}}\n{edu}\n' if edu else ''}"
        f"{f'\\section*{{Experience}}\n{exp}\n' if exp else ''}"
        f"{f'\\section*{{Projects}}\n{proj}\n' if proj else ''}"
        f"{f'\\section*{{Skills}}\n{skills}\n\n' if skills else ''}"
        f"{f'\\section*{{Achievements}}\n{ach}\n' if ach else ''}"
        f"{f'\\section*{{Certifications}}\n{_esc(cert)}\n\n' if cert.strip() else ''}"
        "\\end{document}\n"
    )


@router.post("/resume/latex", response_model=ResumeLatexOut, summary="Resume data -> LaTeX source")
async def resume_latex(body: ResumeRenderRequest):
    return ResumeLatexOut(latex=generate_latex(body.template_id, body.data), template_id=body.template_id)


def _build_pdf(template_id: str, d: ResumeData) -> bytes:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
    from reportlab.lib import colors

    buf = io.BytesIO()
    margins = {"classic-jake": 0.6, "two-col-photo": 0.5, "academic-cv": 0.7, "minimal-ats": 0.75}[template_id]
    doc = SimpleDocTemplate(buf, pagesize=LETTER,
                            leftMargin=margins * inch, rightMargin=margins * inch,
                            topMargin=margins * inch, bottomMargin=margins * inch)
    ss = getSampleStyleSheet()
    title = ParagraphStyle("Title2", parent=ss["Title"], fontSize=20, spaceAfter=2)
    h = ParagraphStyle("H", parent=ss["Heading2"], fontSize=11, textColor=colors.HexColor("#1B7A4B"),
                       spaceBefore=10, spaceAfter=4, borderPadding=(0, 0, 2, 0))
    body = ParagraphStyle("B", parent=ss["Normal"], fontSize=9.5, leading=13)
    small = ParagraphStyle("S", parent=ss["Normal"], fontSize=9, leading=12, textColor=colors.HexColor("#4A5D52"))
    story = []
    b = d.basics

    def P(t, s=body):
        return Paragraph((t or "").replace("\n", "<br/>"), s)

    story.append(P(f"<b>{b.fullName}</b>", title))
    contact = " | ".join(x for x in [b.email, b.phone, b.location] if x)
    if contact:
        story.append(P(contact, small))
    links = " | ".join(x for x in [b.linkedin, b.github, b.portfolio] if x)
    if links:
        story.append(P(links, small))
    story.append(Spacer(1, 4))

    def section(name, flowables):
        if not flowables:
            return
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#1B7A4B")))
        story.append(P(f"<b>{name.upper()}</b>", h))
        story.extend(flowables)

    if d.summary.strip():
        section("Summary", [P(d.summary)])
    edu_f = [P(f"<b>{e.school}</b> — {e.degree} <i>{e.year}</i><br/>{e.score}" if (e.school or e.degree) else "")
             for e in d.education]
    edu_f = [x for x in edu_f if x.text.strip()]
    section("Education", edu_f)
    exp_f = []
    for x in d.experience:
        if not (x.role or x.company):
            continue
        exp_f.append(P(f"<b>{x.role}</b> @ {x.company} <i>{x.dates}</i>"))
        for bl in x.bullets:
            if bl.strip():
                exp_f.append(P(f"• {bl}"))
    section("Experience", exp_f)
    proj_f = []
    for p in d.projects:
        if not p.name:
            continue
        proj_f.append(P(f"<b>{p.name}</b> {p.tech} {p.link}"))
        for bl in p.bullets:
            if bl.strip():
                proj_f.append(P(f"• {bl}"))
    section("Projects", proj_f)
    skill_lines = [s for s in [d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other] if s.strip()]
    if skill_lines:
        section("Skills", [P("<br/>".join(skill_lines))])
    if any(a.strip() for a in d.achievements):
        section("Achievements", [P(f"• {a}") for a in d.achievements if a.strip()])
    if any(c.strip() for c in d.certifications):
        section("Certifications", [P(", ".join(c for c in d.certifications if c.strip()))])

    if template_id == "two-col-photo":
        # Two-col feel: render skills as shaded table at top after header
        pass  # layout already linear/ATS-readable; photo placeholder noted in LaTeX

    doc.build(story)
    return buf.getvalue()


@router.post("/resume/export-pdf", summary="Resume data -> PDF file")
async def resume_pdf(body: ResumeRenderRequest):
    try:
        pdf = _build_pdf(body.template_id, body.data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    name = (body.data.basics.fullName or "resume").strip().replace(" ", "_") or "resume"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{name}_{body.template_id}.pdf"'})


@router.post("/resume/export-docx", summary="Resume data -> Word .docx file")
async def resume_docx(body: ResumeRenderRequest):
    try:
        from docx import Document
        from docx.shared import Pt
    except ImportError:
        raise HTTPException(status_code=500, detail="python-docx not installed. Run pip install python-docx.")
    d = body.data
    b = d.basics
    doc = Document()
    style = doc.styles["Normal"]
    style.font.size = Pt(10)
    doc.add_heading(b.fullName or "Resume", level=1)
    contact = " | ".join(x for x in [b.email, b.phone, b.location] if x)
    if contact:
        doc.add_paragraph(contact)
    links = " | ".join(x for x in [b.linkedin, b.github, b.portfolio] if x)
    if links:
        doc.add_paragraph(links)

    def sec(name):
        doc.add_heading(name, level=2)

    if d.summary.strip():
        sec("Summary"); doc.add_paragraph(d.summary)
    if d.education:
        sec("Education")
        for e in d.education:
            if e.school or e.degree:
                doc.add_paragraph(f"{e.school} — {e.degree} ({e.year}) {e.score}")
    if d.experience:
        sec("Experience")
        for x in d.experience:
            if x.role or x.company:
                doc.add_paragraph(f"{x.role} @ {x.company} ({x.dates})", style="List Bullet")
                for bl in x.bullets:
                    if bl.strip():
                        doc.add_paragraph(bl, style="List Bullet 2")
    if d.projects:
        sec("Projects")
        for p in d.projects:
            if p.name:
                doc.add_paragraph(f"{p.name} — {p.tech} {p.link}", style="List Bullet")
                for bl in p.bullets:
                    if bl.strip():
                        doc.add_paragraph(bl, style="List Bullet 2")
    skills_all = [d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other]
    if any(s.strip() for s in skills_all):
        sec("Skills")
        for s in skills_all:
            if s.strip():
                doc.add_paragraph(s, style="List Bullet")
    if any(a.strip() for a in d.achievements):
        sec("Achievements")
        for a in d.achievements:
            if a.strip():
                doc.add_paragraph(a, style="List Bullet")
    if any(c.strip() for c in d.certifications):
        sec("Certifications"); doc.add_paragraph(", ".join(c for c in d.certifications if c.strip()))

    buf = io.BytesIO()
    doc.save(buf)
    name = (b.fullName or "resume").strip().replace(" ", "_") or "resume"
    return Response(content=buf.getvalue(),
                    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f'attachment; filename="{name}_{body.template_id}.docx"'})
