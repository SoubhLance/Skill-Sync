# SkillSync — Career Intelligence Platform

> **Semantic job matching, profile aggregation, DSA tracking, and AI-powered interview simulation — in one platform.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)](https://react.dev)
[![SBERT](https://img.shields.io/badge/NLP-all--MiniLM--L6--v2-orange)](https://www.sbert.net)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Dataset Description](#dataset-description)
- [NLP Architecture](#nlp-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Contact](#contact)

---

## Overview

SkillSync is a full-stack career intelligence platform designed for students and early-career professionals. It bridges the gap between a candidate's actual skills and job market expectations using **semantic NLP matching**, multi-platform profile aggregation, and structured preparation tools — all in one place.

**Version:** v2.0 (Full Rebuild)  
**Stack:** FastAPI · React · TypeScript · SBERT (all-MiniLM-L6-v2)

---

## Problem Statement

Students and early-career professionals face five compounding challenges when entering the job market:

| # | Problem | Description |
|---|---------|-------------|
| 1 | **Skill-to-job mismatch** | Resumes use different vocabulary than job descriptions; keyword matching fails |
| 2 | **Fragmented digital presence** | GitHub, LinkedIn, LeetCode, and competitive platforms are siloed with no unified score |
| 3 | **Opaque preparation gaps** | Candidates don't know which DSA topics or profile sections are missing for target roles |
| 4 | **No structured interview simulation** | Existing platforms use inconsistent LLMs; a domain-trained model gives more deterministic feedback |
| 5 | **No career timeline for school students** | Class 8–10 students with technical aptitude have no guided roadmap to their eventual job |

---

## Features

### 🎯 Core Job Recommender
Upload your resume and let SkillSync do the rest. Skills are extracted using spaCy NER and semantically matched against 415+ curated job postings using SBERT embeddings and FAISS vector search. The final score blends semantic similarity, your profile readiness, and DSA prep — giving you ranked job recommendations tailored to your actual capabilities, not just keywords.

### 🔗 Profile Aggregator
Connect your GitHub, LinkedIn, LeetCode, HackerRank, and CodeChef accounts through their respective APIs. SkillSync pulls your activity, contributions, and ratings across all platforms and computes a unified **Career Readiness Score** — a single number that reflects your real-world standing as a candidate.

### 📊 DSA Tracker
Work through a structured DSA topic sheet and tick off what you've solved. SkillSync tracks your progress across all major topic categories (arrays, trees, graphs, DP, etc.) and generates a **prep completeness score** that feeds directly into your overall job match score.

### 🎙️ InterroX — AI Interview Simulator
Practice interviews without the inconsistency of generic LLMs. InterroX uses a **role-tagged question bank** matched to your skill profile, scores your answers with a fine-tuned classifier against reference answers, and tracks your gaze using MediaPipe Face Mesh to flag distraction patterns. No LLM is called at runtime — every evaluation is deterministic and auditable. Session data stays client-side; only feature vectors are sent to the backend.

### 🏫 School Pathfinder
Designed for Class 8–12 students with technical ambitions. Input your current subjects, marks, and interests — SkillSync generates a **step-by-step career timeline** mapping your path from school to your target job, covering PCM, BTech, and MTech trajectories across engineering, tech, and research domains.

### ✨ Profile Optimizer
Get actionable, step-by-step guidance on improving your GitHub README, LinkedIn sections, and competitive programming profiles. The optimizer identifies exactly which sections are weak relative to your target role and tells you what to add, rewrite, or showcase.

---

## Dataset Description

**File:** `ml/datasets/skillsync_final_dataset.csv`

The SkillSync job dataset is the backbone of the Core Recommender. It contains **415 curated job postings** across 14 domains, with pre-computed embedding text for semantic search.

### Statistics

| Property | Value |
|----------|-------|
| **Total Records** | 415 |
| **Domains Covered** | 14 |
| **Experience Levels** | 4 (Entry / Junior / Mid / Senior) |
| **Salary Data** | Included where available (USD) |

### Domains

`Technical` · `Finance` · `Medical` · `Mechanical` · `Civil` · `Electrical` · `Aerospace` · `Aeronautical` · `Chemical` · `Research` · `Agriculture` · `Creative` · `Non-Technical` · `General`

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `Job_ID` | int | Unique identifier for each job posting |
| `Job_Role` | string | Job title (e.g., *Full Stack Developer*, *Clinical Research Coordinator*) |
| `Skills` | string | Comma-separated list of required skills |
| `Skill_Count` | int | Number of skills listed for the role |
| `Experience` | string | Experience range as a human-readable string (e.g., *2–5 years*) |
| `Experience_Level` | float | Encoded experience level: `0.0` = Entry · `1.0` = Junior · `2.0` = Mid · `3.0` = Senior |
| `Target_Students` | string | Suggested candidate background or degree path |
| `Domain` | string | Broad domain category (see above) |
| `Source` | string | Origin of the job posting (LinkedIn, Indeed, Kaggle, etc.) |
| `Companies` | string | Example companies that hire for this role |
| `Projects` | string | Suggested portfolio projects relevant to the role |
| `Salary_Range` | string | Human-readable salary band (e.g., *$80,000 – $120,000*) |
| `Salary_Min` | int | Minimum salary in USD (`0` if not available) |
| `Salary_Max` | int | Maximum salary in USD (`0` if not available) |
| `Salary_Avg` | int | Average of min and max salary (`0` if not available) |
| `Has_Salary_Data` | bool | `True` if salary information is present |
| `Embedding_Text` | string | Pre-formatted string used for SBERT embedding at index-build time |

### Sample Roles

Full Stack Developer · Financial Analyst · Mechanical Engineer · Clinical Research Coordinator · Investment Banking Associate · AI Research Scientist · Civil Engineer · Quantitative Trader · Management Consultant · Biomedical Engineer · and 400+ more.

### Salary Overview (where available)

| Metric | Value (USD) |
|--------|-------------|
| Average Min Salary | ~$36,469 |
| Average Max Salary | ~$56,322 |
| Average Salary | ~$46,395 |
| Highest Max Salary | $500,000 |

> **Note:** Rows with `Has_Salary_Data = False` have `0` in salary columns. Filter with `df[df['Has_Salary_Data'] == True]` for salary-specific analysis.

### Usage

```python
import pandas as pd

df = pd.read_csv("ml/datasets/skillsync_final_dataset.csv")

# Filter by domain
tech_jobs = df[df['Domain'] == 'Technical']

# Filter by experience level (0=Entry, 1=Junior, 2=Mid, 3=Senior)
entry_level = df[df['Experience_Level'] == 0.0]

# Get roles with salary data
paid_roles = df[df['Has_Salary_Data'] == True]
```

---

## NLP Architecture

### Why Semantic Similarity?

A resume might say *"built REST endpoints with Django"* while a job description says *"FastAPI microservices experience preferred."* Keyword matching scores zero. SBERT maps both phrases into the same high-dimensional space where their **cosine similarity is high** — correctly linking the candidate to the role.

### Model: `all-MiniLM-L6-v2`

| Model | Embedding Dim | Speed | Status |
|-------|--------------|-------|--------|
| **all-MiniLM-L6-v2** | 384 | Fast | ✅ Primary |
| all-mpnet-base-v2 | 768 | Moderate | Optional (higher accuracy) |
| paraphrase-MiniLM-L3-v2 | 384 | Very Fast | Fallback |
| RoBERTa-base | 768 | Slow | ❌ Not recommended |

### Scoring Formula

```
score(C, J) = 0.6 × cosine_sim(embed_C, embed_J)
            + 0.25 × profile_score(C)
            + 0.15 × dsa_score(C)
```

Weights (0.6 / 0.25 / 0.15) are tunable hyperparameters.

### Scoring Pipeline

1. **Skill Extraction** — spaCy NER + custom skills vocabulary → canonical skill tokens
2. **Job Embedding (Offline)** — `Embedding_Text` column embedded at index-build time; stored as NumPy arrays in a FAISS index
3. **Resume Embedding (Online)** — Skill summary sentence embedded per request at inference time
4. **Blended Score** — Weighted combination of semantic similarity, profile readiness, and DSA prep scores

---

## Tech Stack

**Backend**
- FastAPI (Python 3.11+)
- sentence-transformers (`all-MiniLM-L6-v2`)
- spaCy (NER / skill extraction)
- FAISS (vector similarity search)
- PyMuPDF / pdfplumber (resume parsing)
- PostgreSQL + pgvector

**Frontend**
- React + TypeScript
- Tailwind CSS
- Recharts (score visualisation)
- Axios (FastAPI integration)
- WebRTC (InterroX camera feed)
- React Router v6

---

## Project Structure

```
skillsync/
├── ml/
│   ├── datasets/               # skillsync_final_dataset.csv, resume samples, DSA topic list
│   ├── embeddings/             # Precomputed job embeddings (.npy), FAISS index files
│   └── inference/
│       ├── scoring.py          # Blended score formula
│       ├── extractor.py        # spaCy skill extractor
│       └── recommender.py      # Core recommendation pipeline
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routes/                 # /recommend, /score, /profile, /dsa endpoints
│   └── auth/                   # Authentication
├── frontend/
│   └── src/                    # React+TS — all 6 module views
└── docs/
    ├── SkillSync_Technical_Report.docx
    └── api_contracts/          # OpenAPI specs, dataset schema docs
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/soubhlance/skillsync.git
cd skillsync

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start FastAPI server
uvicorn backend.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Build Embeddings Index

```bash
python ml/inference/recommender.py --build-index
```

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repository, then:
git checkout -b feature/your-feature-name
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## Contact

**GitHub:** [@soubhlance](https://github.com/soubhlance)  
**Email:** [studysadhu2022@gmail.com](mailto:studysadhu2022@gmail.com)

---

*SkillSync — Bridging the gap between your skills and your dream job.*
