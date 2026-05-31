"""
core/engine.py
--------------
Singleton that owns:
  - bert-base-uncased tokenizer + model  (loaded once at startup)
  - FAISS IndexIDMap                     (loaded from ml/notebooks/ml/embeddings/faiss_index.bin)
  - job metadata dict                    (loaded from job_metadata.json)
  - model_info dict                      (loaded from model_info.json)

Exposes one method:  engine.recommend(...)
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Optional

import faiss
import numpy as np
import torch
import torch.nn.functional as F
from transformers import BertModel, BertTokenizer

# ── Paths — relative to project root ─────────────────────────────────────────
# Notebook saved artifacts to:  ml/notebooks/ml/embeddings/
_ROOT       = Path(__file__).resolve().parent.parent.parent   # project root
EMBED_DIR   = _ROOT / "ml" / "notebooks" / "ml" / "embeddings"

FAISS_PATH  = EMBED_DIR / "faiss_index.bin"
META_PATH   = EMBED_DIR / "job_metadata.json"
MODEL_PATH  = EMBED_DIR / "model_info.json"

# ── Scoring weights (match recommender.py and test cell) ─────────────────────
W_SEMANTIC = float(os.getenv("W_SEMANTIC", "0.60"))
W_PROFILE  = float(os.getenv("W_PROFILE",  "0.25"))
W_DSA      = float(os.getenv("W_DSA",      "0.15"))

# ── BERT config (must match notebook) ────────────────────────────────────────
BERT_MODEL_ID = "bert-base-uncased"
MAX_LENGTH    = 64
BATCH_SIZE    = 1          # inference is single-query; batch=1 is fine


# ─────────────────────────────────────────────────────────────────────────────
#  BERT helpers  (exact copies of notebook cells 9 + 32)
# ─────────────────────────────────────────────────────────────────────────────

def _mean_pool(token_embeddings: torch.Tensor,
               attention_mask: torch.Tensor) -> torch.Tensor:
    """Average non-padding token embeddings (notebook Cell 9)."""
    mask_expanded  = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    sum_embeddings = torch.sum(token_embeddings * mask_expanded, dim=1)
    sum_mask       = torch.clamp(mask_expanded.sum(dim=1), min=1e-9)
    return sum_embeddings / sum_mask


def _encode_bert(
    texts: list[str],
    tokenizer: BertTokenizer,
    model: BertModel,
    device: str,
) -> np.ndarray:
    """
    Encode texts → L2-normalised float32 embeddings of shape (N, 768).
    Mirrors notebook Cell 9 encode_bert() exactly.
    """
    encoded = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    ).to(device)

    with torch.inference_mode():
        outputs = model(**encoded)

    pooled = _mean_pool(outputs.last_hidden_state, encoded["attention_mask"])
    pooled = F.normalize(pooled, p=2, dim=1)
    return pooled.cpu().numpy().astype(np.float32)


# ─────────────────────────────────────────────────────────────────────────────
#  Result dataclass
# ─────────────────────────────────────────────────────────────────────────────

class JobMatch:
    __slots__ = (
        "job_id", "job_role", "domain", "experience_label", "experience_level",
        "skills", "skills_list", "projects", "companies",
        "salary_range", "salary_min", "salary_max", "salary_avg", "has_salary_data",
        "skill_count", "semantic_score", "blended_score",
        "skill_overlap", "skill_gap", "match_pct",
    )

    def __init__(self, **kw):
        for k, v in kw.items():
            setattr(self, k, v)

    def to_dict(self) -> dict:
        return {s: getattr(self, s) for s in self.__slots__}


class RecommendResult:
    def __init__(
        self,
        matches: list[JobMatch],
        candidate_skills: list[str],
        query_ms: float,
        total_jobs: int,
    ):
        self.matches          = matches
        self.candidate_skills = candidate_skills
        self.query_ms         = query_ms
        self.total_jobs       = total_jobs


# ─────────────────────────────────────────────────────────────────────────────
#  Engine singleton
# ─────────────────────────────────────────────────────────────────────────────

# ── LRU embedding cache — keyed on query text, capped at 256 entries ─────────
_EMBED_CACHE: dict[str, np.ndarray] = {}
_EMBED_CACHE_MAX = 256


class Engine:
    _instance: Optional["Engine"] = None

    # ── constructor ──────────────────────────────────────────────────────────
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Engine] device = {self.device}")

        # 1. BERT
        print(f"[Engine] Loading {BERT_MODEL_ID}...")
        self.tokenizer = BertTokenizer.from_pretrained(BERT_MODEL_ID)
        self.bert      = BertModel.from_pretrained(BERT_MODEL_ID).to(self.device)
        self.bert.eval()
        print(f"[Engine] BERT ready  |  hidden_size={self.bert.config.hidden_size}")

        # 2. FAISS index
        if not FAISS_PATH.exists():
            raise FileNotFoundError(
                f"FAISS index not found: {FAISS_PATH}\n"
                "Run the notebook Cell 30 first to build ml/embeddings/faiss_index.bin"
            )
        self.index = faiss.read_index(str(FAISS_PATH))
        print(f"[Engine] FAISS ready  |  {self.index.ntotal} vectors, dim=768")

        # 3. Metadata  (JSON keys are strings — normalise to int)
        with open(META_PATH) as f:
            raw = json.load(f)
        self.meta: dict[int, dict] = {int(k): v for k, v in raw.items()}
        print(f"[Engine] Metadata ready  |  {len(self.meta)} jobs")

        # 4. Model info
        if MODEL_PATH.exists():
            with open(MODEL_PATH) as f:
                self.model_info: dict = json.load(f)
        else:
            self.model_info = {"winner": "BERT", "model_id": BERT_MODEL_ID, "dimensions": 768}

    @classmethod
    def get(cls) -> "Engine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── public API ───────────────────────────────────────────────────────────

    def recommend(
        self,
        skills_str:       str,
        top_k:            int   = 10,
        profile_score:    float = 0.0,
        dsa_score:        float = 0.0,
        domain_filter:    Optional[str]   = None,
        exp_filter:       Optional[float] = None,   # 0=Beginner 1=Entry 2=Mid 3=Senior
    ) -> RecommendResult:
        t0 = time.perf_counter()

        # Build query text exactly like the notebook
        query_text = f"Skills: {skills_str}"

        # ── LRU cache: skip BERT entirely for repeated queries ────────────────
        if query_text in _EMBED_CACHE:
            query_vec = _EMBED_CACHE[query_text]
        else:
            query_vec = _encode_bert([query_text], self.tokenizer, self.bert, self.device)
            if len(_EMBED_CACHE) >= _EMBED_CACHE_MAX:
                _EMBED_CACHE.pop(next(iter(_EMBED_CACHE)))  # evict oldest
            _EMBED_CACHE[query_text] = query_vec

        # Fetch extra to survive filters
        fetch_k      = min(self.index.ntotal, top_k * 6)
        scores, ids  = self.index.search(query_vec, fetch_k)

        candidate_skills = [s.strip().lower() for s in skills_str.split(",") if s.strip()]

        matches: list[JobMatch] = []
        for raw_score, jid in zip(scores[0], ids[0]):
            if jid == -1:
                continue
            m = self.meta.get(int(jid))
            if m is None:
                continue

            # ── filters ──────────────────────────────────────────────────────
            if domain_filter and m.get("domain", "").lower() != domain_filter.lower():
                continue
            if exp_filter is not None and m.get("experience_level") != exp_filter:
                continue

            # ── scores ───────────────────────────────────────────────────────
            sem     = float(np.clip(raw_score, 0, 1))
            blended = W_SEMANTIC * sem + W_PROFILE * profile_score + W_DSA * dsa_score

            # ── skill gap analysis ───────────────────────────────────────────
            job_skills = [s.strip().lower() for s in m.get("skills", "").split(",") if s.strip()]
            cand_set   = set(candidate_skills)
            job_set    = set(job_skills)
            overlap    = sorted(cand_set & job_set)
            gap        = sorted(job_set  - cand_set)
            match_pct  = round(len(overlap) / len(job_set) * 100, 1) if job_set else 0.0

            matches.append(JobMatch(
                job_id          = m["job_id"],
                job_role        = m["job_role"],
                domain          = m.get("domain", ""),
                experience_label= m.get("experience_label", ""),
                experience_level= m.get("experience_level", 1.0),
                skills          = m.get("skills", ""),
                skills_list     = m.get("skills_list", []),
                projects        = m.get("projects", ""),
                companies       = m.get("companies", ""),
                salary_range    = m.get("salary_range", ""),
                salary_min      = m.get("salary_min", 0),
                salary_max      = m.get("salary_max", 0),
                salary_avg      = m.get("salary_avg", 0),
                has_salary_data = m.get("has_salary_data", False),
                skill_count     = m.get("skill_count", 0),
                semantic_score  = round(sem, 4),
                blended_score   = round(blended, 4),
                skill_overlap   = overlap,
                skill_gap       = gap,
                match_pct       = match_pct,
            ))

        matches.sort(key=lambda x: x.blended_score, reverse=True)
        matches = matches[:top_k]
        query_ms = round((time.perf_counter() - t0) * 1000, 2)

        return RecommendResult(
            matches          = matches,
            candidate_skills = candidate_skills,
            query_ms         = query_ms,
            total_jobs       = self.index.ntotal,
        )
