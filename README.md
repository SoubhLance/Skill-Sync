# SkillSync — Career Intelligence Platform

> **Semantic job matching, profile aggregation, DSA tracking, and AI-powered interview simulation — in one platform.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch)](https://pytorch.org)
[![HuggingFace](https://img.shields.io/badge/Transformer-bert--base--uncased-yellow?logo=huggingface)](https://huggingface.co/bert-base-uncased)
[![FAISS](https://img.shields.io/badge/VectorSearch-FAISS-0055FF)](https://github.com/facebookresearch/faiss)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Implementation & Verification Status](#implementation--verification-status)
- [Project Directory Structure](#project-directory-structure)
- [Jupyter Notebook Analysis & Model Evaluation](#jupyter-notebook-analysis--model-evaluation)
- [Dataset Description](#dataset-description)
- [NLP Architecture & Blended Scoring](#nlp-architecture--blended-scoring)
- [Backend API Endpoints](#backend-api-endpoints)
- [Getting Started & Verification](#getting-started--verification)
- [Tech Stack](#tech-stack)
- [Contact](#contact)

---

## Overview

SkillSync is a full-stack career intelligence platform designed for students and early-career professionals. It bridges the gap between a candidate's actual skills and job market expectations using **semantic NLP matching** (BERT + FAISS), multi-platform profile aggregation, and structured preparation tools.

---

## Implementation & Verification Status

| Module | Sub-component | Status | Implementation Details |
|--------|--------------|--------|------------------------|
| **Data Pipeline** | Dataset Preprocessing | ✅ **Completed** | Cleaned 415 raw job postings → 405 unique rows (`jobs_clean.csv`). Applied alias expansion, IQR salary Winsorisation, and experience mapping. |
| **ML Engine** | Model Evaluation | ✅ **Completed** | Evaluated `bert-base-uncased` vs `all-MiniLM-L6-v2` across MRR, Hit@5, Precision@5, and Intra-Domain Similarity. `bert-base-uncased` selected as winner. |
| **Vector Index** | FAISS Indexing | ✅ **Completed** | Built 768-dimensional `IndexFlatIP` vector index containing 405 precomputed job embeddings saved at `ml/notebooks/ml/embeddings/faiss_index.bin`. |
| **Model Testing** | Notebook Validation Suite | ✅ **Completed** | 12-test suite (`T1`–`T8`) verifying single skill, multi-skill, noisy input, domain filtering, and edge cases. All assertions passing. |
| **Backend API** | FastAPI Service (`v2.0.0`) | ✅ **Completed** | Production-ready FastAPI app (`backend/main.py`) with singleton engine, CORS middleware, PDF resume parser, skill extractor, and recommendation endpoints. |
| **Frontend UI** | React + TypeScript App | ⏳ *Planned* | Directory created (`frontend/`). UI components for resume upload, job match breakdown, and skill gap visualization to be built. |
| **Documentation** | Technical Reports & Specs | ⏳ *In Progress* | Base OpenAPI schemas generated via FastAPI (`/docs`); formal documentation in `docs/` pending final UI integration. |

---

## Project Directory Structure

```
Skill-Sync/
├── backend/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── engine.py              # Singleton loading BERT model, FAISS index & candidate matching logic
│   │   └── extractor.py           # Skill vocabulary (100+ canonical skills), alias mapper & section-aware extractor
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic v2 schemas for requests, responses & health status
│   ├── routes/
│   │   ├── __init__.py
│   │   └── recommend.py           # Endpoints for /recommend, /recommend/resume, /recommend/pdf, /extract-skills, /recommend/jobs
│   ├── main.py                    # FastAPI application entry point, CORS, lifespan startup & exception handlers
│   └── requirements.txt           # Python backend dependencies
├── ml/
│   ├── datasets/
│   │   ├── jobs_clean.csv         # Cleaned & preprocessed dataset (405 job postings)
│   │   ├── preprocess.md          # Data preprocessing specification documentation
│   │   ├── preprocess.py          # 9-step automated dataset cleaning pipeline script
│   │   └── skillsync_final_dataset.csv # Raw job dataset (415 records across 14 domains)
│   └── notebooks/
│       ├── ml/
│       │   └── embeddings/        # Saved model artifacts
│       │       ├── faiss_index.bin      # FAISS vector index (405 vectors x 768 dim)
│       │       ├── job_embeddings.npy   # Precomputed NumPy embedding matrix
│       │       ├── job_metadata.json    # Serialized job metadata dictionary
│       │       └── model_info.json      # Model metadata (BERT 768-dim config)
│       └── skillsync_model.ipynb  # Main ML notebook: data loading, BERT vs MiniLM evaluation, FAISS build, 12-test suite
├── docs/                          # Project documentation directory
├── frontend/                      # Frontend UI application directory
├── .gitignore                     # Git ignore file
└── README.md                      # Project documentation and status verification report
```

---

## Jupyter Notebook Analysis & Model Evaluation

The notebook `ml/notebooks/skillsync_model.ipynb` contains the full machine learning R&D, model comparison, vector index construction, and validation suite.

### Model Benchmarking Results

Two transformer architectures were benchmarked on the 405-job dataset:
1. **Model A:** `bert-base-uncased` with mean-pooling over non-padding tokens (768 dimensions).
2. **Model B:** `all-MiniLM-L6-v2` with default sentence-transformers pooling (384 dimensions).

| Metric | Model A (`bert-base-uncased`) | Model B (`all-MiniLM-L6-v2`) | Winner / Advantage |
|--------|-------------------------------|------------------------------|--------------------|
| **Mean Reciprocal Rank (MRR)** | **0.8579** | 0.7972 | 🏆 BERT (+7.6%) |
| **Hit Rate @ K=5** | **0.9358** | 0.9284 | 🏆 BERT (+0.8%) |
| **Precision @ K=5 (P@5)** | **0.7022** | 0.6533 | 🏆 BERT (+7.5%) |
| **Intra-Domain Cosine Similarity** | **0.9321** | 0.8845 | 🏆 BERT (Higher domain coherence) |
| **Embedding Dimensions** | 768 | 384 | MiniLM (Smaller vector footprint) |
| **Encoding Speed (CPU)** | 45.5 docs/sec | 338.3 docs/sec | MiniLM (Faster batch encoding) |

**Conclusion:** `bert-base-uncased` significantly outperformed MiniLM in retrieval accuracy (MRR & P@5) and semantic domain coherence. Since dataset retrieval precision is critical for job recommendations, **BERT was selected as the production model**.

### FAISS Indexing & Validation Suite

- **Index Type:** `faiss.IndexFlatIP` wrapped with `faiss.IndexIDMap` (Inner Product on L2-normalized vectors = Cosine Similarity).
- **Indexed Vectors:** 405 vectors of size 768.
- **Testing Suite:** 12 automated test cases (`T1` through `T8`) executed in Cell 35–47 covering:
  - `T1`: Single-skill query precision
  - `T2`: Multi-skill complex query parsing
  - `T3`: Noisy / conversational input resilience
  - `T4`: Empty / gibberish handling (graceful degradation)
  - `T5`: Cross-domain queries
  - `T6`: Out-of-vocabulary skill extraction
  - `T7`: Salary filter & experience mapping constraints
  - `T8`: Strict domain filtering assertions (100% pass)

---

## Dataset Description

- **Source File:** `ml/datasets/skillsync_final_dataset.csv`
- **Cleaned Dataset:** `ml/datasets/jobs_clean.csv` (405 rows)

### Key Fields & Schema

| Column | Type | Description |
|--------|------|-------------|
| `Job_ID` | `int` | Unique job identifier |
| `Job_Role` | `str` | Title-cased job title |
| `Skills` | `str` | Comma-separated list of required skills |
| `Skills_Normalised` | `str` | Alias-expanded, canonical skill string |
| `Domain` | `str` | 14 domains (`Technical`, `Finance`, `Medical`, `Research`, etc.) |
| `Experience_Level` | `float` | `0.0` (Beginner/Intern), `1.0` (Entry), `2.0` (Mid), `3.0` (Senior) |
| `Experience_Label` | `str` | Human-readable experience band |
| `Salary_Min` / `Salary_Max` / `Salary_Avg` | `int` | Salary in USD (Winsorised via IQR bounds) |
| `Has_Salary_Data` | `bool` | Flag indicating non-zero salary record |
| `Embedding_Text` | `str` | Pre-constructed text block encoded into SBERT embeddings |

---

## NLP Architecture & Blended Scoring

### Blended Recommendation Formula

Recommendation ranking combines semantic similarity with candidate readiness scores:

$$\text{Blended Score} = 0.60 \times \text{Semantic Sim} + 0.40 \times \text{Profile Score}$$

- **Semantic Sim ($0.60$):** Cosine similarity between candidate skill vector and indexed job vector via BERT + FAISS.
- **Profile Score ($0.40$):** Candidate readiness score aggregated across GitHub, LeetCode, CodeChef, and HackerRank (including hackathon & publication bonuses).


### Skill Gap Analysis

For every retrieved job match, the engine returns:
- `skill_overlap`: List of skills the candidate possesses that the job requires.
- `skill_gap`: List of missing skills required by the job role.
- `match_pct`: Percentage ratio of candidate skills vs required job skills.

---

## Backend API Endpoints

FastAPI server runs on `http://localhost:8000`. Interactive documentation is available at `/docs`.

### Key Endpoints

| Method | Path | Summary / Description |
|--------|------|-----------------------|
| `GET` | `/health` | Server status, loaded model ID, dimensions, and total jobs indexed |
| `POST` | `/recommend` | Pass comma-separated skill string & weights → ranked job matches |
| `POST` | `/recommend/resume` | Paste raw resume text → auto-extract skills → ranked job matches |
| `POST` | `/recommend/pdf` | Upload PDF resume file → auto-extract skills via `pdfplumber` → ranked job matches |
| `POST` | `/extract-skills` | Extract canonical skills from text (`primary_skills` vs `secondary_skills`) |
| `POST` | `/extract-skills/pdf` | Extract skills directly from uploaded PDF resume |
| `POST` | `/extract-profile` | Extract GitHub, LeetCode, CodeChef, HackerRank stats & compute `profile_score` |
| `GET` | `/recommend/jobs` | Browse and filter all 405 indexed jobs by domain, experience level, or search keyword |
| `GET` | `/recommend/domains` | Get list of available domain filter categories |

---

## Getting Started & Verification

### 1. Prerequisites

- Python 3.11+
- Virtual environment (`venv`)

### 2. Environment Setup

```bash
# Clone the repository
git clone https://github.com/soubhlance/skillsync.git
cd Skill-Sync

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Run Preprocessing & Index Generation (Optional / Verification)

The dataset and FAISS vector index are pre-built. To re-run the pipeline:

```bash
# Re-run dataset preprocessing
python ml/datasets/preprocess.py

# Re-run notebook or verify index generation in ml/notebooks/skillsync_model.ipynb
```

### 4. Launch FastAPI Server

```bash
uvicorn backend.main:app --reload --port 8000
```

- **Swagger UI:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### 5. Verify Health Endpoint

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "model_id": "bert-base-uncased",
  "dimensions": 768,
  "jobs_indexed": 405,
  "device": "cpu",
  "version": "2.0.0"
}
```

---

## Tech Stack

- **ML & NLP:** PyTorch, Transformers (`bert-base-uncased`), FAISS (`faiss-cpu`), scikit-learn, pandas, numpy
- **Backend:** FastAPI, Pydantic v2, Uvicorn, pdfplumber, PyMuPDF
- **Frontend (Planned):** React, TypeScript, Tailwind CSS
- **Dataset:** 405 curated job postings across 14 technical and non-technical domains

---

## Contact

- **Author:** SoubhLance
- **Repository:** [Skill-Sync](https://github.com/soubhlance/skillsync)
