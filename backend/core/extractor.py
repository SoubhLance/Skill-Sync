"""
core/extractor.py
-----------------
Extracts canonical skills from raw resume / profile text.
Same vocabulary used in the notebook test cell.
"""

from __future__ import annotations
import re
from typing import TYPE_CHECKING

# Master vocab — pulled from the 415-job dataset + common extras
SKILL_VOCAB: set[str] = {
    "python","javascript","typescript","java","c++","c#","go","rust","kotlin",
    "swift","scala","r","matlab","bash","sql","nosql","graphql","html","css",
    "react","next.js","vue","angular","node.js","fastapi","django","flask",
    "express","spring boot","rest api","grpc","microservices","api development",
    "machine learning","deep learning","natural language processing",
    "computer vision","reinforcement learning","large language models",
    "pytorch","tensorflow","keras","scikit-learn","hugging face","transformers",
    "bert","gpt","llm fine-tuning","rag","data science","data engineering",
    "data analysis","pandas","numpy","scipy","matplotlib","seaborn","plotly",
    "feature engineering","model deployment","mlops","statistical analysis",
    "time series","a/b testing","postgresql","mysql","mongodb","redis",
    "elasticsearch","cassandra","bigquery","snowflake","databricks","spark",
    "hadoop","kafka","airflow","aws","google cloud platform","azure",
    "docker","kubernetes","terraform","cicd","github actions","jenkins","linux",
    "penetration testing","ethical hacking","network security","cloud security",
    "siem","vulnerability assessment","zero trust","identity access management",
    "financial modeling","valuation","bloomberg terminal","risk analysis",
    "derivatives","fixed income","equity research","algorithmic trading",
    "quantitative analysis","trading algorithms","mergers and acquisitions",
    "due diligence","portfolio management","autocad","solidworks",
    "finite element analysis","geometric dimensioning and tolerancing",
    "cad design","six sigma","lean","robotics","automation","control systems",
    "plc","embedded systems","fpga","asic design","pcb design","simulink","ansys",
    "clinical trial management","ehr systems","healthcare management",
    "medical device design","bioinformatics","genomics","drug discovery",
    "pharmacokinetics","project management","agile","scrum","product management",
    "stakeholder management","strategic planning","team leadership",
    "data visualization","business intelligence","tableau","power bi","looker",
    "blockchain","smart contracts","solidity","web3","quantum computing",
    "git","jira","confluence","excel","figma","scratch","logical thinking",
    "basic coding","teamwork","problem solving","3d modelling",
    "thermodynamics","fluid mechanics","material science",
    "stress analysis","manufacturing processes",
    "esg frameworks","bloomberg","sustainability reporting",
    "sales management","medical knowledge","business development",
    "healthcare management","telehealth systems",
}

ALIAS_MAP: dict[str, str] = {
    "ml":"machine learning","ai":"artificial intelligence",
    "nlp":"natural language processing","dl":"deep learning",
    "js":"javascript","ts":"typescript","py":"python",
    "k8s":"kubernetes","tf":"tensorflow",
    "llm":"large language models","llms":"large language models",
    "genai":"generative ai","gen ai":"generative ai",
    "gcp":"google cloud platform","cv":"computer vision",
    "rl":"reinforcement learning","rest":"rest api",
    "api":"api development","apis":"api development",
    "ci/cd":"cicd","hf":"hugging face",
    "sklearn":"scikit-learn","sk-learn":"scikit-learn",
    "postgres":"postgresql","pg":"postgresql",
    "node":"node.js","nextjs":"next.js","reactjs":"react",
    "mongo":"mongodb","fea":"finite element analysis",
    "gd&t":"geometric dimensioning and tolerancing",
    "m&a":"mergers and acquisitions","cad":"cad design",
}


def extract_skills(text: str) -> list[str]:
    """Extract canonical skills from raw text, preserving insertion order."""
    if not text or not text.strip():
        return []
    cleaned = text.lower()
    cleaned = re.sub(r"[^\w\s.#+/&-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    found: list[str] = []
    matched_spans: set[tuple[int, int]] = set()

    # Multi-word skills first (longest match wins)
    for skill in sorted(SKILL_VOCAB, key=len, reverse=True):
        pattern = r"\b" + re.escape(skill) + r"\b"
        for m in re.finditer(pattern, cleaned):
            s, e = m.start(), m.end()
            if not any(a <= s < b or a < e <= b for a, b in matched_spans):
                matched_spans.add((s, e))
                found.append(skill)

    # Alias pass on individual tokens
    for token in cleaned.split():
        alias = ALIAS_MAP.get(token)
        if alias and alias in SKILL_VOCAB and alias not in found:
            found.append(alias)

    # Deduplicate preserving order
    seen: set[str] = set()
    return [s for s in found if not (s in seen or seen.add(s))]   # type: ignore[func-returns-value]


# ── Section-header vocabulary for resume-aware extraction ────────────────────
SKILL_SECTIONS: list[str] = [
    "skills", "technical skills", "technologies", "tools", "frameworks",
    "languages", "competencies", "expertise", "proficiencies", "tech stack",
]


def extract_skills_from_resume(text: str) -> dict:
    """
    Resume-aware skill extraction.

    Returns a dict with:
      all_skills      — every skill found anywhere in the text (deduped, ordered)
      primary_skills  — skills found on lines that belong to a skill-section header
                        (higher confidence: dedicated skills block)
      secondary_skills— skills found elsewhere (experience / project descriptions)
      skill_count     — len(all_skills)
    """
    if not text or not text.strip():
        return {
            "all_skills": [], "primary_skills": [],
            "secondary_skills": [], "skill_count": 0,
        }

    # 1. Full-text extraction
    all_skills: list[str] = extract_skills(text)

    # 2. Identify skill-section lines
    #    A line is "primary" when it (or an adjacent header line) contains a
    #    SKILL_SECTIONS keyword.  We look at each line and flag runs of lines
    #    that follow a skill-section header until the next blank-ish boundary.
    lines = text.splitlines()
    primary_line_indices: set[int] = set()
    in_skill_section = False

    for i, line in enumerate(lines):
        stripped = line.strip().lower()
        # Detect a header line: short line that matches a section keyword
        is_header = any(
            re.search(r"\b" + re.escape(kw) + r"\b", stripped)
            for kw in SKILL_SECTIONS
        ) and len(stripped) < 60  # headers are typically short

        if is_header:
            in_skill_section = True
            primary_line_indices.add(i)
            continue

        # Exit skill section on a blank line or an all-caps heading-like line
        # that is NOT a skill keyword (e.g. "EXPERIENCE", "EDUCATION")
        if in_skill_section:
            if stripped == "":
                in_skill_section = False
            else:
                primary_line_indices.add(i)

    # 3. Extract skills from primary lines only
    primary_text = "\n".join(lines[i] for i in sorted(primary_line_indices))
    primary_skills: list[str] = extract_skills(primary_text)

    # 4. Secondary = skills in all_skills that are NOT in primary_skills
    primary_set = set(primary_skills)
    secondary_skills: list[str] = [s for s in all_skills if s not in primary_set]

    return {
        "all_skills":      all_skills,
        "primary_skills":  primary_skills,
        "secondary_skills": secondary_skills,
        "skill_count":     len(all_skills),
    }


def skills_str(skills: list[str]) -> str:
    """Join skill list into the comma-separated format BERT was trained on."""
    return ", ".join(skills)
