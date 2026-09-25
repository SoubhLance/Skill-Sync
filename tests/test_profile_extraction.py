"""
tests/test_profile_extraction.py
--------------------------------
Null-safety, Codeforces, and coverage-adjusted scoring for profile extraction:

1. Blank / whitespace handles resolve to None without any network call.
2. Codeforces 404 (API status FAILED) resolves to None ("no account found").
3. Codeforces success payload has the expected shape (rating, solved, contests).
4. All-missing profiles score 0.0 with coverage 0.0 (nulls pass through, no 500).
5. Missing platforms are excluded, never zero-filled (single maxed platform
   scores its sub-score x coverage factor, not a diluted average).
6. Coverage ordering: 2 strong platforms outscore 1 equally-strong platform.
7. Full coverage (4+) yields factor 1.0; PLATFORM_WEIGHTS sums to 1.0.
8. POST /extract-profile with blank handles returns 200 with null platforms.
9. Portfolio bonus is actually applied (regression: duplicate scorer used to
   shadow it, leaving portfolio always null).
"""

import sys
import pytest
from pathlib import Path
from unittest.mock import patch

# Ensure project root is in sys.path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from fastapi.testclient import TestClient
from backend.main import app
from backend.core.profile_extractor import (
    BASE_COVERAGE_FACTOR,
    CORE_PLATFORM_COUNT,
    COVERAGE_WEIGHT,
    PLATFORM_WEIGHTS,
    compute_profile_score,
    fetch_codechef_stats,
    fetch_codeforces_stats,
    fetch_github_stats,
    fetch_hackerrank_stats,
    fetch_leetcode_stats,
)

client = TestClient(app)

MAX_GH = {"public_repos": 30, "total_stars": 50, "account_age_years": 4.0, "pinned_with_desc": 6, "active_repos_6mo": 3}
MAX_LC = {"total_solved": 300, "medium_solved": 150, "hard_solved": 30, "contest_rating": 2000.0, "contests_attended": 12}
MAX_CC = {"rating": 2000, "stars_count": 5, "problems_solved": 200}
MAX_CF = {"rating": 2100, "max_rating": 2100, "problems_solved": 500, "contests_attended": 30}
MAX_HR = {"badges_count": 10, "problems_solved": 150}

# Near-empty but connected platforms: disclosed, below reliability thresholds.
WEAK_GH = {"public_repos": 1, "total_stars": 0, "account_age_years": 0.5, "pinned_with_desc": 0, "active_repos_6mo": 0}
WEAK_LC = {"total_solved": 3, "easy_solved": 2, "medium_solved": 1, "hard_solved": 0, "contest_rating": None, "contests_attended": 0}
WEAK_CC = {"rating": None, "stars_count": None, "problems_solved": 2}
WEAK_CF = {"rating": None, "max_rating": None, "problems_solved": 1, "contests_attended": 0}
WEAK_HR = {"badges_count": 0, "problems_solved": 3}
WEAK_BY_PLATFORM = {
    "github": WEAK_GH, "leetcode": WEAK_LC, "codechef": WEAK_CC,
    "codeforces": WEAK_CF, "hackerrank": WEAK_HR,
}


class _FakeResp:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")


# ── 1. Blank handles → None, no network ──────────────────────────────────────

@pytest.mark.parametrize("fetcher", [
    fetch_github_stats,
    fetch_leetcode_stats,
    fetch_codechef_stats,
    fetch_codeforces_stats,
    fetch_hackerrank_stats,
])
@pytest.mark.parametrize("handle", ["", "   ", None])
def test_blank_handles_return_none(fetcher, handle):
    assert fetcher(handle) is None


# ── 2/3. Codeforces API: not-found vs success (mocked transport) ─────────────

def test_codeforces_not_found_returns_none():
    with patch("backend.core.profile_extractor.requests.get") as mock_get:
        mock_get.return_value = _FakeResp(
            {"status": "FAILED", "comment": "handles: User with handle ghost_account_xyz not found"}
        )
        assert fetch_codeforces_stats("ghost_account_xyz") is None


