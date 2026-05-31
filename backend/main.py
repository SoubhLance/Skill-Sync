"""
main.py
=======
SkillSync FastAPI backend  —  v2.0

Start:
    uvicorn backend.main:app --reload --port 8000

Swagger UI : http://localhost:8000/docs
ReDoc      : http://localhost:8000/redoc
Health     : http://localhost:8000/health
"""

from __future__ import annotations
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.models.schemas import HealthOut


# ─────────────────────────────────────────────────────────────────────────────
#  Lifespan  —  warm the engine once at startup, release on shutdown
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.core.engine import Engine
    print("[SkillSync] Starting up — loading BERT + FAISS index...")
    try:
        engine = Engine.get()                          # blocks here on first call
        app.state.ready        = True
        app.state.jobs_indexed = engine.index.ntotal
        app.state.model_info   = engine.model_info
        app.state.device       = engine.device
        print(f"[SkillSync] Ready  [OK]  ({engine.index.ntotal} jobs, device={engine.device})")
    except FileNotFoundError as exc:
        # Index not built yet — server still starts so /health can explain the issue
        print(f"[SkillSync] WARNING: {exc}")
        app.state.ready        = False
        app.state.jobs_indexed = 0
        app.state.model_info   = {}
        app.state.device       = "cpu"
    yield
    print("[SkillSync] Shutdown complete.")


# ─────────────────────────────────────────────────────────────────────────────
#  App factory
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "SkillSync API",
    description = """
## SkillSync — Career Intelligence Platform  v2.0

### Recommendation endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/recommend` | Comma-separated skills → ranked job matches |
| `POST` | `/recommend/resume` | Paste resume text → auto-extract skills → ranked jobs |
| `POST` | `/recommend/pdf` | Upload PDF resume → ranked jobs |
| `POST` | `/extract-skills` | Preview which skills are extracted from text |
| `GET`  | `/recommend/jobs` | Browse / filter all 415 indexed jobs |
| `GET`  | `/recommend/domains` | List domains available for filtering |
| `GET`  | `/health` | Engine status, model info, jobs indexed |

### Scoring formula
```
blended_score = 0.60 × cosine_similarity   (BERT mean-pool, IndexFlatIP)
              + 0.25 × profile_score        (GitHub / LinkedIn — Part 2)
              + 0.15 × dsa_score            (DSA tracker — Part 3)
```
Model used: **bert-base-uncased** (MRR 0.8579, Hit@5 0.9358, Intra-sim 0.9321)
""",
    version     = "2.0.0",
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)


# ─────────────────────────────────────────────────────────────────────────────
#  CORS  —  allow Lovable dev server + your production domain
# ─────────────────────────────────────────────────────────────────────────────

_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8080",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins     = _origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
#  Global exception handler  —  always return JSON, never raw tracebacks
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def _global_exc(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ─────────────────────────────────────────────────────────────────────────────
#  Routers
# ─────────────────────────────────────────────────────────────────────────────

from backend.routes.recommend import router as rec_router
app.include_router(rec_router)


# ─────────────────────────────────────────────────────────────────────────────
#  Health check
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthOut, tags=["System"])
async def health(request: Request):
    """Returns engine status — call this before the first recommend request."""
    ready      = getattr(request.app.state, "ready", False)
    info       = getattr(request.app.state, "model_info", {})
    return HealthOut(
        status       = "ok" if ready else "degraded — run notebook Cell 30 first",
        model_id     = info.get("model_id", "bert-base-uncased"),
        dimensions   = info.get("dimensions", 768),
        jobs_indexed = getattr(request.app.state, "jobs_indexed", 0),
        device       = getattr(request.app.state, "device", "cpu"),
        version      = "2.0.0",
    )


@app.get("/", tags=["System"])
async def root():
    return {
        "app":     "SkillSync API v2.0",
        "model":   "bert-base-uncased",
        "docs":    "/docs",
        "health":  "/health",
    }
