"""
preprocess.py
-------------
Cleans and normalises skillsync_final_dataset.csv into a canonical format
that the embedding pipeline and FAISS index builder consume.

Preprocessing steps applied:
  1. Column name normalisation (Job_Role / Job Role compatibility)
  2. Whitespace & casing standardisation on text fields
  3. Duplicate removal (exact Job_Role + Skills duplicates)
  4. Skill alias normalisation + special-char cleaning + deduplication
  5. Salary cleaning (coerce to int, zero-fill, Has_Salary_Data flag)
  6. Salary outlier capping via IQR (Winsorisation) — only on rows with data
  7. Skill_Count recalculation + outlier flagging via IQR
  8. Experience_Level → readable label (including Beginner / Intern)
  9. Embedding text construction for SBERT

Output: jobs_clean.csv
"""

import pandas as pd
import numpy as np
import re
import json
from pathlib import Path

RAW = Path(__file__).parent / "skillsync_final_dataset.csv"
OUT = Path(__file__).parent / "jobs_clean.csv"

# ── Skill alias normalisation map ─────────────────────────────────────────────
ALIAS_MAP = {
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "nlp": "natural language processing",
    "dl": "deep learning",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "k8s": "kubernetes",
    "tf": "tensorflow",
    "llm": "large language models",
    "sql": "sql",
    "nosql": "nosql",
    "aws": "aws",
    "gcp": "google cloud platform",
    "cv": "computer vision",
    "rl": "reinforcement learning",
    "api": "api development",
    "ci/cd": "cicd",
    "ci cd": "cicd",
    "erp": "erp systems",
    "cad": "cad design",
    "ehr": "ehr systems",
    "iot": "internet of things",
    "m&a": "mergers and acquisitions",
    "fe": "finite element analysis",
    "fea": "finite element analysis",
    "gd&t": "geometric dimensioning and tolerancing",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def normalise_skills(skills_str: str) -> list[str]:
    """Split comma-separated skills, lowercase, apply aliases, deduplicate."""
    if not isinstance(skills_str, str):
        return []
    skills = [s.strip().lower() for s in skills_str.split(",") if s.strip()]
    normalised = []
    for s in skills:
        s = ALIAS_MAP.get(s, s)
        s = re.sub(r"[^a-z0-9 /+#.]", " ", s).strip()
        s = re.sub(r"\s+", " ", s)
        if s:
            normalised.append(s)
    return list(dict.fromkeys(normalised))  # deduplicate, preserve order


def build_embedding_text(row: pd.Series) -> str:
    """
    Concatenate role + skills + projects into a single string for SBERT.
    Quality here directly affects recommendation accuracy.
    """
    parts = [
        f"Job Role: {row['Job Role']}",
        f"Skills: {row['Skills']}",
    ]
    if pd.notna(row.get("Projects")):
        parts.append(f"Projects: {row['Projects']}")
    if pd.notna(row.get("Experience")):
        parts.append(f"Experience: {row['Experience']}")
    return ". ".join(parts)


def map_experience_label(level_float) -> str:
    mapping = {
        0.0: "Beginner / Intern",
        1.0: "Entry-level (0-2 years)",
        2.0: "Mid-level (2-5 years)",
        3.0: "Senior-level (5+ years)",
    }
    return mapping.get(level_float, "Entry-level (0-2 years)")


def iqr_bounds(series: pd.Series) -> tuple[float, float]:
    """Return (lower, upper) IQR-based Winsorisation bounds."""
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    return Q1 - 1.5 * IQR, Q3 + 1.5 * IQR


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run():
    df = pd.read_csv(RAW)
    print(f"[1/9] Loaded {len(df)} rows from {RAW.name}")

    # ── Step 1: Column name normalisation ─────────────────────────────────────
    if "Job_Role" in df.columns and "Job Role" not in df.columns:
        df.rename(columns={"Job_Role": "Job Role"}, inplace=True)
    print(f"[1/9] Column names normalised")

    # ── Step 2: Whitespace & casing standardisation ───────────────────────────
    text_cols = ["Job Role", "Skills", "Domain", "Experience", "Target_Students", "Source"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    # Title-case Job Role for consistent display
    df["Job Role"] = df["Job Role"].str.title()
    # Consistent title-case on Domain
    df["Domain"] = df["Domain"].str.strip().str.title()
    print(f"[2/9] Whitespace & casing standardised on: {text_cols}")

    # ── Step 3: Duplicate removal ─────────────────────────────────────────────
    before = len(df)
    df = df.drop_duplicates(subset=["Job Role", "Skills"], keep="first").reset_index(drop=True)
    removed = before - len(df)
    print(f"[3/9] Duplicates removed: {removed} rows  ({len(df)} remain)")

    # ── Step 4: Skill normalisation ───────────────────────────────────────────
    df["Skills_Normalised"] = df["Skills"].apply(
        lambda s: " | ".join(normalise_skills(s))
    )
    df["Skills_List"] = df["Skills"].apply(normalise_skills).apply(json.dumps)
    # Recalculate Skill_Count from actual parsed skills (source of truth)
    df["Skill_Count"] = df["Skills"].apply(
        lambda s: len([x.strip() for x in s.split(",") if x.strip()])
    )
    print(f"[4/9] Skills normalised, aliases expanded, Skill_Count recalculated")

    # ── Step 5: Salary cleaning ───────────────────────────────────────────────
    for col in ["Salary_Min", "Salary_Max", "Salary_Avg"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
    df["Has_Salary_Data"] = (df["Salary_Min"] > 0) | (df["Salary_Max"] > 0)
    print(f"[5/9] Salary columns cleaned  |  rows with salary data: {df['Has_Salary_Data'].sum()}")

    # ── Step 6: Salary outlier capping (Winsorisation via IQR) ────────────────
    # Only apply to rows that have real salary data — zeros are "no data", not outliers
    sal_mask = df["Has_Salary_Data"]
    outlier_counts = {}
    for col in ["Salary_Min", "Salary_Max", "Salary_Avg"]:
        lower, upper = iqr_bounds(df.loc[sal_mask, col])
        n_outliers = ((df.loc[sal_mask, col] < lower) | (df.loc[sal_mask, col] > upper)).sum()
        outlier_counts[col] = int(n_outliers)
        df.loc[sal_mask, col] = df.loc[sal_mask, col].clip(lower=lower, upper=upper).astype(int)
    print(f"[6/9] Salary outliers Winsorised (IQR):  {outlier_counts}")

    # ── Step 7: Skill_Count outlier flagging ──────────────────────────────────
    # We FLAG rather than remove — a job with 16 skills is valid, just unusual
    lower_sc, upper_sc = iqr_bounds(df["Skill_Count"])
    df["Skill_Count_Outlier"] = (
        (df["Skill_Count"] < lower_sc) | (df["Skill_Count"] > upper_sc)
    )
    n_sc_outliers = df["Skill_Count_Outlier"].sum()
    print(f"[7/9] Skill_Count outliers flagged: {n_sc_outliers} rows  "
          f"(bounds: [{lower_sc:.0f}, {upper_sc:.0f}])")

    # ── Step 8: Experience label ──────────────────────────────────────────────
    df["Experience_Label"] = df["Experience_Level"].apply(map_experience_label)
    print(f"[8/9] Experience labels mapped")

    # ── Step 9: Build embedding text ──────────────────────────────────────────
    df["Embedding_Text"] = df.apply(build_embedding_text, axis=1)
    print(f"[9/9] Embedding text built for all {len(df)} rows")

    # ── Final column selection ────────────────────────────────────────────────
    clean = df[[
        "Job_ID", "Job Role", "Skills", "Skills_Normalised", "Skills_List",
        "Projects", "Companies", "Domain", "Target_Students",
        "Experience_Label", "Experience_Level",
        "Salary_Range", "Salary_Min", "Salary_Max", "Salary_Avg", "Has_Salary_Data",
        "Skill_Count", "Skill_Count_Outlier",
        "Embedding_Text"
    ]].copy()
    clean.rename(columns={"Job Role": "Job_Role"}, inplace=True)

    clean.to_csv(OUT, index=False)
    print(f"\n✓ Saved cleaned dataset → {OUT}")
    print(f"  Final shape : {clean.shape}")
    print(f"  Columns     : {list(clean.columns)}")
    print(f"\nSample Embedding_Text:\n  {clean['Embedding_Text'].iloc[0]}")


if __name__ == "__main__":
    run()