def test_codeforces_http_400_returns_none():
    # The live API answers unknown handles with HTTP 400.
    with patch("backend.core.profile_extractor.requests.get") as mock_get:
        mock_get.return_value = _FakeResp(
            {"status": "FAILED", "comment": "handles: User with handle nope not found"},
            status_code=400,
        )
        assert fetch_codeforces_stats("nope") is None


def test_codeforces_success_shape():
    def _route(url, params=None, headers=None, timeout=None):
        if "user.info" in url:
            return _FakeResp({"status": "OK", "result": [{
                "handle": "tourist", "rating": 3618, "maxRating": 3797,
                "rank": "legendary grandmaster", "contribution": 150,
            }]})
        if "user.status" in url:
            return _FakeResp({"status": "OK", "result": [
                {"verdict": "OK", "problem": {"contestId": 4, "index": "A", "rating": 800}},
                {"verdict": "OK", "problem": {"contestId": 4, "index": "A", "rating": 800}},
                {"verdict": "WRONG_ANSWER", "problem": {"contestId": 4, "index": "B", "rating": 1700}},
                {"verdict": "OK", "problem": {"contestId": 5, "index": "C", "rating": 1700}},
            ]})
        if "user.rating" in url:
            return _FakeResp({"status": "OK", "result": [{}, {}, {}]})
        raise AssertionError(f"unexpected URL {url}")

    with patch("backend.core.profile_extractor.requests.get", side_effect=_route):
        stats = fetch_codeforces_stats("tourist")
    assert stats is not None
    assert stats["rating"] == 3618
    assert stats["max_rating"] == 3797
    assert stats["problems_solved"] == 2  # duplicate A counted once, WA ignored
    assert stats["hard_solved"] == 1      # only problem C (1700) is hard
    assert stats["contests_attended"] == 3
    assert stats["has_cp_signal"] is True


# ── 4. All missing → 0.0, null-safe ──────────────────────────────────────────

def test_all_missing_scores_zero():
    res = compute_profile_score(return_details=True)
    assert res["profile_score"] == 0.0
    assert res["base_score"] == 0.0
    assert res["coverage"] == 0.0
    assert res["platforms_used"] == []
    assert compute_profile_score() == 0.0


# ── 5. Excluded, never zero-filled ───────────────────────────────────────────

def test_missing_platform_excluded_not_zero_filled():
    # One maxed GitHub: base == its sub-score (1.0), final == 1.0 x factor(1/4).
    res = compute_profile_score(github=dict(MAX_GH), return_details=True)
    assert res["base_score"] == 1.0
    assert res["coverage"] == pytest.approx(0.25)
    assert res["profile_score"] == pytest.approx(
        1.0 * (BASE_COVERAGE_FACTOR + COVERAGE_WEIGHT * 0.25)
    )


# ── 6. Coverage ordering: broader proof wins ─────────────────────────────────

def test_two_strong_platforms_outscore_one():
    single = compute_profile_score(github=dict(MAX_GH))
    double = compute_profile_score(github=dict(MAX_GH), leetcode=dict(MAX_LC))
    assert double > single


# ── 7. Full coverage → factor 1.0; weights sane ─────────────────────────────

def test_full_coverage_factor_is_one():
    res = compute_profile_score(
        github=dict(MAX_GH), leetcode=dict(MAX_LC), codechef=dict(MAX_CC),
        codeforces=dict(MAX_CF), hackerrank=dict(MAX_HR), return_details=True,
    )
    assert res["coverage"] == 1.0
    assert res["coverage_factor"] == pytest.approx(1.0)
    assert res["profile_score"] == pytest.approx(1.0)
    assert sorted(res["platforms_used"]) == ["codechef", "codeforces", "github", "hackerrank", "leetcode"]


def test_platform_weights_sum_to_one():
    assert sum(PLATFORM_WEIGHTS.values()) == pytest.approx(1.0)
    assert set(PLATFORM_WEIGHTS) == {"github", "leetcode", "codechef", "codeforces", "hackerrank"}
    assert CORE_PLATFORM_COUNT == 4


# ── 8. Route: blank handles → 200 with null platforms ────────────────────────

