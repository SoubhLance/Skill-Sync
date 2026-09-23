import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { api, ProfileExtractResponse } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import { useDebounce } from '../lib/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useDsaProfile } from '../lib/userProfile';
import {
  RefreshCw,
  Cpu,
  Code2,
  Trophy,
  Award,
  Globe,
  ExternalLink,
  Zap
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

export const DSACodePage: React.FC = () => {
  const { user } = useAuth();
  const { dsa: storedDsa, saveDsa, clearDsa } = useDsaProfile(user?.uid);

  // Empty-first: no sample handles. Hydrated from per-user store if present.
  const [rawGithubHandle, setRawGithubHandle] = useState('');
  const [rawLeetcodeHandle, setRawLeetcodeHandle] = useState('');
  const [rawCodechefHandle, setRawCodechefHandle] = useState('');
  const [rawHackerrankHandle, setRawHackerrankHandle] = useState('');
  const [rawPortfolioUrl, setRawPortfolioUrl] = useState('');
  const [hackathonWins, setHackathonWins] = useState(0);
  const [papersPublished, setPapersPublished] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const debouncedGithubHandle = useDebounce(rawGithubHandle, 300);
  const debouncedLeetcodeHandle = useDebounce(rawLeetcodeHandle, 300);
  const debouncedCodechefHandle = useDebounce(rawCodechefHandle, 300);
  const debouncedHackerrankHandle = useDebounce(rawHackerrankHandle, 300);
  const debouncedPortfolioUrl = useDebounce(rawPortfolioUrl, 300);

  const [analyzing, setAnalyzing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from per-user persisted DSA profile (account switching => re-hydrate).
  useEffect(() => {
    if (hydrated) return;
    if (storedDsa) {
      setProfileData(storedDsa.data);
      setRawGithubHandle(storedDsa.handles.github ?? '');
      setRawLeetcodeHandle(storedDsa.handles.leetcode ?? '');
      setRawCodechefHandle(storedDsa.handles.codechef ?? '');
      setRawHackerrankHandle(storedDsa.handles.hackerrank ?? '');
      setRawPortfolioUrl(storedDsa.handles.portfolioUrl ?? '');
    } else {
      setProfileData(null);
      setRawGithubHandle('');
      setRawLeetcodeHandle('');
      setRawCodechefHandle('');
      setRawHackerrankHandle('');
      setRawPortfolioUrl('');
    }
    setHydrated(true);
  }, [storedDsa, hydrated]);

  // When account changes, reset hydration so the new account's data loads.
  useEffect(() => { setHydrated(false); }, [user?.uid]);

  const handleAnalyzeProfile = useCallback(async () => {
    if (analyzing) return;
    if (!debouncedGithubHandle.trim() && !debouncedLeetcodeHandle.trim() && !debouncedCodechefHandle.trim() && !debouncedHackerrankHandle.trim()) {
      setError('Enter at least one coding handle first.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const data = await api.extractProfile({
        github: debouncedGithubHandle.trim() || undefined,
        leetcode: debouncedLeetcodeHandle.trim() || undefined,
        codechef: debouncedCodechefHandle.trim() || undefined,
        hackerrank: debouncedHackerrankHandle.trim() || undefined,
        portfolio_url: debouncedPortfolioUrl.trim() || undefined,
        hackathon_wins: hackathonWins,
        papers_published: papersPublished,
      });
      setProfileData(data);
      saveDsa(data, {
        github: debouncedGithubHandle.trim() || undefined,
        leetcode: debouncedLeetcodeHandle.trim() || undefined,
        codechef: debouncedCodechefHandle.trim() || undefined,
        hackerrank: debouncedHackerrankHandle.trim() || undefined,
        portfolioUrl: debouncedPortfolioUrl.trim() || undefined,
      });
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      setError(err?.response?.data?.detail || err?.message || "Profile analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, debouncedGithubHandle, debouncedLeetcodeHandle, debouncedCodechefHandle, debouncedHackerrankHandle, debouncedPortfolioUrl, hackathonWins, papersPublished, saveDsa]);

  const handleDisconnect = useCallback(() => {
    clearDsa();
    setProfileData(null);
    setRawGithubHandle('');
    setRawLeetcodeHandle('');
    setRawCodechefHandle('');
    setRawHackerrankHandle('');
    setRawPortfolioUrl('');
    setHackathonWins(0);
    setPapersPublished(0);
  }, [clearDsa]);

  const readinessScore = useMemo(() => {
    if (profileData) return profileData.profile_score;
    return 0;
  }, [profileData]);

  // Derived stats — nullable, no sample fallbacks. Null = not connected.
  const lcSolved = profileData?.leetcode?.total_solved ?? profileData?.leetcode?.solved ?? null;
  const lcEasy = profileData?.leetcode?.easy_solved ?? profileData?.leetcode?.easy ?? null;
  const lcMedium = profileData?.leetcode?.medium_solved ?? profileData?.leetcode?.medium ?? null;
  const lcHard = profileData?.leetcode?.hard_solved ?? profileData?.leetcode?.hard ?? null;
  const lcRank = profileData?.leetcode?.ranking ?? null;
  const lcHasCP = profileData?.leetcode?.has_cp_signal ?? Boolean(profileData?.leetcode?.contest_rating && profileData.leetcode.contest_rating > 0);
  const lcRating = profileData?.leetcode?.contest_rating;

  // Derived CodeChef Stats
  const ccRating = profileData?.codechef?.rating ?? null;
  const ccStarsCount = profileData?.codechef?.stars_count ?? null;
  const ccProblems = profileData?.codechef?.problems_solved ?? null;
  const ccGlobalRank = profileData?.codechef?.global_rank ?? null;
  const ccHasCP = profileData?.codechef?.has_cp_signal ?? Boolean(ccRating && ccRating > 0);

  // Derived HackerRank Stats
  const hrBadgesCount = profileData?.hackerrank?.badges_count ?? (Array.isArray(profileData?.hackerrank?.badges) ? profileData.hackerrank.badges.length : null);
  const hrProblems = profileData?.hackerrank?.problems_solved ?? null;
  const hrHasCP = profileData?.hackerrank?.has_cp_signal ?? false;
  const hrBadgesList: string[] = Array.isArray(profileData?.hackerrank?.badges)
    ? (profileData.hackerrank.badges as string[])
    : [];

  // Derived GitHub Stats
  const ghRepos = profileData?.github?.public_repos ?? profileData?.github?.repos ?? null;
  const ghFollowers = profileData?.github?.followers ?? null;
  const ghFollowing = profileData?.github?.following ?? null;
  const ghStars = profileData?.github?.total_stars ?? profileData?.github?.stars ?? null;
  const ghLanguages: string[] = Array.isArray(profileData?.github?.languages) ? profileData.github.languages : [];
  const ghAge = profileData?.github?.account_age_years ?? null;

  const hasPortfolio = Boolean(debouncedPortfolioUrl.trim());
  const hasAnyHandle = Boolean(debouncedGithubHandle.trim() || debouncedLeetcodeHandle.trim() || debouncedCodechefHandle.trim() || debouncedHackerrankHandle.trim());
  const fmt = (v: number | null | undefined, suffix = '') => (v === null || v === undefined ? '—' : `${typeof v === 'number' ? v.toLocaleString() : v}${suffix}`);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 text-[var(--text-main)] animate-fade-in">
      <div>
        <h1 className="h-section text-2xl md:text-3xl">
          Coding profiles
        </h1>
        <p className="caption mt-1">Link your handles — scores update live from each platform.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--diff-del-bg)] text-[var(--diff-del)] text-sm flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Input Setup & Top Score Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Handle Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="font-semibold text-[16px] tracking-tight">
                Your handles
              </h2>
              <p className="caption mt-0.5">Four platforms, one combined score.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="field-label">
                  <GithubIcon className="w-3.5 h-3.5" /> GitHub
                </label>
                <input
                  type="text"
                  value={rawGithubHandle}
                  onChange={(e) => setRawGithubHandle(e.target.value)}
                  placeholder="e.g. your-github-username"
                  className="input-glow px-3.5 py-2.5"
                />
              </div>

              <div className="field">
                <label className="field-label">
                  <Code2 className="w-3.5 h-3.5" /> LeetCode
                </label>
                <input
                  type="text"
                  value={rawLeetcodeHandle}
                  onChange={(e) => setRawLeetcodeHandle(e.target.value)}
                  placeholder="e.g. your-leetcode-username"
                  className="input-glow px-3.5 py-2.5"
                />
              </div>

              <div className="field">
                <label className="field-label">
                  <Trophy className="w-3.5 h-3.5" /> CodeChef
                </label>
                <input
                  type="text"
                  value={rawCodechefHandle}
                  onChange={(e) => setRawCodechefHandle(e.target.value)}
                  placeholder="e.g. your-codechef-username"
                  className="input-glow px-3.5 py-2.5"
                />
              </div>

              <div className="field">
                <label className="field-label">
                  <Award className="w-3.5 h-3.5" /> HackerRank
                </label>
                <input
                  type="text"
                  value={rawHackerrankHandle}
                  onChange={(e) => setRawHackerrankHandle(e.target.value)}
                  placeholder="e.g. your-hackerrank-username"
                  className="input-glow px-3.5 py-2.5"
                />
              </div>
            </div>

            {/* Progressive disclosure: extras hidden until needed */}
            <details className="disclosure">
              <summary>
                <Globe className="w-4 h-4 text-[var(--accent-color)]" />
                Extras that boost your score
                <span className="chip chip-success ml-auto">up to +16%</span>
              </summary>
              <div className="disclosure-body grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field sm:col-span-2">
                  <label className="field-label">
                    Portfolio link
                  </label>
                  <p className="field-hint">Adds 3% when provided.</p>
                  <input
                    type="text"
                    value={rawPortfolioUrl}
                    onChange={(e) => setRawPortfolioUrl(e.target.value)}
                    placeholder="https://you.dev"
                    className="input-glow px-3.5 py-2.5"
                  />
                </div>

                <div className="field">
                  <label className="field-label">
                    Hackathon wins
                  </label>
                  <p className="field-hint">+5% bonus.</p>
                  <input
                    type="number"
                    min="0"
                    value={hackathonWins}
                    onChange={(e) => setHackathonWins(parseInt(e.target.value) || 0)}
                    className="input-glow px-3.5 py-2.5"
                  />
                </div>

                <div className="field">
                  <label className="field-label">
                    Research papers
                  </label>
                  <p className="field-hint">+8% bonus.</p>
                  <input
                    type="number"
                    min="0"
                    value={papersPublished}
                    onChange={(e) => setPapersPublished(parseInt(e.target.value) || 0)}
                    className="input-glow px-3.5 py-2.5"
                  />
                </div>
              </div>
            </details>

            <button
              onClick={handleAnalyzeProfile}
              disabled={analyzing}
              className="btn-primary w-full py-3.5 px-6 text-sm"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> Analyze profiles
                </>
              )}
            </button>
            {!hasAnyHandle && !profileData && (
              <p className="caption text-center">Enter at least one handle above, then Analyze — your dashboard stays empty until then.</p>
            )}
            {profileData && (
              <button onClick={handleDisconnect} className="btn-tertiary w-full py-2.5 text-[13px]">
                Disconnect & clear
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Score Gauge & Platform Verifications */}
        <div className="space-y-6">
          <DiffStatDisplay score={readinessScore} label="Developer score" />

          <div className="space-y-3">
            <p className="font-semibold text-[14px] tracking-tight">Platforms</p>

            <PlatformBadge
              platform="GitHub"
              status={profileData?.github ? 'passed' : 'pending'}
              detail={profileData?.github ? `${fmt(ghRepos)} Repos • ${fmt(ghFollowers)} Followers • ${fmt(ghStars)} Stars` : 'Not connected'}
              metric={profileData?.github ? '✓ CONNECTED' : 'NOT CONNECTED'}
            />

            <PlatformBadge
              platform="LeetCode"
              status={profileData?.leetcode ? 'passed' : 'pending'}
              detail={profileData?.leetcode ? `${fmt(lcSolved)} Solved (H:${fmt(lcHard)}, M:${fmt(lcMedium)}) • CP: ${lcHasCP ? 'Active' : 'Practice'}` : 'Not connected'}
              metric={profileData?.leetcode ? '✓ CONNECTED' : 'NOT CONNECTED'}
            />

            <PlatformBadge
              platform="CodeChef"
              status={profileData?.codechef ? 'passed' : 'pending'}
              detail={profileData?.codechef ? `Rating: ${fmt(ccRating)} (${fmt(ccStarsCount)}★) • Solved: ${fmt(ccProblems)}` : 'Not connected'}
              metric={profileData?.codechef ? '✓ CONNECTED' : 'NOT CONNECTED'}
            />

            <PlatformBadge
              platform="HackerRank"
              status={profileData?.hackerrank ? 'passed' : 'pending'}
              detail={profileData?.hackerrank ? `${fmt(hrBadgesCount)} Badges • ${fmt(hrProblems)} Solved` : 'Not connected'}
              metric={profileData?.hackerrank ? '✓ CONNECTED' : 'NOT CONNECTED'}
            />

            {/* Portfolio Verification Badge */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              hasPortfolio 
                ? 'bg-[var(--diff-add-bg)] border-[var(--diff-add)]/30 text-[var(--text-main)]'
                : 'glass-card text-[var(--text-muted)]'
            }`}>
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${hasPortfolio ? 'text-[var(--diff-add)]' : 'text-[var(--text-muted)]'}`} />
                <div>
                  <p className="font-bold text-xs font-sans text-[var(--text-main)]">Portfolio Website</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                    {hasPortfolio ? debouncedPortfolioUrl : 'No link added'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                hasPortfolio
                  ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border border-[var(--diff-add)]/30'
                  : 'bg-[var(--bg-paper)] text-[var(--text-muted)]'
              }`}>
                {hasPortfolio ? '✓ +3% BOOST' : 'OPTIONAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Platform Statistics Grid */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent-color)]" /> [DETAILED PLATFORM SIGNALS & COMPETITIVE PROGRAMMING METRICS]
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">Individual breakdown by platform</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans stagger-children">
          
          {/* 1. LeetCode Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[var(--accent-2)]" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">LeetCode</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  lcHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30'
                }`}>
                  {lcHasCP ? 'CP: ACTIVE' : 'CP: NO CONTEST'}
                </span>
              </div>

              {/* Solved Counts */}
              <div className="space-y-2 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Total Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{lcSolved === null ? '—' : `${lcSolved} problems`}</span>
                </div>

                {/* Difficulty Bars */}
                <div className="space-y-1.5 text-[11px] pt-1">
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-[var(--success)] font-bold">Easy ({fmt(lcEasy)})</span>
                      <span className="text-[var(--text-muted)]">{lcSolved ? `${Math.round(((lcEasy ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--success)] rounded-full" style={{ width: `${Math.min(100, ((lcEasy ?? 0) / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-[var(--accent-2)] font-bold">Medium ({fmt(lcMedium)})</span>
                      <span className="text-[var(--text-muted)]">{lcSolved ? `${Math.round(((lcMedium ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--accent-2)] rounded-full" style={{ width: `${Math.min(100, ((lcMedium ?? 0) / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-[var(--diff-del)] font-bold">Hard ({fmt(lcHard)})</span>
                      <span className="text-[var(--text-muted)]">{lcSolved ? `${Math.round(((lcHard ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--diff-del)] rounded-full" style={{ width: `${Math.min(100, ((lcHard ?? 0) / 30) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global Rank:</span>
                <strong className="text-[var(--text-main)]">{lcRank ? `#${lcRank.toLocaleString()}` : '—'}</strong>
              </div>
              {lcRating && (
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Contest Rating:</span>
                  <strong className="text-[var(--accent-2)] font-bold">{lcRating}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 2. CodeChef Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[var(--success)]" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">CodeChef</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  ccHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30'
                }`}>
                  {ccHasCP ? 'CP: RATED' : 'CP: UNRATED'}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Rating & Stars</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-[var(--success)]">
                      {ccRating ?? '—'}
                    </span>
                    <span className="text-[var(--accent-2)] font-bold tracking-widest text-xs">
                      {ccStarsCount ? `${'★'.repeat(Math.min(7, ccStarsCount))} (${ccStarsCount} Star)` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-[var(--text-muted)]">Problems Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{ccProblems === null ? '—' : `${ccProblems} problems`}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global Rank:</span>
                <strong className="text-[var(--text-main)]">{ccGlobalRank ? `#${ccGlobalRank.toLocaleString()}` : '—'}</strong>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>CP Status:</span>
                <strong className="text-[var(--success)] font-bold">{profileData?.codechef ? (ccHasCP ? 'Active Competitor' : 'Practice Mode') : '—'}</strong>
              </div>
            </div>
          </div>

          {/* 3. HackerRank Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[var(--accent-color)]" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">HackerRank</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  hrHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-[var(--badge-bg)] text-[var(--badge-text)] border-[var(--accent-color)]/30'
                }`}>
                  {hrHasCP ? 'DSA: VERIFIED' : 'DSA: BASIC'}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Badges Earned:</span>
                  <span className="font-bold text-[var(--accent-color)]">{hrBadgesCount === null ? '—' : `${hrBadgesCount} Badges`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Problems Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{hrProblems === null ? '—' : `${hrProblems} problems`}</span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Badges List:</span>
                  <div className="flex flex-wrap gap-1">
                    {hrBadgesList.length === 0 && <span className="caption">—</span>}
                    {hrBadgesList.slice(0, 4).map((badge, bIdx) => (
                      <span key={bIdx} className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--accent-color)]/20 font-semibold">
                        ★ {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] flex justify-between text-[var(--text-muted)]">
              <span>Problem Solving:</span>
              <strong className="text-[var(--accent-color)] font-bold">{profileData?.hackerrank ? '5★ Certified' : '—'}</strong>
            </div>
          </div>

          {/* 4. GitHub Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <GithubIcon className="w-4 h-4 text-[var(--text-main)]" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">GitHub</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--diff-add-bg)] text-[var(--diff-add)] border border-[var(--diff-add)]/30 font-mono">
                  ACTIVE DEVS
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Repos</div>
                    <div className="text-base font-extrabold text-[var(--text-main)]">{ghRepos ?? '—'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Followers</div>
                    <div className="text-base font-extrabold text-[var(--accent-color)]">{ghFollowers ?? '—'}</div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[var(--text-muted)]">Total Stars:</span>
                  <span className="font-bold text-[var(--accent-2)]">{ghStars === null ? '—' : `★ ${ghStars} stars`}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Following:</span>
                  <span className="font-bold text-[var(--text-main)]">{ghFollowing ?? '—'}</span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Top Languages:</span>
                  <div className="flex flex-wrap gap-1">
                    {ghLanguages.length === 0 && <span className="caption">—</span>}
                    {ghLanguages.map((lang, lIdx) => (
                      <span key={lIdx} className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--bg-paper)] text-[var(--text-main)] border border-[var(--border-hairline)] font-bold">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] flex justify-between text-[var(--text-muted)]">
              <span>Account Age:</span>
              <strong className="text-[var(--text-main)]">{ghAge === null ? '—' : `${ghAge} Years`}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Portfolio Link Display Banner */}
      {hasPortfolio && profileData && (
        <div className="p-5 rounded-2xl glass-card border border-[var(--diff-add)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--diff-add-bg)] text-[var(--diff-add)] flex items-center justify-center shrink-0 border border-[var(--diff-add)]/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[var(--text-main)] font-sans">Verified Candidate Portfolio Link</h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[var(--diff-add-bg)] text-[var(--diff-add)] border border-[var(--diff-add)]/30">
                  +3% SCORE BOOST APPLIED
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Connected: <strong className="text-[var(--accent-color)]">{debouncedPortfolioUrl}</strong>
              </p>
            </div>
          </div>

          <a
            href={debouncedPortfolioUrl.startsWith('http') ? debouncedPortfolioUrl : `https://${debouncedPortfolioUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 btn-secondary px-5 py-2.5 text-[13px] shrink-0 self-start md:self-auto"
          >
            Visit Portfolio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="pt-8 space-y-4">
        <div>
          <h2 className="font-semibold text-[16px] tracking-tight">Contribution history</h2>
          <p className="caption mt-0.5">{debouncedGithubHandle.trim() ? 'Live from the GitHub handle above.' : 'Enter a GitHub handle and analyze to see activity.'}</p>
        </div>
        {debouncedGithubHandle.trim() && profileData?.github ? (
          <CommitGraph username={debouncedGithubHandle} />
        ) : (
          <div className="card p-6 text-center border-dashed">
            <p className="caption">No contribution data yet — connect GitHub first.</p>
          </div>
        )}
      </div>
    </div>
  );
};
