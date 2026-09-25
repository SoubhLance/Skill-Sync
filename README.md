# SkillSync — Career Intelligence Platform

> **Semantic job matching, multi-format OCR resume extraction, multi-platform profile aggregation, and AI-powered career intelligence — built with BERT & FAISS, delivered through a React + Firebase workspace.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-v2.3.1-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![HuggingFace](https://img.shields.io/badge/BERT-bert--base--uncased-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/bert-base-uncased)
[![FAISS](https://img.shields.io/badge/FAISS-768--dim%20VectorSearch-0055FF?style=for-the-badge)](https://github.com/facebookresearch/faiss)
[![OCR](https://img.shields.io/badge/OCR-Tesseract%20%2B%20pdfplumber-22C55E?style=for-the-badge)](https://github.com/tesseract-ocr/tesseract)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Implementation & Module Verification Status](#-implementation--module-verification-status)
- [Project Directory Structure](#-project-directory-structure)
- [Machine Learning R&D & Benchmarking](#-machine-learning-rd--benchmarking)
- [Dataset Description](#-dataset-description)
- [NLP Architecture & Blended Scoring](#-nlp-architecture--blended-scoring)
- [Backend API Reference](#-backend-api-reference)
- [Getting Started & Local Verification](#-getting-started--local-verification)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Author & License](#-author--license)

---

## 🌐 Overview

**SkillSync** is a full-stack career intelligence platform engineered for students, early-career professionals, and recruiters. It bridges candidate qualifications with job market expectations by combining **dense vector semantic search (BERT + FAISS)**, multi-format resume signal extraction (digital PDFs, scanned document OCR, image uploads), multi-platform coding profile aggregation (GitHub, LeetCode, CodeChef, HackerRank), and detailed skill gap diagnostics.

The React frontend is a per-user workspace behind Firebase auth (email + Google, with a mock mode for local development), styled with a **Mist (light) / Canopy (dark) dual theme** and a signature forest atmosphere. Every tool — JD matching, job exploration, DSA analysis, career roadmaps, resume building, LinkedIn optimization — reads and writes the same live backend, so the dashboard stays in sync everywhere.

> [!NOTE]
> SkillSync goes beyond basic keyword matching. It uses deep transformer embeddings (`bert-base-uncased`) to understand contextual relationships between candidate skills, job roles, and domain requirements.

---

## ✨ Key Features

### 🧭 Career Workspace (frontend — 11 routes)

- 📊 **Dashboard (`/dashboard`)** — Per-user hub with a profile-readiness ring, skills / platforms / best-fit stat cards, live GitHub activity graph, platform verification badges, and shortcuts into every tool.
- 🎯 **JD Matcher (`/jd-match`)** — Pairwise ATS match (paste or upload a JD via drag-and-drop, falls back to your saved resume) with match %, skill overlap / gap cards, plus a browse mode that ranks all 405 roles against your skills with domain/track filters.
- 🔎 **Job Explorer (`/job-explorer`)** — Browsable 405-role taxonomy (bundled metadata merged with live `GET /recommend/jobs`), keyword + domain + technical/general filters, 24-per-page pagination, and single-expand accordions scored against your skills.
- 💻 **DSA + Code (`/dsa-code`)** — GitHub / LeetCode / CodeChef / HackerRank handle analyzer with debounced inputs, portfolio + hackathon + paper score bonuses, per-account persistence, live contribution heatmap, and per-platform stat cards.
- 🧭 **Career Path (`/career-path`)** — Target-role + skill-chip editor producing a ranked top-5 role list (alignment % + gaps) plus student/pro milestone roadmaps; imports skills straight from your resume PDF.
- 📝 **Resume Builder (`/resume-builder`)** — Form editor (basics, education, experience, projects, skills, achievements, certs) with live preview across 4 templates (`classic-jake`, `two-col-photo`, `academic-cv`, `minimal-ats`); exports PDF / DOCX / LaTeX and enriches from your coding profiles.
- ⚡ **Optimizer (`/optimizer`)** — LinkedIn Save-to-PDF dropzone scored against a 100-point rubric (headline, about, experience, skills, education, projects, recs, certs) with section breakdown, gaps, and an explicit 422 path for scanned PDFs.
- 🚀 **InterroX (`/interrox`)** — Upcoming voice + coding interviewer (currently a `SOON`-badged placeholder).
- 👤 **Profile (`/profile`)** — Avatar header, display-name editing, theme switcher, and sign-out; destination of the sidebar user card.
- 🌐 **Landing (`/`) + Login (`/login`)** — Marketing hero with interactive signal tabs/role demos plus a split-cinema auth screen (email + Google) that redirects back to your protected page.

### 🔐 Platform & Experience

- **Firebase Auth** — Email/password + Google sign-in; missing API key falls back to a session-scoped mock mode so the UI runs without credentials. Bearer ID tokens ride every API call; per-account `localStorage` isolation keeps profiles separate.
- **Mist / Canopy dual theme** — Light sage and muted slate-forest dark themes via CSS tokens (`data-forest` + `.dark`), persisted to `localStorage`, toggleable from the sidebar, mobile menu, landing, and profile.
- **Forest atmosphere** — Shared canvas engine (cedar-frond layers, rain, drifting mist, mouse parallax) wrapped by `ForestBand` on landing/login/every protected page, plus one site-wide `RainOverlay`; all pause offscreen, on hidden tabs, and under reduced-motion.
- **App shell** — Collapsible glass sidebar (8 items) with active-route accent and flat muted inactive states, mobile header + overlay menu, lazy-loaded routes with a branded fallback, and WCAG-AA-conscious pills, inputs, and heatmap cells.

### 🧠 Intelligence Engine (backend + ML)

- 🎯 **Semantic Vector Retrieval**: 768-dimensional FAISS inner-product vector search (`IndexFlatIP`) matching candidate skills with 405+ precomputed job embeddings.
- 📄 **Multi-Format Resume Signal Parsing**:
  - **Digital PDFs**: High-speed text and embedded hyperlink extraction (`mailto:`, GitHub, LinkedIn, live demo links) via `pdfplumber`.
  - **Scanned PDFs & Photos**: Robust OCR processing pipeline using `pdf2image` and `pytesseract` for scanned documents or image uploads (PNG/JPG/WEBP).
- 🔗 **Project Link Quality Analysis**: Automatically evaluates candidate project links for repository quality (`good` vs `bad` link status) and provides actionable feedback.
- 📊 **Multi-Platform Profile Aggregation**: Automatically fetches stats from GitHub, LeetCode, CodeChef, and HackerRank to calculate a unified candidate **Profile Score**.
- 🧮 **Blended Recommendation Scoring**: Combines semantic skill similarity ($60\%$) with candidate profile metrics ($40\%$) to rank matches accurately.
- 🔍 **Skill Gap Diagnostics**: Provides line-item analysis of candidate skill overlaps, missing skills, and overall percentage readiness per job match.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Candidate Inputs
        A1[Digital PDF Resume] -->|pdfplumber| B1[Hyperlinks & Text Layer]
        A2[Scanned PDF / Image] -->|pdf2image + Tesseract OCR| B2[Extracted Text]
        A3[Raw Text / Skills] --> B3[Skill Tokenizer]
    end

    subgraph Skill Extraction & Profile Scoring
        B1 & B2 & B3 --> C1[Canonical Skill Extractor]
        C1 -->|Skill Vocabulary Mapping| D1[Candidate Skill Vector]

        P1[GitHub / LeetCode / CodeChef Stats] -->|Aggregator| P2[Profile Score 0.0 - 1.0]
    end

    subgraph BERT + FAISS Search Engine
        D1 -->|bert-base-uncased| E1[768-dim Embedding]
        E1 -->|Inner Product Cosine Sim| F1[FAISS Index 405 Jobs]
        F1 -->|Top-K Matches| G1[Semantic Sim Score 0.0 - 1.0]
    end

    subgraph Recommendation Pipeline
        G1 & P2 --> H1["Blended Score = 0.60(Semantic) + 0.40(Profile)"]
        H1 --> I1[Skill Gap & Overlap Analysis]
        I1 --> J1[Ranked Job Matches JSON Response]
    end

    subgraph Frontend Workspace
        U1[React Pages + Firebase Auth] -->|axios + Bearer ID token| J1
        U1 -->|Mist/Canopy Theme| U2[Dashboard / JD / Explorer / DSA / Builder / Optimizer]
    end
```

---

## 📋 Implementation & Module Verification Status

| Module | Sub-component | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **Data Pipeline** | Dataset Preprocessing | ✅ **Completed** | Cleaned 415 raw job postings → 405 unique rows (`jobs_clean.csv`). Applied alias expansion, IQR salary Winsorisation, and experience mapping. |
| **ML Engine** | Model Evaluation | ✅ **Completed** | Benchmarked `bert-base-uncased` vs `all-MiniLM-L6-v2`. `bert-base-uncased` selected as production winner (MRR: `0.8579`, P@5: `0.7022`). |
| **Vector Index** | FAISS Indexing | ✅ **Completed** | 768-dimensional `IndexFlatIP` vector index containing 405 job embeddings saved at `ml/notebooks/ml/embeddings/faiss_index.bin`. |
| **Resume & OCR** | Multi-Format Parser | ✅ **Completed** | Digital PDF link parsing (`pdfplumber`) + OCR fallback (`pytesseract`) + project link quality validator (`backend/core/resume_ocr.py`). |
| **Backend API** | FastAPI Service (`v2.0.0`) | ✅ **Completed** | Production FastAPI app (`backend/main.py`) with singleton engine, CORS middleware, Pydantic v2 schemas, and health checks. |
| **JD Matcher** | Pairwise ATS Engine | ✅ **Completed** | Skill coverage (65%) + anisotropy-calibrated BERT cosine (35%), zero-overlap guardrail, full-coverage guarantee (`backend/core/jd_matcher.py`, `POST /jd-match`). |
| **Resume Exports** | PDF / DOCX / LaTeX | ✅ **Completed** | Single `ResumeData` source → ReportLab PDF, python-docx, Overleaf LaTeX across 4 templates (`backend/routes/resume.py`). |
| **LinkedIn Optimizer** | 100-pt PDF Scorer | ✅ **Completed** | PyMuPDF span/header detection with section breakdown + gaps; 422 on scanned PDFs (`backend/core/linkedin_scorer.py`, `POST /api/optimizer/linkedin`). |
| **Validation Suite**| Notebook Test Suite | ✅ **Completed** | 12-test suite (`T1`–`T8`) verifying single skill, multi-skill, noisy input, domain filtering, and edge cases. All assertions passing. |
| **API Test Suite** | pytest (`tests/`) | ✅ **Completed** | JD-match paths/guards + LinkedIn optimizer valid/invalid/scanned cases. |
| **Frontend UI** | React 19 + TypeScript App | ✅ **Completed** | 11 routed pages (landing, login, dashboard, JD Matcher, Job Explorer, DSA/Code, Career Path, Resume Builder, Optimizer, InterroX placeholder, Profile) with Firebase auth, Mist/Canopy themes, and forest atmosphere (`frontend/`). |

---

## 📁 Project Directory Structure

```
Skill-Sync/
├── backend/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── engine.py              # Singleton loading BERT model, FAISS index & matching logic
│   │   ├── extractor.py           # Skill vocabulary (100+ canonical skills) & section-aware parser
│   │   ├── profile_extractor.py   # Aggregates stats from GitHub, LeetCode, CodeChef, HackerRank
│   │   ├── resume_ocr.py          # PDF text/hyperlink extraction & Tesseract OCR for scanned docs
│   │   ├── jd_matcher.py          # Pairwise ATS scoring (skill coverage + calibrated cosine)
│   │   ├── jd_extractor.py        # JD text extraction wrapper (PDF/DOCX/TXT)
│   │   ├── linkedin_scorer.py     # LinkedIn PDF 100-point rubric + gap detection
│   │   ├── ocr_fallback.py        # Optional Tesseract rasterize path for PDFs
│   │   └── api.py                 # LinkedIn optimizer route (mounted at /api/optimizer)
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic v2 schemas for requests, responses & health status
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── recommend.py           # Recommendations, OCR, skills, profiles, JD match, jobs browse
│   │   └── resume.py              # Resume LaTeX / PDF / DOCX exports
│   ├── main.py                    # FastAPI app entry point, CORS, lifespan startup & error handlers
│   └── requirements.txt           # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Landing, Login, Dashboard, JDMatcher, JobExplorer,
│   │   │                          # DSACode, CareerPath, ResumeBuilder, Optimizer, InterroX, Profile
│   │   ├── components/
│   │   │   ├── layout/            # Navbar (glass sidebar), ProtectedRoute
│   │   │   ├── atmosphere/        # ForestBand, RainOverlay
│   │   │   ├── ui/                # AmbientForest, CommitGraph, PlatformBadge, FileUpload, ...
│   │   │   └── resume/            # TemplatePreviews
│   │   ├── context/               # ThemeContext (Mist/Canopy), AuthContext (Firebase)
│   │   ├── lib/                   # api.ts, userProfile.ts, scoring.ts, jobTaxonomy.ts, ...
│   │   ├── App.tsx                # Routes (public + protected AppLayout), lazy loading
│   │   └── index.css              # Forest design system (dual-theme tokens)
│   ├── package.json               # React 19, Vite 8, Tailwind v4, Firebase, axios
│   └── vite.config.ts             # Vite + Tailwind plugin
├── ml/
│   ├── datasets/
│   │   ├── jobs_clean.csv         # Preprocessed dataset (405 job postings)
│   │   ├── preprocess.md          # Preprocessing specification document
│   │   ├── preprocess.py          # 9-step dataset cleaning pipeline script
│   │   └── skillsync_final_dataset.csv # Raw dataset (415 records across 14 domains)
│   └── notebooks/
│       ├── ml/embeddings/         # Saved model artifacts
│       │   ├── faiss_index.bin    # FAISS vector index (405 vectors x 768 dimensions)
│       │   ├── job_embeddings.npy # Precomputed NumPy embedding matrix
│       │   ├── job_metadata.json  # Serialized job metadata dictionary
│       │   └── model_info.json    # Model metadata & configuration
│       └── skillsync_model.ipynb  # R&D notebook: evaluation, FAISS indexing & 12-test validation suite
├── tests/
│   ├── test_jd_match.py           # JD-match paths, guards, link extraction, profile smoke
│   └── test_linkedin_optimizer.py # Optimizer valid/invalid/scanned cases
├── docs/                          # Technical specifications and API documentations
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation and system architecture guide
```

---

## 🧪 Machine Learning R&D & Benchmarking

The notebook [`ml/notebooks/skillsync_model.ipynb`](ml/notebooks/skillsync_model.ipynb) documents model architecture selection, vector index construction, and validation.

### Model Benchmarking Comparison

Two transformer models were evaluated on the 405-job dataset:
1. **Model A (`bert-base-uncased`):** Mean-pooling over non-padding tokens (768 dimensions).
2. **Model B (`all-MiniLM-L6-v2`):** Default sentence-transformers pooling (384 dimensions).

| Metric | Model A (`bert-base-uncased`) | Model B (`all-MiniLM-L6-v2`) | Winner / Advantage |
| :--- | :---: | :---: | :--- |
| **Mean Reciprocal Rank (MRR)** | **0.8579** | 0.7972 | 🏆 **BERT (+7.6%)** |
| **Hit Rate @ K=5** | **0.9358** | 0.9284 | 🏆 **BERT (+0.8%)** |
| **Precision @ K=5 (P@5)** | **0.7022** | 0.6533 | 🏆 **BERT (+7.5%)** |
| **Intra-Domain Cosine Similarity** | **0.9321** | 0.8845 | 🏆 **BERT (Higher domain coherence)** |
| **Embedding Dimensions** | 768 | 384 | MiniLM (Smaller vector size) |
| **Encoding Speed (CPU)** | 45.5 docs/sec | 338.3 docs/sec | MiniLM (Faster encoding) |

> [!IMPORTANT]
> **Decision**: `bert-base-uncased` significantly outperformed MiniLM in retrieval accuracy (MRR & P@5) and semantic domain coherence. Since recommendation quality is paramount, **BERT 768-dim was selected as the production model**.

---

## 📊 Dataset Description

- **Raw Dataset**: `ml/datasets/skillsync_final_dataset.csv` (415 records)
- **Cleaned Production Dataset**: `ml/datasets/jobs_clean.csv` (405 records across 14 domain categories)

### Key Schema Fields

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `Job_ID` | `int` | Unique job record identifier |
| `Job_Role` | `str` | Title-cased job title |
| `Skills` | `str` | Raw comma-separated skill requirements |
| `Skills_Normalised` | `str` | Alias-expanded, canonical skill string |
| `Domain` | `str` | 14 domains (`Technical`, `Finance`, `Medical`, `Research`, etc.) |
| `Experience_Level` | `float` | `0.0` (Intern/Beginner), `1.0` (Entry), `2.0` (Mid), `3.0` (Senior) |
| `Salary_Min` / `Salary_Max` / `Salary_Avg` | `int` | USD Salary (IQR Winsorised) |
| `Embedding_Text` | `str` | Structured text representation encoded into vector space |

---

## 📐 NLP Architecture & Blended Scoring

### Recommendation Scoring Formula

To produce balanced job recommendations, candidate scores are calculated using a blended formula:

$$\text{Blended Score} = 0.60 \times \text{Semantic Sim} + 0.40 \times \text{Profile Score}$$

- **Semantic Similarity ($60\%$ weight):** L2-normalized Inner Product Cosine Similarity between candidate vector and indexed FAISS job vectors.
- **Profile Score ($40\%$ weight):** Aggregated readiness score from GitHub activity, LeetCode problem breakdown, CodeChef rating, and HackerRank badges.

---

## 🔌 Backend API Reference

The FastAPI backend runs on `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

### Primary Endpoints

| Method | Path | Description |
| :---: | :--- | :--- |
| `GET` | `/health` | Server readiness status, loaded model ID, dimensions, and indexed job count |
| `POST` | `/recommend` | Direct skill string query → Ranked job recommendations |
| `POST` | `/recommend/resume` | Raw text resume string → Auto-extract skills → Ranked job recommendations |
| `POST` | `/recommend/pdf` | PDF/Image file upload → PDF text/OCR extraction → Ranked job matches |
| `POST` | `/extract-skills` | Extract canonical skills from text (returns `primary_skills` and `secondary_skills`) |
| `POST` | `/extract-skills/pdf` | Upload PDF/Image → Extract canonical skills and structural metadata |
| `POST` | `/extract-profile` | Fetch GitHub/LeetCode/CodeChef/HackerRank stats & calculate `profile_score` |
| `GET` | `/github/contributions` | Scrape a public GitHub heatmap (`total_last_year`, 28-week matrix) |
| `POST` | `/jd-match` | Pairwise resume ↔ JD match (JSON or file upload, session-resume fallback) |
| `GET` | `/recommend/jobs` | Search & filter 405 indexed jobs by keyword, domain, or experience level |
| `GET` | `/recommend/domains` | Retrieve all available domain category filters |
| `POST` | `/resume/latex` | Generate Overleaf-ready LaTeX source for a template |
| `POST` | `/resume/export-pdf` | Export a resume to PDF (ReportLab, per-template margins) |
| `POST` | `/resume/export-docx` | Export a resume to DOCX (python-docx) |
| `POST` | `/api/optimizer/linkedin` | Score a LinkedIn Save-to-PDF (100-pt rubric + gaps; 422 if scanned) |

---

## 🚀 Getting Started & Local Verification

### 1. Prerequisites
- Python 3.11 or higher
- Git & virtualenv (`venv` or `conda`)
- Node.js 18+ & npm (for the frontend)
- (Optional) Firebase project + Tesseract OCR binary for scanned-PDF support

### 2. Environment Setup

```bash
# Clone repository
git clone https://github.com/soubhlance/skillsync.git
cd Skill-Sync

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

Copy `.env.example` to `.env` and fill in values (`CORS_ORIGINS`, `W_SEMANTIC` / `W_PROFILE`, optional `GITHUB_TOKEN` to raise the rate limit from 60 → 5000 req/hr).

### 3. Launching the Backend Server

Depending on your current shell working directory, execute:

#### Option A: From the project root (`Skill-Sync/`)
```powershell
uvicorn backend.main:app --reload --port 8000
```

#### Option B: From the `backend/` folder (`Skill-Sync/backend/`)
```powershell
cd backend
uvicorn main:app --reload --port 8000
```

> [!TIP]
> The server warms up the BERT model and FAISS vector index during startup. Once ready, you'll see:
> `[SkillSync] Ready [OK] (405 jobs, device=cpu)`

---

### 4. Verify Server Health

You can verify the backend status using `curl` or opening `http://localhost:8000/health` in your browser:

```bash
curl http://localhost:8000/health
```

**Expected JSON Output:**
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

### 5. Launching the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and talks to the backend via `VITE_API_URL` (defaults to `http://localhost:8000`). For auth, add your Firebase keys to a frontend `.env`:

```bash
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> [!TIP]
> Without Firebase keys the app runs in mock-auth mode (session-scoped users), so you can click through the whole workspace locally.

Verify with:

```bash
npm run build   # tsc + vite production build
npm run lint    # oxlint
```

Run backend tests with:

```bash
pytest tests/ -v
```

---

## 🛠️ Tech Stack & Dependencies

- **Machine Learning & NLP**: PyTorch, HuggingFace Transformers (`bert-base-uncased`), FAISS (`faiss-cpu`), Scikit-Learn, Pandas, NumPy
- **OCR & Document Processing**: Tesseract OCR (`pytesseract`), `pdfplumber`, `pdf2image`, Pillow, PyMuPDF
- **Backend Infrastructure**: FastAPI, Pydantic v2, Uvicorn, Python-Dotenv, ReportLab, python-docx
- **Frontend Stack**: React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Firebase Auth, axios, Framer Motion, lucide-react
- **Testing**: pytest, pytest-asyncio, httpx (backend); oxlint + `tsc -b` (frontend)

---

## 👤 Author & License

- **Author**: SoubhLance
- **Repository**: [Skill-Sync](https://github.com/soubhlance/skillsync)
- **License**: Released under the [MIT License](LICENSE).
