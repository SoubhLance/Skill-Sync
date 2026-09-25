"""
backend/core/profile_extractor.py
=================================
Profile Signal Extractor & Aggregator for SkillSync.

Fetches technical activity and problem-solving statistics across GitHub,
LeetCode, CodeChef, Codeforces, and HackerRank to compute a normalized
candidate profile_score calibrated for students and early-career
professionals.

Missing profiles are first-class: a blank handle, a nonexistent account, or
a failed fetch all resolve to None ("no account found") and are excluded
from the weighted average — never zero-filled, never a 500.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timedelta, timezone
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
#   Codeforces: tourist (legendary GM) is the ceiling reference only —
#               student range caps at ~2100 (Master); 1600+ is strong
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
    "codeforces": {
        "rating": (800.0, 2100.0),              # 800 = newbie floor; 2100 = Master, standout student
        "max_rating": (800.0, 2100.0),          # Peak rating, same scale
        "problems_solved": (0.0, 500.0),        # Accepted submissions (distinct problems)
        "contests": (0.0, 30.0),                # Rated contests attended
    },
    "hackerrank": {
        "badges_count": (0.0, 10.0),            # 10 badges = well-rounded
        "problems_solved": (0.0, 150.0),        # 150 solved = solid
    },
}

# Base platform weights (must sum to 1.0 when all 5 platforms are available).
# GitHub weighted highest because it shows project work + code quality signals.
PLATFORM_WEIGHTS: dict[str, float] = {
    "github": 0.30,
    "leetcode": 0.25,
    "codechef": 0.15,
    "codeforces": 0.15,
    "hackerrank": 0.15,
}

# Coverage adjustment: fewer linked platforms = less verified proof, so the
# renormalized average is scaled down. Tunable without touching scoring code.
#   coverage = min(connected platforms, CORE_PLATFORM_COUNT) / CORE_PLATFORM_COUNT
#   final    = base * (BASE_COVERAGE_FACTOR + COVERAGE_WEIGHT * coverage) + bonuses
# Full coverage → factor 1.0 (no change). No platforms → 0.0 × 0.7 + bonuses.
CORE_PLATFORM_COUNT = 4
BASE_COVERAGE_FACTOR = 0.7
COVERAGE_WEIGHT = 0.3

# Reliability thresholds: a connected platform with barely any signal counts at
# a dampened weight instead of full weight (see BELOW_THRESHOLD_WEIGHT_FACTOR).
# Rationale: a near-empty profile is disclosed proof of *something*, but not a
# mature data point — it shouldn't steer the average like a strong one does.
# A below-threshold platform still counts toward coverage, and connecting one
# can never lower the final score (monotonicity floor in compute_profile_score).
MIN_PROBLEMS_SOLVED = 5      # LeetCode / CodeChef / Codeforces / HackerRank
MIN_CONTESTS_ATTENDED = 1    # LeetCode / Codeforces rated contests
MIN_BADGES = 1               # HackerRank badges
MIN_ACTIVE_REPOS_6MO = 1     # GitHub repos pushed within the last 6 months
BELOW_THRESHOLD_WEIGHT_FACTOR = 0.3

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT = 10  # seconds for HTTP requests


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def fetch_github_contributions(username: str) -> dict[str, Any] | None:
    """Scrape the public contributions calendar (no token needed).

    Returns { total_last_year, days: [{date, count, level}], weeks: [[level x7]] }
    or None when the user doesn't exist / page can't be parsed.
    """
    if not username or not username.strip():
        return None
    username = username.strip()
    url = f"https://github.com/users/{username}/contributions"
    try:
        resp = requests.get(url, headers={"User-Agent": DEFAULT_USER_AGENT}, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        html = resp.text
        total_m = re.search(r"([\d,]+)\s+contributions", html)
        total = int(total_m.group(1).replace(",", "")) if total_m else 0
        # Each day cell is followed by a <tool-tip> with the real count.
        pattern = re.compile(
            r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)".*?'
            r"<tool-tip[^>]*>(.*?)</tool-tip>",
            re.DOTALL,
        )
        days: list[dict[str, Any]] = []
        for date_s, level_s, tip in pattern.findall(html):
            tip_t = tip.strip()
            if tip_t.lower().startswith("no contributions"):
                count = 0
            else:
                cm = re.search(r"([\d,]+)\s+contribution", tip_t)
                count = int(cm.group(1).replace(",", "")) if cm else 0
            days.append({"date": date_s, "count": count, "level": int(level_s)})
        days.sort(key=lambda d: d["date"])
        # Group into weeks of 7 for the heatmap (last 28 weeks like the UI).
        weeks: list[list[int]] = []
        for i in range(0, len(days), 7):
            chunk = [d["level"] for d in days[i:i + 7]]
            while len(chunk) < 7:
                chunk.append(0)
            weeks.append(chunk)
        weeks = weeks[-28:] if len(weeks) > 28 else weeks
        return {"total_last_year": total, "days": days, "weeks": weeks}
    except Exception as exc:
        logger.warning("GitHub contributions fetch failed for '%s': %s", username, exc)
        return None


def _min_max_normalize(value: float, min_val: float, max_val: float, invert: bool = False) -> float:
    """Normalize a value to [0.0, 1.0] using min-max scaling with optional inversion."""
    if min_val == max_val:
        return 0.0
    if invert:
        norm = (max_val - value) / (max_val - min_val)
    else:
        norm = (value - min_val) / (max_val - min_val)
    return float(max(0.0, min(1.0, norm)))


def _num(stats: dict[str, Any], key: str) -> float:
    """Best-effort numeric read: None / missing / garbage → 0.0 (unreliable)."""
    try:
        val = stats.get(key, 0)
        if val is None:
            return 0.0
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def _is_reliable(platform: str, stats: dict[str, Any]) -> bool:
    """Does a connected platform carry enough signal for full weight?

    Below-threshold platforms are NOT excluded — they count toward coverage at
    a dampened weight (BELOW_THRESHOLD_WEIGHT_FACTOR). Only truly missing
    (None) platforms are excluded entirely.
    """
    if platform == "github":
        return _num(stats, "active_repos_6mo") >= MIN_ACTIVE_REPOS_6MO
    if platform == "leetcode":
        return _num(stats, "contests_attended") >= MIN_CONTESTS_ATTENDED or _num(stats, "total_solved") >= MIN_PROBLEMS_SOLVED
    if platform == "codechef":
        return _num(stats, "rating") > 0 or _num(stats, "problems_solved") >= MIN_PROBLEMS_SOLVED
    if platform == "codeforces":
        return _num(stats, "contests_attended") >= MIN_CONTESTS_ATTENDED or _num(stats, "problems_solved") >= MIN_PROBLEMS_SOLVED
    if platform == "hackerrank":
        return _num(stats, "badges_count") >= MIN_BADGES or _num(stats, "problems_solved") >= MIN_PROBLEMS_SOLVED
    return False


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
        active_repos_6mo (repos pushed in the last 6 months — reliability signal),
        pinned_repos (list), pinned_with_desc (count), or None on failure.
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    headers: dict[str, str] = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/vnd.github.v3+json",
    }
    raw_token = os.getenv("GITHUB_TOKEN", "").strip().strip('"').strip("'")
    # Treat example/placeholder values as "no token" instead of sending them.
    token = "" if raw_token.lower() in ("", "your_github_token_here", "changeme", "none", "null") else raw_token
    if token:
        headers["Authorization"] = f"Bearer {token}"

    def _get_without_auth_on_401(url: str):
        """GET with fallback: if our token is bad (401), retry unauthenticated."""
        resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 401 and "Authorization" in headers:
            logger.warning(
                "GitHub token rejected (401) — retrying '%s' without token. "
                "Regenerate GITHUB_TOKEN or leave it blank.", url,
            )
            headers.pop("Authorization", None)
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        return resp

    try:
        # 1. User profile
        user_resp = _get_without_auth_on_401(f"https://api.github.com/users/{username}")
        if user_resp.status_code == 404:
            logger.warning("GitHub user '%s' not found (HTTP 404)", username)
            return None
        if user_resp.status_code == 401:
            logger.warning("GitHub auth failed (401) for '%s' — bad/expired GITHUB_TOKEN", username)
            return None
        user_resp.raise_for_status()
        user_data = user_resp.json()

        public_repos = int(user_data.get("public_repos", 0))
        followers = int(user_data.get("followers", 0))
        following = int(user_data.get("following", 0))
        created_at_str = user_data.get("created_at")
        account_age_years = 0.0
        if created_at_str:
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            account_age_years = round((datetime.now(timezone.utc) - created_at).days / 365.25, 2)

        # 2. Repos for total stars & language aggregation
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&type=owner"
        repos_resp = _get_without_auth_on_401(repos_url)
        total_stars = 0
        lang_counts: dict[str, int] = {}
        active_repos_6mo = 0
        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=180)

        if repos_resp.status_code == 200:
            repos_data = repos_resp.json()
            if isinstance(repos_data, list):
                for repo in repos_data:
                    total_stars += int(repo.get("stargazers_count", 0))
                    lang = repo.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1
                    pushed_at = repo.get("pushed_at")
                    if pushed_at:
                        try:
                            pushed_dt = datetime.fromisoformat(str(pushed_at).replace("Z", "+00:00"))
                            if pushed_dt >= recent_cutoff:
                                active_repos_6mo += 1
                        except (ValueError, TypeError):
                            pass

        top_3_languages = [
            lang for lang, _ in sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        ]

        # 3. Pinned repos (GraphQL if token still valid, else top-starred fallback)
        if token and "Authorization" in headers:
            pinned_repos = _fetch_github_pinned_graphql(username, token)
            if not pinned_repos:
                # GraphQL may have failed on bad token — REST fallback uses
                # the (possibly de-authed) headers.
                fallback = _fetch_top_starred_repos_rest(username, headers)
                if fallback:
                    pinned_repos = fallback
        else:
            pinned_repos = _fetch_top_starred_repos_rest(username, headers)

        # Count pinned repos with non-empty descriptions (proxy for "documented project")
        pinned_with_desc = sum(
            1 for p in pinned_repos
            if p.get("description") and len(str(p["description"]).strip()) > 5
        )

        return {
            "public_repos": public_repos,
            "followers": followers,
            "following": following,
            "total_stars": total_stars,
            "top_3_languages": top_3_languages,
            "account_age_years": account_age_years,
            "active_repos_6mo": active_repos_6mo,
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
        profile {
          ranking
        }
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
        attendedContestsCount
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

        ranking = matched_user.get("profile", {}).get("ranking")
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
        contest_global_rank: int | None = None
        contests_attended: int = 0
        if contest_ranking and isinstance(contest_ranking, dict):
            raw_rating = contest_ranking.get("rating")
            if raw_rating is not None:
                contest_rating = round(float(raw_rating), 1)
            raw_global = contest_ranking.get("globalRanking")
            if raw_global is not None:
                contest_global_rank = int(raw_global)
            raw_contests = contest_ranking.get("attendedContestsCount")
            if raw_contests is not None:
                contests_attended = int(raw_contests)

        has_cp = bool((contest_rating and contest_rating > 0) or contests_attended > 0)

        return {
            "total_solved": total_solved,
            "easy_solved": easy_solved,
            "medium_solved": medium_solved,
            "hard_solved": hard_solved,
            "ranking": ranking,
            "contest_rating": contest_rating,
            "contest_global_rank": contest_global_rank,
            "contests_attended": contests_attended,
            "has_cp_signal": has_cp,
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

        # 4. Ranks & CP Signals
        global_rank: int | None = None
        country_rank: int | None = None
        ranks_section = soup.select_one(".rating-ranks")
        if ranks_section:
            links = ranks_section.select("a strong")
            if len(links) >= 1:
                m_g = re.search(r"\d+", links[0].text.replace(",", ""))
                if m_g: global_rank = int(m_g.group(0))
            if len(links) >= 2:
                m_c = re.search(r"\d+", links[1].text.replace(",", ""))
                if m_c: country_rank = int(m_c.group(0))

        # 5. Problems solved — works for both rated and unrated users
        problems_solved = 0
        ps_sections = soup.select(".rating-data-section.problems-solved")
        for section in ps_sections:
            total_match = re.search(r"Total Problems Solved:\s*(\d+)", section.get_text())
            if total_match:
                problems_solved = int(total_match.group(1))
                break

        if rating is None and problems_solved == 0:
            user_details = soup.select_one(".user-details-container, .user-details")
            if not user_details:
                logger.warning("CodeChef page for '%s' has no recognizable user data", username)
                return None

        has_cp = bool((rating and rating > 0) or (stars_count and stars_count > 0))

        return {
            "rating": rating,
            "stars_count": stars_count,
            "problems_solved": problems_solved,
            "highest_rating": highest_rating,
            "global_rank": global_rank,
            "country_rank": country_rank,
            "has_cp_signal": has_cp,
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

        has_cp = any(
            kw in str(b).lower()
            for b in badges
            for kw in ["problem solving", "algorithm", "data structure", "c++", "cpp", "python"]
        ) or (problems_solved >= 20)

        return {
            "badges": badges,
            "badges_count": len(badges),
            "problems_solved": problems_solved,
            "has_cp_signal": has_cp,
        }

    except Exception as exc:
        logger.warning("HackerRank stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Fetcher 5: Codeforces (official public API — no scraping)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_codeforces_stats(username: str) -> dict[str, Any] | None:
    """
    Fetch Codeforces rating & problem-solving stats via the official API.

    Access Method: Official public REST API (https://codeforces.com/api/).
      - user.info   → rating, maxRating, rank, contribution
      - user.status → accepted submissions (distinct problems, hard = rating ≥ 1600)
      - user.rating → rated contests attended
    No token needed. A nonexistent handle returns {"status": "FAILED"}.

    Returns:
        Dict with rating, max_rating, rank, problems_solved, hard_solved,
        contests_attended, contribution, or None when the account doesn't
        exist / can't be reached ("no account found").
    """
    if not username or not username.strip():
        return None

    username = username.strip()
    headers = {"User-Agent": DEFAULT_USER_AGENT}

    try:
        # 1. Profile + rating (FAILED status = handle doesn't exist)
        info_resp = requests.get(
            "https://codeforces.com/api/user.info",
            params={"handles": username},
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
        if info_resp.status_code in (400, 404):
            # Codeforces answers unknown handles with 400 + {"status": "FAILED"}.
            logger.warning("Codeforces user '%s' not found (HTTP %d)", username, info_resp.status_code)
            return None
        info_resp.raise_for_status()
        info_data = info_resp.json()
        if info_data.get("status") != "OK" or not info_data.get("result"):
            logger.warning("Codeforces user '%s' not found (%s)", username, info_data.get("comment", "FAILED"))
            return None
        info = info_data["result"][0]

        rating: int | None = info.get("rating")
        max_rating: int | None = info.get("maxRating")
        rank: str | None = info.get("rank")
        max_rank: str | None = info.get("maxRank")
        contribution: int = int(info.get("contribution", 0))

        # 2. Submissions → distinct accepted problems (+ hard split at problem rating 1600)
        problems_solved = 0
        hard_solved = 0
        try:
            status_resp = requests.get(
                "https://codeforces.com/api/user.status",
                params={"handle": username, "from": 1, "count": 10000},
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )
            if status_resp.status_code == 200:
                status_data = status_resp.json()
                if status_data.get("status") == "OK":
                    seen: set[tuple[str, str]] = set()
                    for sub in status_data.get("result", []):
                        if sub.get("verdict") != "OK":
                            continue
                        prob = sub.get("problem", {})
                        key = (str(prob.get("contestId", "?")), str(prob.get("index", "?")))
                        if key in seen:
                            continue
                        seen.add(key)
                        problems_solved += 1
                        try:
                            if float(prob.get("rating", 0) or 0) >= 1600:
                                hard_solved += 1
                        except (TypeError, ValueError):
                            pass
        except Exception as exc:
            logger.warning("Codeforces submissions fetch failed for '%s': %s", username, exc)

        # 3. Contest history → rated contests attended
        contests_attended = 0
        try:
            rating_resp = requests.get(
                "https://codeforces.com/api/user.rating",
                params={"handle": username},
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )
            if rating_resp.status_code == 200:
                rating_data = rating_resp.json()
                if rating_data.get("status") == "OK" and isinstance(rating_data.get("result"), list):
                    contests_attended = len(rating_data["result"])
        except Exception as exc:
            logger.warning("Codeforces contest history fetch failed for '%s': %s", username, exc)

        has_cp = bool(
            (rating and rating >= 1400)
            or (max_rating and max_rating >= 1400)
            or contests_attended >= 5
            or problems_solved >= 50
        )

        return {
            "rating": rating,
            "max_rating": max_rating,
            "rank": rank,
            "max_rank": max_rank,
            "contribution": contribution,
            "problems_solved": problems_solved,
            "hard_solved": hard_solved,
            "contests_attended": contests_attended,
            "has_cp_signal": has_cp,
        }

    except Exception as exc:
        logger.warning("Codeforces stats fetch failed for '%s': %s", username, exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Score Computation & Normalization
# ─────────────────────────────────────────────────────────────────────────────

def compute_profile_score(
    github: dict[str, Any] | None = None,
    leetcode: dict[str, Any] | None = None,
    codechef: dict[str, Any] | None = None,
    codeforces: dict[str, Any] | None = None,
    hackerrank: dict[str, Any] | None = None,
    portfolio_url: str | None = None,
    hackathon_wins: int = 0,
    papers_published: int = 0,
    return_details: bool = False,
) -> float | dict[str, Any]:
    """
    Compute a normalized profile_score in [0.0, 1.0] from platform statistics
    plus capped additive bonuses for self-reported achievements and portfolio link.

    Missing-platform semantics (null-safe):
      - A platform that wasn't provided, wasn't found, or failed to fetch is
        passed as None and EXCLUDED from the weighted average (never zero-filled).
      - A connected platform below its reliability threshold (_is_reliable)
        counts at a dampened weight (BELOW_THRESHOLD_WEIGHT_FACTOR) instead of
        full weight — disclosed, but not steering like a mature data point.
      - base_score = weighted average over connected platforms using effective
        weights, renormalized to sum to 1.
      - coverage = min(connected, CORE_PLATFORM_COUNT) / CORE_PLATFORM_COUNT
        (dampened platforms count — they were disclosed).
      - final = base * (BASE_COVERAGE_FACTOR + COVERAGE_WEIGHT * coverage)
        + bonuses, clamped to [0, 1]. Full coverage → factor 1.0 (no change).
      - Monotonicity floor: connecting a weak platform can never score below
        omitting it (recomputed without dampened platforms, max wins).

    Calibrated for students & early-career professionals:
      - 0.0  = no platform activity at all
      - 0.3  = beginner (few repos, some easy LeetCode, minimal CP)
      - 0.5  = mid-level student (decent repos, 100+ LC, some badges)
      - 0.7  = strong student (good projects, 200+ LC, active CP)
      - 1.0  = placement-ready standout (curated projects, 300+ LC, contests)
    """
    platform_scores: dict[str, float] = {}

    # ── GitHub sub-score ──
    if github and isinstance(github, dict):
        r = REFERENCE_RANGES["github"]
        s_repos = _min_max_normalize(float(github.get("public_repos", 0)), *r["public_repos"])
        s_stars = _min_max_normalize(float(github.get("total_stars", 0)), *r["total_stars"])
        s_age = _min_max_normalize(float(github.get("account_age_years", 0)), *r["account_age_years"])
        s_pinned = _min_max_normalize(float(github.get("pinned_with_desc", 0)), *r["pinned_with_desc"])

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

    # ── Codeforces sub-score ──
    if codeforces and isinstance(codeforces, dict):
        r = REFERENCE_RANGES["codeforces"]
        s_problems = _min_max_normalize(float(codeforces.get("problems_solved", 0)), *r["problems_solved"])
        s_contests = _min_max_normalize(float(codeforces.get("contests_attended", 0)), *r["contests"])

        best_rating: float | None = None
        for cand in (codeforces.get("rating"), codeforces.get("max_rating")):
            try:
                if cand is not None and float(cand) > 0:
                    best_rating = float(cand) if best_rating is None else max(best_rating, float(cand))
            except (TypeError, ValueError):
                continue

        if best_rating is not None:
            s_rating = _min_max_normalize(best_rating, *r["rating"])
            cf_score = 0.40 * s_rating + 0.25 * s_contests + 0.35 * s_problems
        else:
            # Unrated account: only solve activity + contest attendance count.
            cf_score = 0.60 * s_problems + 0.40 * s_contests
        platform_scores["codeforces"] = max(0.0, min(1.0, cf_score))

    # Effective weights: full weight when the platform is reliable, dampened
    # weight when it is connected but below its reliability threshold. Truly
    # missing (None) platforms are excluded entirely — never zero-filled.
    stats_by_platform: dict[str, dict[str, Any] | None] = {
        "github": github if isinstance(github, dict) else None,
        "leetcode": leetcode if isinstance(leetcode, dict) else None,
        "codechef": codechef if isinstance(codechef, dict) else None,
        "codeforces": codeforces if isinstance(codeforces, dict) else None,
        "hackerrank": hackerrank if isinstance(hackerrank, dict) else None,
    }
    reliable = {
        p: _is_reliable(p, stats_by_platform[p])  # type: ignore[arg-type]
        for p in platform_scores
    }
    effective_weights = {
        p: PLATFORM_WEIGHTS[p] * (1.0 if reliable[p] else BELOW_THRESHOLD_WEIGHT_FACTOR)
        for p in platform_scores
    }
    weight_info = {
        p: {
            "status": "full_weight" if p in reliable and reliable[p] else ("dampened" if p in platform_scores else "excluded"),
            "raw_weight": round(float(PLATFORM_WEIGHTS[p]), 4),
            "effective_weight": round(float(effective_weights.get(p, 0.0)), 4),
        }
        for p in PLATFORM_WEIGHTS
    }

    # Weighted average over CONNECTED platforms using effective weights.
    platforms_used = sorted(platform_scores.keys())
    total_effective = sum(effective_weights.values())
    if not platform_scores or total_effective <= 0:
        base_score = 0.0
    else:
        base_score = sum(
            platform_scores[p] * effective_weights[p] for p in platform_scores
        ) / total_effective

    # Coverage adjustment: every connected platform counts — dampened ones
    # included, since the user did disclose them. Only missing ones don't.
    # A lone strong platform still can't outscore broader multi-platform proof.
    coverage = min(len(platform_scores), CORE_PLATFORM_COUNT) / CORE_PLATFORM_COUNT if CORE_PLATFORM_COUNT > 0 else 0.0
    coverage_factor = BASE_COVERAGE_FACTOR + COVERAGE_WEIGHT * coverage

    # ── Additive Capped Bonuses ──
    hackathon_bonus = 0.05 if hackathon_wins > 0 else 0.0
    paper_bonus = 0.08 if papers_published > 0 else 0.0
    has_portfolio_link = bool(portfolio_url and isinstance(portfolio_url, str) and len(portfolio_url.strip()) > 3)
    portfolio_bonus = 0.03 if has_portfolio_link else 0.0

    portfolio_info = {
        "url": portfolio_url.strip() if has_portfolio_link and portfolio_url else None,
        "has_portfolio": has_portfolio_link,
        "bonus": portfolio_bonus,
    }

    bonus_applied = {
        "hackathon_bonus": hackathon_bonus,
        "paper_bonus": paper_bonus,
        "portfolio_bonus": portfolio_bonus,
        "self_reported": True,
    }
    bonus_total = hackathon_bonus + paper_bonus + portfolio_bonus

    disclosed_score = base_score * coverage_factor + bonus_total

    # Monotonicity floor: disclosing a weak platform must never score below
    # omitting it. Recompute as if dampened platforms were never connected;
    # the disclosed score stands on ties and above, the floor guards below.
    full_only = [p for p in platform_scores if reliable[p]]
    if len(full_only) == len(platform_scores):
        monotonic_floor_applied = False
        final_score = disclosed_score
    else:
        full_weights = {p: PLATFORM_WEIGHTS[p] for p in full_only}
        full_total = sum(full_weights.values())
        base_full = (
            sum(platform_scores[p] * full_weights[p] for p in full_only) / full_total
            if full_total > 0 else 0.0
        )
        coverage_full = min(len(full_only), CORE_PLATFORM_COUNT) / CORE_PLATFORM_COUNT if CORE_PLATFORM_COUNT > 0 else 0.0
        floor_score = base_full * (BASE_COVERAGE_FACTOR + COVERAGE_WEIGHT * coverage_full) + bonus_total
        monotonic_floor_applied = floor_score > disclosed_score
        final_score = max(disclosed_score, floor_score)

    clamped_score = round(float(max(0.0, min(1.0, final_score))), 4)

    if return_details:
        return {
            "profile_score": clamped_score,
            "base_score": round(float(base_score), 4),
            "coverage": round(float(coverage), 4),
            "coverage_factor": round(float(coverage_factor), 4),
            "platforms_used": platforms_used,
            "platform_scores": {p: round(float(s), 4) for p, s in platform_scores.items()},
            "weight_info": weight_info,
            "monotonic_floor_applied": monotonic_floor_applied,
            "bonus_applied": bonus_applied,
            "portfolio": portfolio_info,
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
    parser.add_argument("--codeforces", type=str, help="Codeforces handle")
    parser.add_argument("--hackerrank", type=str, help="HackerRank username")
    parser.add_argument("--hackathons", type=int, default=0, help="Number of hackathon wins (self-reported)")
    parser.add_argument("--papers", type=int, default=0, help="Number of papers published (self-reported)")

    args = parser.parse_args()

    if not any([args.github, args.leetcode, args.codechef, args.codeforces, args.hackerrank, args.hackathons, args.papers]):
        print("Usage: python backend/core/profile_extractor.py "
              "[--github USER] [--leetcode USER] [--codechef USER] [--codeforces HANDLE] [--hackerrank USER] [--hackathons INT] [--papers INT]")
        sys.exit(0)

    print("\n" + "=" * 60)
    print("  SkillSync Profile Signal Extraction")
    print("=" * 60)

    gh_stats = fetch_github_stats(args.github) if args.github else None
    lc_stats = fetch_leetcode_stats(args.leetcode) if args.leetcode else None
    cc_stats = fetch_codechef_stats(args.codechef) if args.codechef else None
    cf_stats = fetch_codeforces_stats(args.codeforces) if args.codeforces else None
    hr_stats = fetch_hackerrank_stats(args.hackerrank) if args.hackerrank else None

    print(f"\n[GitHub]     : {json.dumps(gh_stats, indent=2, default=str)}")
    print(f"\n[LeetCode]   : {json.dumps(lc_stats, indent=2, default=str)}")
    print(f"\n[CodeChef]   : {json.dumps(cc_stats, indent=2, default=str)}")
    print(f"\n[Codeforces] : {json.dumps(cf_stats, indent=2, default=str)}")
    print(f"\n[HackerRank] : {json.dumps(hr_stats, indent=2, default=str)}")

    score_result = compute_profile_score(
        github=gh_stats,
        leetcode=lc_stats,
        codechef=cc_stats,
        codeforces=cf_stats,
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
    if cf_stats:
        r = REFERENCE_RANGES["codeforces"]
        s_prob = _min_max_normalize(float(cf_stats.get("problems_solved", 0)), *r["problems_solved"])
        print(f"    Codeforces : problems={s_prob:.2f}, rating={cf_stats.get('rating')}")
    if hr_stats:
        r = REFERENCE_RANGES["hackerrank"]
        s_b = _min_max_normalize(float(hr_stats.get("badges_count", 0)), *r["badges_count"])
        s_p = _min_max_normalize(float(hr_stats.get("problems_solved", 0)), *r["problems_solved"])
        print(f"    HackerRank : badges={s_b:.2f}, problems={s_p:.2f}")

    print(f"    Base Score : {score_result['base_score']:.4f}")
    print(f"    Coverage   : {score_result['coverage']:.2f} (factor {score_result['coverage_factor']:.2f}, used: {', '.join(score_result['platforms_used']) or 'none'})")
    for plat, info in score_result.get("weight_info", {}).items():
        print(f"    Weight {plat:10s}: {info['status']:11s} (raw {info['raw_weight']:.2f} -> eff {info['effective_weight']:.3f})")
    if score_result.get("monotonic_floor_applied"):
        print("    Floor      : weak-platform disclosure guarded (omitted-score applied)")
    print(f"    Bonuses    : {json.dumps(score_result['bonus_applied'])}")

    print(f"\n{'=' * 60}")
    print(f"  PROFILE SCORE: {score_result['profile_score']:.4f} / 1.0000")
    print(f"{'=' * 60}\n")


