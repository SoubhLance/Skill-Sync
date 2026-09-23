/**
 * frontend/src/lib/scoring.ts
 * ===========================
 * Shared ATS scoring and skill matching engine.
 * Ensures 100% parity between JD Matcher and Job Explorer.
 *
 * Blended Scoring Formula:
 * blended_score = 0.60 * cosine_sim + 0.25 * profile_score + 0.15 * dsa_score
 */

export interface SkillMatchResult {
  overlap: string[];
  gap: string[];
  match_pct: number;
  semantic_score: number;
  blended_score: number;
}

/**
 * Technical vs Non-technical job classifier.
 * Matches domain and role keywords consistently across JD Matcher and Job Explorer.
 */
export function isTechJob(job: { domain?: string; job_role?: string; skills?: string }): boolean {
  const d = (job.domain || '').toLowerCase();
  const r = (job.job_role || '').toLowerCase();
  const s = (job.skills || '').toLowerCase();

  if (
    d === 'technical' ||
    d.includes('engineering') ||
    d.includes('ai') ||
    d.includes('web') ||
    d.includes('data') ||
    d.includes('cloud')
  ) {
    return true;
  }
  if (
    d === 'general' ||
    d.includes('finance') ||
    d.includes('business') ||
    d.includes('healthcare')
  ) {
    return false;
  }

  const techKeywords = [
    'developer',
    'engineer',
    'architect',
    'scientist',
    'programmer',
    'full stack',
    'backend',
    'frontend',
    'devops',
    'cyber',
    'qa',
    'firmware',
    'code',
    'python',
    'java',
    'react',
  ];
  return techKeywords.some((kw) => r.includes(kw) || s.includes(kw));
}

/**
 * Evaluates skill overlap, skill gaps, and blended match score for a job role.
 *
 * @param jobSkills - List of skills required by the job role
 * @param userSkills - List of candidate skills from resume or user profile
 * @param jobRole - Name of the job role (used for title fallback matching)
 * @param profileScore - Signal from GitHub/portfolio/platforms (default 0.75)
 * @param dsaScore - Algorithmic signal from LeetCode/CodeChef/HackerRank (default 0.80)
 */
export function evaluateSkillMatch(
  jobSkills: string[],
  userSkills: string[],
  jobRole: string = '',
  profileScore: number = 0.75,
  dsaScore: number = 0.80
): SkillMatchResult {
  const candSkillsLower = userSkills
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const hasQuery = candSkillsLower.length > 0;

  // Calculate Overlapping Skills (case-insensitive & sub-token match)
  const overlap = jobSkills.filter((req) =>
    candSkillsLower.some(
      (cand) =>
        req.toLowerCase() === cand ||
        req.toLowerCase().includes(cand) ||
        cand.includes(req.toLowerCase())
    )
  );

  // Calculate Missing Skill Gaps
  const gap = jobSkills.filter(
    (req) =>
      !candSkillsLower.some(
        (cand) =>
          req.toLowerCase() === cand ||
          req.toLowerCase().includes(cand) ||
          cand.includes(req.toLowerCase())
      )
  );

  let match_pct = 0;
  let semantic_score = 0;

  if (hasQuery && jobSkills.length > 0) {
    const rawRatio = overlap.length / jobSkills.length;
    semantic_score = rawRatio;

    if (overlap.length > 0) {
      match_pct = Math.round(rawRatio * 65 + 30);
    } else {
      const roleMatch = candSkillsLower.some((cand) =>
        jobRole.toLowerCase().includes(cand)
      );
      match_pct = roleMatch ? 45 : 0;
      semantic_score = roleMatch ? 0.35 : 0.05;
    }
  } else if (!hasQuery) {
    match_pct = 0;
    semantic_score = 0;
  } else {
    match_pct = 75;
    semantic_score = 0.75;
  }

  match_pct = Math.min(98, match_pct);

  // Blended scoring pipeline:
  // 0.60 * cosine + 0.25 * profile_score + 0.15 * dsa_score
  const cosine_sim = semantic_score;
  const blended_score =
    0.60 * cosine_sim + 0.25 * profileScore + 0.15 * dsaScore;

  return {
    overlap,
    gap,
    match_pct,
    semantic_score: Math.round(semantic_score * 100) / 100,
    blended_score: Math.round(blended_score * 100) / 100,
  };
}