def test_extract_profile_blank_handles_return_nulls():
    response = client.post(
        "/extract-profile",
        json={"github": "   ", "leetcode": "", "codechef": None, "codeforces": "  ", "hackerrank": ""},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["github"] is None
    assert data["leetcode"] is None
    assert data["codechef"] is None
    assert data["codeforces"] is None
    assert data["hackerrank"] is None
    assert data["profile_score"] == 0.0
    assert data["active_platforms"] == []


def test_extract_profile_schema_accepts_codeforces():
    response = client.post("/extract-profile", json={"codeforces": "   "})
    assert response.status_code == 200
    assert response.json()["codeforces"] is None


# ── 9. Portfolio bonus regression ────────────────────────────────────────────

def test_portfolio_bonus_applied_without_platforms():
    res = compute_profile_score(portfolio_url="https://myportfolio.dev", return_details=True)
    assert res["portfolio"]["has_portfolio"] is True
    assert res["profile_score"] == pytest.approx(0.03)


# ── 10. Dampened weights: weak-but-connected platforms ───────────────────────

def test_below_threshold_platform_is_dampened_not_excluded():
    res = compute_profile_score(
        github=dict(MAX_GH), codeforces=dict(WEAK_CF), return_details=True
    )
    wi = res["weight_info"]
    assert wi["github"]["status"] == "full_weight"
    assert wi["github"]["effective_weight"] == pytest.approx(0.30)
    assert wi["codeforces"]["status"] == "dampened"
    assert wi["codeforces"]["effective_weight"] == pytest.approx(0.15 * 0.3)
    assert wi["leetcode"]["status"] == "excluded"
    assert wi["leetcode"]["effective_weight"] == 0.0
    assert wi["leetcode"]["raw_weight"] == pytest.approx(0.25)
    # Dampened platform still counts toward coverage (2 connected → 0.5).
    assert res["coverage"] == pytest.approx(0.5)
    assert sorted(res["platforms_used"]) == ["codeforces", "github"]


def test_weak_only_platform_still_scores_above_zero():
    # A lone near-empty profile is weak proof, but proof — not zero.
    assert compute_profile_score(codeforces=dict(WEAK_CF)) > 0.0


STRONG_BASES = [
    {"github": MAX_GH},
    {"github": MAX_GH, "leetcode": MAX_LC},
    {"github": MAX_GH, "leetcode": MAX_LC, "hackerrank": MAX_HR},
]


@pytest.mark.parametrize("base_idx", range(len(STRONG_BASES)))
@pytest.mark.parametrize("weak_key", ["github", "leetcode", "codechef", "codeforces", "hackerrank"])
def test_connecting_weak_platform_never_lowers_score(base_idx, weak_key):
    """Invariant: disclosing a weak platform must never score below omitting it."""
    base = {k: dict(v) for k, v in STRONG_BASES[base_idx].items()}
    if weak_key in base:
        pytest.skip("platform already in base set")
    without = compute_profile_score(**base)
    with_weak = compute_profile_score(**{**base, weak_key: dict(WEAK_BY_PLATFORM[weak_key])})
    assert with_weak >= without


def test_real_scenario_broader_stronger_profile_wins():
    """User A: weak LC + decent GH. User B: weak LC + rated CC + HR + GH + weak CF."""
    gh_decent = {"public_repos": 12, "total_stars": 15, "account_age_years": 2.0,
                 "pinned_with_desc": 2, "active_repos_6mo": 4}
    cc_1star = {"rating": 1450, "stars_count": 1, "problems_solved": 60}
    hr_6 = {"badges_count": 6, "problems_solved": 40}

    user_a = compute_profile_score(github=dict(gh_decent), leetcode=dict(WEAK_LC))

    b_kwargs = dict(github=dict(gh_decent), leetcode=dict(WEAK_LC),
                    codechef=dict(cc_1star), hackerrank=dict(hr_6))
    user_b_no_cf = compute_profile_score(**b_kwargs)
    res_b = compute_profile_score(**{**b_kwargs, "codeforces": dict(WEAK_CF)}, return_details=True)
    user_b = res_b["profile_score"]

    # Adding the weak Codeforces account never drops B below its pre-CF score…
    assert user_b >= user_b_no_cf
    # …and the floor visibly engaged here (CF drags the capped average).
    assert res_b["monotonic_floor_applied"] is True
    assert res_b["weight_info"]["codeforces"]["status"] == "dampened"
    # …while broader, stronger overall proof outranks the narrow profile.
    assert user_b >= user_a
