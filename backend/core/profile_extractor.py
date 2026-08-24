"""
backend/core/profile_extractor.py
=================================
Profile Signal Extractor & Aggregator for SkillSync.

Fetches technical activity and problem-solving statistics across GitHub,
LeetCode, CodeChef, and HackerRank to compute a normalized candidate
profile_score calibrated for students and early-career professionals.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any, Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Reference Ranges & Platform Weights
# ─────────────────────────────────────────────────────────────────────────────

# Reference ranges for min-max normalization.
# CALIBRATED FOR STUDENTS & EARLY-CAREER PROFESSIONALS (not elite competitive
# programmers). Derived from sampling real student profiles:
#
#   GitHub:    soubhlance (25 repos, 40 stars, 3yr), typical CS undergrad
#   LeetCode:  SoubhLance (69 solved, no contest), average student grinder
#   CodeChef:  soubhiksadhu (unrated, 85 problems), beginner
#   HackerRank: ss3247 (6 badges, 113 solved), mid-level student
#
# A score of 1.0 means "strong student profile" — NOT "world-class coder."
# Tune these based on your institution's placement cohort data.

REFERENCE_RANGES: dict[str, dict[str, tuple[float, float]]] = {
    "github": {
        "public_repos": (0.0, 30.0),           # Most students have 5–25 repos
        "total_stars": (0.0, 50.0),             # 50 total stars is strong for a student
        "account_age_years": (0.0, 4.0),        # Typical undergrad window: 1–4 years
        "pinned_with_desc": (0.0, 6.0),         # 0–6 pinned repos with descriptions
    },
    "leetcode": {
        "total_solved": (0.0, 300.0),           # 300 solved is solid placement prep
        "hard_solved": (0.0, 30.0),             # 30 hard problems = strong
        "medium_solved": (0.0, 150.0),          # Medium problems matter most for interviews
        "contest_rating": (1200.0, 2000.0),     # 2000 is top ~5% of active contestants
    },
    "codechef": {
        "rating": (0.0, 2000.0),                # 2000 = 4–5 star, strong for student
        "stars_count": (0.0, 5.0),              # 5 stars is excellent for a student
        "problems_solved": (0.0, 200.0),        # Total problems solved on platform
    },
    "hackerrank": {
        "badges_count": (0.0, 10.0),            # 10 badges = well-rounded
        "problems_solved": (0.0, 150.0),        # 150 solved = solid
    },
}

# Base platform weights (must sum to 1.0 when all 4 platforms are available).
# GitHub weighted highest because it shows project work + code quality signals.
PLATFORM_WEIGHTS: dict[str, float] = {
    "github": 0.35,
    "leetcode": 0.30,
    "codechef": 0.20,
    "hackerrank": 0.15,
}

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT = 10  # seconds for HTTP requests


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def _min_max_normalize(value: float, min_val: float, max_val: float, invert: bool = False) -> float:
    """Normalize a value to [0.0, 1.0] using min-max scaling with optional inversion."""
    if min_val == max_val:
        return 0.0
    if invert:
        norm = (max_val - value) / (max_val - min_val)
    else:
        norm = (value - min_val) / (max_val - min_val)
    return float(max(0.0, min(1.0, norm)))


# ─────────────────────────────────────────────────────────────────────────────
# Fetcher 1: GitHub
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_github_pinned_graphql(username: str, token: str) -> list[dict[str, Any]]:
    """
    Fetch pinned repositories via GitHub GraphQL API.
    Requires a valid GITHUB_TOKEN. Returns list of pinned repo dicts.
    """
    query = """
    query($username: String!) {
      user(login: $username) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              stargazerCount
              primaryLanguage { name }
            }
          }
        }
      }
    }
    """
    try:
        resp = requests.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": {"username": username}},
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": DEFAULT_USER_AGENT,
            },
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code != 200:
            logger.warning("GitHub GraphQL returned HTTP %d for '%s'", resp.status_code, username)
            return []
        data = resp.json()
        nodes = data.get("data", {}).get("user", {}).get("pinnedItems", {}).get("nodes", [])
        return [
            {
                "name": n.get("name", ""),
                "description": n.get("description"),
                "stars": n.get("stargazerCount", 0),
                "language": (n.get("primaryLanguage") or {}).get("name"),
            }
            for n in nodes if n
        ]
    except Exception as exc:
        logger.warning("GitHub GraphQL pinned repos failed for '%s': %s", username, exc)
        return []


def _fetch_top_starred_repos_rest(username: str, headers: dict) -> list[dict[str, Any]]:
    """
    Fallback: fetch top-starred repos via REST API when no GITHUB_TOKEN is set.
    Uses top 6 repos sorted by stars as a proxy for pinned repos.
    """
    try:
        url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=stars&type=owner"
        resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            return []
        repos = resp.json()
        if not isinstance(repos, list):
            return []
        top = sorted(repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)[:6]
        return [
            {
                "name": r.get("name", ""),
                "description": r.get("description"),
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language"),
            }
            for r in top
        ]
    except Exception as exc:
        logger.warning("GitHub REST top-starred fallback failed for '%s': %s", username, exc)
        return []


def fetch_github_stats(username: str) -> dict[str, Any] | None:
    """
    Fetch public GitHub profile stats.

    Access Method:
      - GraphQL API for pinned repos (requires GITHUB_TOKEN env var)
      - REST API for user profile + repo stats (works without token, rate-limited)
      - Falls back to top-starred repos if no token is set

    Returns:
        Dict with public_repos, total_stars, top_3_languages, account_age_years,
        pinned_repos (list), pinned_with_desc (count), or None on failure.
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    headers: dict[str, str] = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/vnd.github.v3+json",
    }
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        # 1. User profile
        user_resp = requests.get(
            f"https://api.github.com/users/{username}",
            headers=headers, timeout=REQUEST_TIMEOUT,
        )
        if user_resp.status_code == 404:
            logger.warning("GitHub user '%s' not found (HTTP 404)", username)
            return None
        user_resp.raise_for_status()
        user_data = user_resp.json()

        public_repos = int(user_data.get("public_repos", 0))
        created_at_str = user_data.get("created_at")
        account_age_years = 0.0
        if created_at_str:
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            account_age_years = round((datetime.now(timezone.utc) - created_at).days / 365.25, 2)

        # 2. Repos for total stars & language aggregation
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&type=owner"
        repos_resp = requests.get(repos_url, headers=headers, timeout=REQUEST_TIMEOUT)
        total_stars = 0
        lang_counts: dict[str, int] = {}

        if repos_resp.status_code == 200:
            repos_data = repos_resp.json()
            if isinstance(repos_data, list):
                for repo in repos_data:
                    total_stars += int(repo.get("stargazers_count", 0))
                    lang = repo.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1

        top_3_languages = [
            lang for lang, _ in sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        ]

        # 3. Pinned repos (GraphQL if token available, else top-starred fallback)
        if token:
            pinned_repos = _fetch_github_pinned_graphql(username, token)
        else:
            pinned_repos = _fetch_top_starred_repos_rest(username, headers)

        # Count pinned repos with non-empty descriptions (proxy for "documented project")
        pinned_with_desc = sum(
            1 for p in pinned_repos
            if p.get("description") and len(str(p["description"]).strip()) > 5
        )

        return {
            "public_repos": public_repos,
            "total_stars": total_stars,
            "top_3_languages": top_3_languages,
            "account_age_years": account_age_years,
            "pinned_repos": pinned_repos,
            "pinned_with_desc": pinned_with_desc,
        }

    except Exception as exc:
        logger.warning("GitHub stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Fetcher 2: LeetCode
# ─────────────────────────────────────────────────────────────────────────────

def fetch_leetcode_stats(username: str) -> dict[str, Any] | None:
    """
    Fetch LeetCode problem solving & contest stats via GraphQL API.

    Access Method: Unofficial / Internal GraphQL API (https://leetcode.com/graphql)
    NOTE: This uses an unofficial/internal endpoint, not a supported public API.
    Subject to rate limits, schema changes, or Cloudflare challenges.

    Returns:
        Dict with total_solved, easy_solved, medium_solved, hard_solved,
        contest_rating, or None on failure.
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    url = "https://leetcode.com/graphql"
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/{username}/",
    }

    graphql_query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
      }
    }
    """

    try:
        resp = requests.post(
            url,
            json={"query": graphql_query, "variables": {"username": username}},
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        matched_user = data.get("data", {}).get("matchedUser")
        if not matched_user:
            logger.warning("LeetCode user '%s' not found or matchedUser is null", username)
            return None

        submit_stats = matched_user.get("submitStats", {}).get("acSubmissionNum", [])
        solved_map: dict[str, int] = {}
        for item in submit_stats:
            diff = str(item.get("difficulty", "")).lower()
            count = int(item.get("count", 0))
            solved_map[diff] = count

        total_solved = solved_map.get("all", 0)
        easy_solved = solved_map.get("easy", 0)
        medium_solved = solved_map.get("medium", 0)
        hard_solved = solved_map.get("hard", 0)

        contest_ranking = data.get("data", {}).get("userContestRanking")
        contest_rating: float | None = None
        if contest_ranking and isinstance(contest_ranking, dict):
            raw_rating = contest_ranking.get("rating")
            if raw_rating is not None:
                contest_rating = round(float(raw_rating), 1)

        return {
            "total_solved": total_solved,
            "easy_solved": easy_solved,
            "medium_solved": medium_solved,
            "hard_solved": hard_solved,
            "contest_rating": contest_rating,
        }

    except Exception as exc:
        logger.warning("LeetCode stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Fetcher 3: CodeChef
# ─────────────────────────────────────────────────────────────────────────────

def fetch_codechef_stats(username: str) -> dict[str, Any] | None:
    """
    Fetch CodeChef profile stats via HTML web scraping.

    Access Method: HTML Scraping (https://www.codechef.com/users/{username})

    Handles both rated and unrated users:
      - Rated users: rating, stars, and ranks extracted from .rating-header elements
      - Unrated users: only problems_solved is available (rating/stars will be None)

    Returns:
        Dict with rating, stars_count, problems_solved, highest_rating,
        or None if user page returns 404 or scraping completely fails.
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    url = f"https://www.codechef.com/users/{username}"
    headers = {"User-Agent": DEFAULT_USER_AGENT}

    try:
        resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 404:
            logger.warning("CodeChef user '%s' not found (HTTP 404)", username)
            return None
        if resp.status_code == 403:
            logger.warning("CodeChef blocked request for '%s' (HTTP 403, possible Cloudflare)", username)
            return None
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. Rating (only present for rated users)
        rating: int | None = None
        rating_elem = soup.select_one(".rating-number")
        if rating_elem:
            m = re.search(r"\d+", rating_elem.text.strip())
            if m:
                rating = int(m.group(0))

        # 2. Stars (only present for rated users)
        stars_count: int | None = None
        stars_elem = soup.select_one(".rating-star")
        if stars_elem:
            star_text = stars_elem.text.strip()
            stars_count = star_text.count("\u2605")  # ★ character
            if stars_count == 0:
                # Fallback: count asterisks or digits
                digit_match = re.search(r"(\d+)", star_text)
                stars_count = int(digit_match.group(1)) if digit_match else None

        # 3. Highest rating
        highest_rating: int | None = None
        highest_elem = soup.select_one(".rating-header small")
        if highest_elem:
            m = re.search(r"(\d+)", highest_elem.text)
            if m:
                highest_rating = int(m.group(1))

        # 4. Problems solved — works for both rated and unrated users
        problems_solved = 0
        ps_sections = soup.select(".rating-data-section.problems-solved")
        for section in ps_sections:
            total_match = re.search(r"Total Problems Solved:\s*(\d+)", section.get_text())
            if total_match:
                problems_solved = int(total_match.group(1))
                break

        # If we got nothing at all, the user page may be empty/invalid
        if rating is None and problems_solved == 0:
            # Check if the page is a valid user page at all
            user_details = soup.select_one(".user-details-container, .user-details")
            if not user_details:
                logger.warning("CodeChef page for '%s' has no recognizable user data", username)
                return None

        return {
            "rating": rating,
            "stars_count": stars_count,
            "problems_solved": problems_solved,
            "highest_rating": highest_rating,
        }

    except Exception as exc:
        logger.warning("CodeChef stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Fetcher 4: HackerRank
# ─────────────────────────────────────────────────────────────────────────────

def fetch_hackerrank_stats(username: str) -> dict[str, Any] | None:
    """
    Fetch HackerRank badge count & problem solving activity.

    Access Method: Internal REST API (https://www.hackerrank.com/rest/hackers/{username}/badges)
    Falls back to HTML page inspection if REST returns empty data.

    Returns:
        Dict with badges (list of names), badges_count, problems_solved,
        or None on failure.
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    badges_url = f"https://www.hackerrank.com/rest/hackers/{username}/badges"
    headers = {"User-Agent": DEFAULT_USER_AGENT, "Accept": "application/json"}

    try:
        resp = requests.get(badges_url, headers=headers, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 404:
            logger.warning("HackerRank user '%s' not found (HTTP 404)", username)
            return None

        badges: list[str] = []
        problems_solved = 0

        if resp.status_code == 200:
            data = resp.json()
            models = data.get("models", [])
            if isinstance(models, list):
                for b in models:
                    badge_name = b.get("badge_name")
                    solved = b.get("solved", 0)
                    if badge_name:
                        badges.append(str(badge_name))
                    if isinstance(solved, int):
                        problems_solved += solved

        # Fallback: HTML page embedded JSON
        if not badges and problems_solved == 0:
            profile_url = f"https://www.hackerrank.com/{username}"
            profile_resp = requests.get(
                profile_url,
                headers={"User-Agent": DEFAULT_USER_AGENT},
                timeout=REQUEST_TIMEOUT,
            )
            if profile_resp.status_code == 200:
                soup = BeautifulSoup(profile_resp.text, "html.parser")
                initial_state = soup.find("script", id="initial-state")
                if initial_state and initial_state.text:
                    try:
                        state_json = json.loads(initial_state.text)
                        community = state_json.get("community", {}).get("user", {})
                        if community:
                            problems_solved = community.get("solved_challenges_count", 0)
                    except Exception:
                        pass

        return {
            "badges": badges,
            "badges_count": len(badges),
            "problems_solved": problems_solved,
        }

    except Exception as exc:
        logger.warning("HackerRank stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Score Computation & Normalization
# ─────────────────────────────────────────────────────────────────────────────

def compute_profile_score(
    github: dict[str, Any] | None = None,
    leetcode: dict[str, Any] | None = None,
    codechef: dict[str, Any] | None = None,
    hackerrank: dict[str, Any] | None = None,
    hackathon_wins: int = 0,
    papers_published: int = 0,
    return_details: bool = False,
) -> float | dict[str, Any]:
    """
    Compute a normalized profile_score in [0.0, 1.0] from platform statistics
    plus capped additive bonuses for self-reported achievements.

    Calibrated for students & early-career professionals:
      - 0.0  = no platform activity at all
      - 0.3  = beginner (few repos, some easy LeetCode, minimal CP)
      - 0.5  = mid-level student (decent repos, 100+ LC, some badges)
      - 0.7  = strong student (good projects, 200+ LC, active CP)
      - 1.0  = placement-ready standout (curated projects, 300+ LC, contests)

    Self-Reported Bonus Inputs (self_reported: True):
      Note: hackathon_wins & papers_published are user-declared, not verified via automated APIs.
      - hackathon_wins (+0.05 total max, applied if hackathon_wins > 0)
      - papers_published (+0.08 total max, applied if papers_published > 0)

    Returns:
      float: If return_details=False, returns final profile_score float clamped to max 1.0.
      dict:  If return_details=True, returns dict with profile_score, base_score, and bonus_applied.
    """
    platform_scores: dict[str, float] = {}

    # ── GitHub sub-score ──
    if github and isinstance(github, dict):
        r = REFERENCE_RANGES["github"]
        s_repos = _min_max_normalize(float(github.get("public_repos", 0)), *r["public_repos"])
        s_stars = _min_max_normalize(float(github.get("total_stars", 0)), *r["total_stars"])
        s_age = _min_max_normalize(float(github.get("account_age_years", 0)), *r["account_age_years"])
        s_pinned = _min_max_normalize(float(github.get("pinned_with_desc", 0)), *r["pinned_with_desc"])

        # Sub-weights: pinned (30%), stars (25%), repos (25%), age (20%)
        gh_score = 0.30 * s_pinned + 0.25 * s_stars + 0.25 * s_repos + 0.20 * s_age
        platform_scores["github"] = max(0.0, min(1.0, gh_score))

    # ── LeetCode sub-score ──
    if leetcode and isinstance(leetcode, dict):
        r = REFERENCE_RANGES["leetcode"]
        s_total = _min_max_normalize(float(leetcode.get("total_solved", 0)), *r["total_solved"])
        s_medium = _min_max_normalize(float(leetcode.get("medium_solved", 0)), *r["medium_solved"])
        s_hard = _min_max_normalize(float(leetcode.get("hard_solved", 0)), *r["hard_solved"])
        rating = leetcode.get("contest_rating")

        if rating is not None and float(rating) > 0:
            s_rating = _min_max_normalize(float(rating), *r["contest_rating"])
            lc_score = 0.30 * s_total + 0.25 * s_medium + 0.20 * s_hard + 0.25 * s_rating
        else:
            lc_score = 0.40 * s_total + 0.35 * s_medium + 0.25 * s_hard
        platform_scores["leetcode"] = max(0.0, min(1.0, lc_score))

    # ── CodeChef sub-score ──
    if codechef and isinstance(codechef, dict):
        r = REFERENCE_RANGES["codechef"]
        s_problems = _min_max_normalize(float(codechef.get("problems_solved", 0)), *r["problems_solved"])

        rating = codechef.get("rating")
        stars = codechef.get("stars_count")

        if rating is not None and int(rating) > 0:
            s_rating = _min_max_normalize(float(rating), *r["rating"])
            s_stars = _min_max_normalize(float(stars or 0), *r["stars_count"])
            cc_score = 0.40 * s_rating + 0.25 * s_stars + 0.35 * s_problems
        else:
            cc_score = s_problems
        platform_scores["codechef"] = max(0.0, min(1.0, cc_score))

    # ── HackerRank sub-score ──
    if hackerrank and isinstance(hackerrank, dict):
        r = REFERENCE_RANGES["hackerrank"]
        s_badges = _min_max_normalize(float(hackerrank.get("badges_count", 0)), *r["badges_count"])
        s_probs = _min_max_normalize(float(hackerrank.get("problems_solved", 0)), *r["problems_solved"])
        hr_score = 0.45 * s_badges + 0.55 * s_probs
        platform_scores["hackerrank"] = max(0.0, min(1.0, hr_score))

    # Proportional reweighting among available platforms
    if not platform_scores:
        base_score = 0.0
    else:
        total_base_weight = sum(PLATFORM_WEIGHTS[p] for p in platform_scores)
        if total_base_weight <= 0:
            base_score = 0.0
        else:
            base_score = sum(
                platform_scores[p] * (PLATFORM_WEIGHTS[p] / total_base_weight)
                for p in platform_scores
            )

    # ── Additive Capped Bonuses (self_reported: True) ──
    # Note: No automated API verification for hackathons & papers; user-declared values.
    hackathon_bonus = 0.05 if hackathon_wins > 0 else 0.0
    paper_bonus = 0.08 if papers_published > 0 else 0.0

    bonus_applied = {
        "hackathon_bonus": hackathon_bonus,
        "paper_bonus": paper_bonus,
        "self_reported": True,
    }

    final_score = base_score + hackathon_bonus + paper_bonus
    clamped_score = round(float(max(0.0, min(1.0, final_score))), 4)

    if return_details:
        return {
            "profile_score": clamped_score,
            "base_score": round(float(base_score), 4),
            "bonus_applied": bonus_applied,
        }

    return clamped_score


# ─────────────────────────────────────────────────────────────────────────────
# CLI Entry Point for Manual Testing
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(
        description="SkillSync Profile Signal Extractor & Score Calculator CLI"
    )
    parser.add_argument("--github", type=str, help="GitHub username")
    parser.add_argument("--leetcode", type=str, help="LeetCode username")
    parser.add_argument("--codechef", type=str, help="CodeChef username")
    parser.add_argument("--hackerrank", type=str, help="HackerRank username")
    parser.add_argument("--hackathons", type=int, default=0, help="Number of hackathon wins (self-reported)")
    parser.add_argument("--papers", type=int, default=0, help="Number of papers published (self-reported)")

    args = parser.parse_args()

    if not any([args.github, args.leetcode, args.codechef, args.hackerrank, args.hackathons, args.papers]):
        print("Usage: python backend/core/profile_extractor.py "
              "[--github USER] [--leetcode USER] [--codechef USER] [--hackerrank USER] [--hackathons INT] [--papers INT]")
        sys.exit(0)

    print("\n" + "=" * 60)
    print("  SkillSync Profile Signal Extraction")
    print("=" * 60)

    gh_stats = fetch_github_stats(args.github) if args.github else None
    lc_stats = fetch_leetcode_stats(args.leetcode) if args.leetcode else None
    cc_stats = fetch_codechef_stats(args.codechef) if args.codechef else None
    hr_stats = fetch_hackerrank_stats(args.hackerrank) if args.hackerrank else None

    print(f"\n[GitHub]     : {json.dumps(gh_stats, indent=2, default=str)}")
    print(f"\n[LeetCode]   : {json.dumps(lc_stats, indent=2, default=str)}")
    print(f"\n[CodeChef]   : {json.dumps(cc_stats, indent=2, default=str)}")
    print(f"\n[HackerRank] : {json.dumps(hr_stats, indent=2, default=str)}")

    score_result = compute_profile_score(
        github=gh_stats,
        leetcode=lc_stats,
        codechef=cc_stats,
        hackerrank=hr_stats,
        hackathon_wins=args.hackathons,
        papers_published=args.papers,
        return_details=True,
    )

    print(f"\n{'-' * 60}")
    print(f"  Platform Sub-Scores & Bonuses:")
    if gh_stats:
        r = REFERENCE_RANGES["github"]
        s_repos = _min_max_normalize(float(gh_stats.get("public_repos", 0)), *r["public_repos"])
        s_stars = _min_max_normalize(float(gh_stats.get("total_stars", 0)), *r["total_stars"])
        s_pinned = _min_max_normalize(float(gh_stats.get("pinned_with_desc", 0)), *r["pinned_with_desc"])
        print(f"    GitHub     : repos={s_repos:.2f}, stars={s_stars:.2f}, pinned={s_pinned:.2f}")
    if lc_stats:
        r = REFERENCE_RANGES["leetcode"]
        s_total = _min_max_normalize(float(lc_stats.get("total_solved", 0)), *r["total_solved"])
        s_med = _min_max_normalize(float(lc_stats.get("medium_solved", 0)), *r["medium_solved"])
        s_hard = _min_max_normalize(float(lc_stats.get("hard_solved", 0)), *r["hard_solved"])
        print(f"    LeetCode   : total={s_total:.2f}, medium={s_med:.2f}, hard={s_hard:.2f}")
    if cc_stats:
        r = REFERENCE_RANGES["codechef"]
        s_prob = _min_max_normalize(float(cc_stats.get("problems_solved", 0)), *r["problems_solved"])
        print(f"    CodeChef   : problems={s_prob:.2f}, rating={cc_stats.get('rating')}")
    if hr_stats:
        r = REFERENCE_RANGES["hackerrank"]
        s_b = _min_max_normalize(float(hr_stats.get("badges_count", 0)), *r["badges_count"])
        s_p = _min_max_normalize(float(hr_stats.get("problems_solved", 0)), *r["problems_solved"])
        print(f"    HackerRank : badges={s_b:.2f}, problems={s_p:.2f}")

    print(f"    Base Score : {score_result['base_score']:.4f}")
    print(f"    Bonuses    : {json.dumps(score_result['bonus_applied'])}")

    print(f"\n{'=' * 60}")
    print(f"  PROFILE SCORE: {score_result['profile_score']:.4f} / 1.0000")
    print(f"{'=' * 60}\n")


