"""
core/extractor.py
-----------------
Extracts canonical skills from raw resume / profile text.
Same vocabulary used in the notebook test cell.
"""

from __future__ import annotations
import re

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


def skills_str(skills: list[str]) -> str:
    """Join skill list into the comma-separated format BERT was trained on."""
    return ", ".join(skills)
