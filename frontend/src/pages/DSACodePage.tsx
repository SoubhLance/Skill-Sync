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
  const [rawCodeforcesHandle, setRawCodeforcesHandle] = useState('');
  const [rawHackerrankHandle, setRawHackerrankHandle] = useState('');
  const [rawPortfolioUrl, setRawPortfolioUrl] = useState('');
  const [hackathonWins, setHackathonWins] = useState(0);
  const [papersPublished, setPapersPublished] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const debouncedGithubHandle = useDebounce(rawGithubHandle, 300);
  const debouncedLeetcodeHandle = useDebounce(rawLeetcodeHandle, 300);
  const debouncedCodechefHandle = useDebounce(rawCodechefHandle, 300);
  const debouncedCodeforcesHandle = useDebounce(rawCodeforcesHandle, 300);
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
      setRawCodeforcesHandle(storedDsa.handles.codeforces ?? '');
      setRawHackerrankHandle(storedDsa.handles.hackerrank ?? '');
      setRawPortfolioUrl(storedDsa.handles.portfolioUrl ?? '');
    } else {
      setProfileData(null);
      setRawGithubHandle('');
      setRawLeetcodeHandle('');
      setRawCodechefHandle('');
      setRawCodeforcesHandle('');
      setRawHackerrankHandle('');
      setRawPortfolioUrl('');
    }
    setHydrated(true);
  }, [storedDsa, hydrated]);

  // When account changes, reset hydration so the new account's data loads.
  useEffect(() => { setHydrated(false); }, [user?.uid]);

  const handleAnalyzeProfile = useCallback(async () => {
    if (analyzing) return;
    if (!debouncedGithubHandle.trim() && !debouncedLeetcodeHandle.trim() && !debouncedCodechefHandle.trim() && !debouncedCodeforcesHandle.trim() && !debouncedHackerrankHandle.trim()) {
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
        codeforces: debouncedCodeforcesHandle.trim() || undefined,
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
        codeforces: debouncedCodeforcesHandle.trim() || undefined,
        hackerrank: debouncedHackerrankHandle.trim() || undefined,
        portfolioUrl: debouncedPortfolioUrl.trim() || undefined,
      });
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      setError(err?.response?.data?.detail || err?.message || "Profile analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, debouncedGithubHandle, debouncedLeetcodeHandle, debouncedCodechefHandle, debouncedCodeforcesHandle, debouncedHackerrankHandle, debouncedPortfolioUrl, hackathonWins, papersPublished, saveDsa]);

  const handleDisconnect = useCallback(() => {
    clearDsa();
    setProfileData(null);
    setRawGithubHandle('');
    setRawLeetcodeHandle('');
    setRawCodechefHandle('');
    setRawCodeforcesHandle('');
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

  // Derived Codeforces Stats (null = no account found / not provided)
  const cfRating = profileData?.codeforces?.rating ?? null;
  const cfMaxRating = profileData?.codeforces?.max_rating ?? null;
  const cfRank = profileData?.codeforces?.rank ?? null;
  const cfSolved = profileData?.codeforces?.problems_solved ?? null;
  const cfContests = profileData?.codeforces?.contests_attended ?? null;
  const cfHasCP = profileData?.codeforces?.has_cp_signal ?? Boolean((cfRating && cfRating > 0) || (cfContests && cfContests > 0));

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
  const hasAnyHandle = Boolean(debouncedGithubHandle.trim() || debouncedLeetcodeHandle.trim() || debouncedCodechefHandle.trim() || debouncedCodeforcesHandle.trim() || debouncedHackerrankHandle.trim());
  const fmt = (v: number | null | undefined, suffix = '') => (v === null || v === undefined ? '—' : `${typeof v === 'number' ? v.toLocaleString() : v}${suffix}`);

  return (
    <div className="dsa-scope p-6 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10 text-[var(--text-main)] animate-fade-in">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Handle Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card dsa-hero p-6 md:p-8 space-y-6">
            <div>
              <h2 className="font-semibold text-[16px] tracking-tight">
                Your handles
              </h2>
              <p className="caption mt-0.5">Five platforms, one combined score.</p>
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
                  <Zap className="w-3.5 h-3.5" /> Codeforces
                </label>
                <input
                  type="text"
                  value={rawCodeforcesHandle}
                  onChange={(e) => setRawCodeforcesHandle(e.target.value)}
                  placeholder="e.g. your-codeforces-handle"
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
                <span className="chip chip-success chip-xs ml-auto">up to +16%</span>
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
              className="btn-primary btn-shine dsa-cta w-full py-3.5 px-6 text-sm"
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
          <DiffStatDisplay score={readinessScore} label="Developer score" className="dsa-gauge" />

          <div className="space-y-3">
            <p className="font-semibold text-[14px] tracking-tight">Platforms</p>

            <PlatformBadge
              platform="GitHub"
              status={profileData?.github ? 'passed' : 'pending'}
              detail={profileData?.github ? `${fmt(ghRepos)} Repos • ${fmt(ghFollowers)} Followers • ${fmt(ghStars)} Stars` : 'Not connected'}
              metric={profileData?.github ? 'Connected' : 'Not linked'}
            />

            <PlatformBadge
              platform="LeetCode"
              status={profileData?.leetcode ? 'passed' : 'pending'}
              detail={profileData?.leetcode ? `${fmt(lcSolved)} Solved (H:${fmt(lcHard)}, M:${fmt(lcMedium)}) • CP: ${lcHasCP ? 'Active' : 'Practice'}` : 'Not connected'}
              metric={profileData?.leetcode ? 'Connected' : 'Not linked'}
            />

            <PlatformBadge
              platform="CodeChef"
              status={profileData?.codechef ? 'passed' : 'pending'}
              detail={profileData?.codechef ? `Rating: ${fmt(ccRating)} (${fmt(ccStarsCount)}★) • Solved: ${fmt(ccProblems)}` : 'Not connected'}
              metric={profileData?.codechef ? 'Connected' : 'Not linked'}
            />

            <PlatformBadge
              platform="Codeforces"
              status={profileData?.codeforces ? 'passed' : 'pending'}
              detail={profileData?.codeforces ? `Rating: ${fmt(cfRating)}${cfRank ? ` (${cfRank})` : ''} • Solved: ${fmt(cfSolved)}` : 'Not connected'}
              metric={profileData?.codeforces ? 'Connected' : 'Not linked'}
            />

            <PlatformBadge
              platform="HackerRank"
              status={profileData?.hackerrank ? 'passed' : 'pending'}
              detail={profileData?.hackerrank ? `${fmt(hrBadgesCount)} Badges • ${fmt(hrProblems)} Solved` : 'Not connected'}
              metric={profileData?.hackerrank ? 'Connected' : 'Not linked'}
            />

            {/* Portfolio Verification Badge */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              hasPortfolio 
                ? 'bg-[var(--diff-add-bg)] border-[var(--diff-add)]/30 text-[var(--text-main)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
            }`}>
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${hasPortfolio ? 'text-[var(--diff-add)]' : 'text-[var(--text-muted)]'}`} />
                <div>
                  <p className="font-bold text-xs font-sans text-[var(--text-main)]">Portfolio website</p>
                  <p className="caption truncate max-w-[180px]">
                    {hasPortfolio ? debouncedPortfolioUrl : 'No link added'}
                  </p>
                </div>
              </div>
              <span className={`chip chip-xs font-semibold ${
                hasPortfolio
                  ? 'chip-success'
                  : 'chip-neutral'
              }`}>
                {hasPortfolio ? '+3% boost' : 'Optional'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Platform Statistics Grid */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4 border-b border-[var(--border-hairline)] pb-3">
          <span className="eyebrow shrink-0">
            <Zap className="w-4 h-4 text-[var(--accent-color)]" /> Detailed platform signals
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-hairline)]" />
          <span className="chip chip-xs shrink-0">
            5 platforms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 font-sans stagger-children">
          
          {/* 1. LeetCode Card */}
          <div className="card card-lift dsa-plat p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`dsa-icon ${profileData?.leetcode ? 'on' : ''}`}>
                    <Code2 className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">LeetCode</h3>
                </div>
                <span className={`chip chip-xs font-semibold ${
                  lcHasCP ? 'chip-success' : 'chip-warn'
                }`}>
                  {lcHasCP ? 'Active' : 'No contest'}
                </span>
              </div>

              {/* Solved Counts */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="dsa-kpi-label">Total solved</span>
                  <span className="dsa-kpi dsa-kpi-lg dsa-kpi-emerald">{lcSolved === null ? '—' : lcSolved}</span>
                </div>

                {/* Difficulty Bars */}
                <div className="space-y-1.5 text-[11px] pt-1">
                  <div>
                    <div className="flex justify-between mb-0.5 text-[11px]">
                      <span className="text-[var(--success)] font-semibold">Easy ({fmt(lcEasy)})</span>
                      <span className="text-[var(--text-muted)] font-mono">{lcSolved ? `${Math.round(((lcEasy ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--success)] rounded-full" style={{ width: `${Math.min(100, ((lcEasy ?? 0) / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[11px]">
                      <span className="text-[var(--accent-blue)] font-semibold">Medium ({fmt(lcMedium)})</span>
                      <span className="text-[var(--text-muted)] font-mono">{lcSolved ? `${Math.round(((lcMedium ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--accent-blue)] rounded-full" style={{ width: `${Math.min(100, ((lcMedium ?? 0) / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[11px]">
                      <span className="text-[var(--warning)] font-semibold">Hard ({fmt(lcHard)})</span>
                      <span className="text-[var(--text-muted)] font-mono">{lcSolved ? `${Math.round(((lcHard ?? 0) / Math.max(1, lcSolved)) * 100)}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-[var(--warning)] rounded-full" style={{ width: `${Math.min(100, ((lcHard ?? 0) / 30) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global rank</span>
                <strong className="text-[var(--text-main)] font-mono">{lcRank ? `#${lcRank.toLocaleString()}` : '—'}</strong>
              </div>
              {lcRating && (
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Contest rating</span>
                  <strong className="text-[var(--accent-blue)] font-mono font-bold">{lcRating}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 2. CodeChef Card */}
          <div className="card card-lift dsa-plat p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`dsa-icon ${profileData?.codechef ? 'on' : ''}`}>
                    <Trophy className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">CodeChef</h3>
                </div>
                <span className={`chip chip-xs font-semibold ${
                  ccHasCP ? 'chip-success' : 'chip-warn'
                }`}>
                  {ccHasCP ? 'Rated' : 'Unrated'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-1">
                  <div className="dsa-kpi-label">Rating</div>
                  <div className="flex items-baseline justify-between">
                    <span className="dsa-kpi dsa-kpi-lg dsa-kpi-emerald">
                      {ccRating ?? '—'}
                    </span>
                    <span className="text-[var(--text-muted)] font-semibold text-xs">
                      {ccStarsCount ? `${'★'.repeat(Math.min(7, ccStarsCount))} ${ccStarsCount}-star` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-xs pt-1">
                  <span className="dsa-kpi-label">Problems solved</span>
                  <span className="dsa-kpi dsa-kpi-ink text-sm">{ccProblems === null ? '—' : ccProblems}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global rank</span>
                <strong className="text-[var(--text-main)] font-mono">{ccGlobalRank ? `#${ccGlobalRank.toLocaleString()}` : '—'}</strong>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Standing</span>
                <strong className="text-[var(--success)] font-mono font-bold">{profileData?.codechef ? (ccHasCP ? 'Competitor' : 'Practice') : '—'}</strong>
              </div>
            </div>
          </div>

          {/* 3. Codeforces Card */}
          <div className="card card-lift dsa-plat p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`dsa-icon ${profileData?.codeforces ? 'on' : ''}`}>
                    <Zap className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">Codeforces</h3>
                </div>
                <span className={`chip chip-xs font-semibold ${
                  cfHasCP ? 'chip-success' : 'chip-warn'
                }`}>
                  {cfHasCP ? 'Rated' : 'Unrated'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-1">
                  <div className="dsa-kpi-label">Rating</div>
                  <div className="flex items-baseline justify-between">
                    <span className="dsa-kpi dsa-kpi-lg dsa-kpi-teal">
                      {cfRating ?? '—'}
                    </span>
                    <span className="text-[var(--text-muted)] font-semibold text-xs">
                      {cfRank ?? (profileData?.codeforces ? 'Unrated' : '—')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-xs pt-1">
                  <span className="dsa-kpi-label">Problems solved</span>
                  <span className="dsa-kpi dsa-kpi-ink text-sm">{cfSolved === null ? '—' : cfSolved}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Contests</span>
                <strong className="text-[var(--text-main)] font-mono">{cfContests === null ? '—' : cfContests}</strong>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Peak rating</span>
                <strong className="text-[var(--accent-blue)] font-mono font-bold">{cfMaxRating ?? '—'}</strong>
              </div>
            </div>
          </div>

          {/* 4. HackerRank Card */}
          <div className="card card-lift dsa-plat p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`dsa-icon ${profileData?.hackerrank ? 'on' : ''}`}>
                    <Award className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">HackerRank</h3>
                </div>
                <span className={`chip chip-xs font-semibold ${
                  hrHasCP ? 'chip-success' : 'chip-neutral'
                }`}>
                  {hrHasCP ? 'Verified' : 'Basic'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="dsa-kpi-label">Badges earned</span>
                  <span className="dsa-kpi dsa-kpi-lg dsa-kpi-emerald">{hrBadgesCount === null ? '—' : hrBadgesCount}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="dsa-kpi-label">Problems solved</span>
                  <span className="dsa-kpi dsa-kpi-ink text-sm">{hrProblems === null ? '—' : hrProblems}</span>
                </div>

                <div className="pt-1">
                  <span className="dsa-kpi-label block mb-1">Badge shelf</span>
                  <div className="flex flex-wrap gap-1">
                    {hrBadgesList.length === 0 && <span className="caption">—</span>}
                    {hrBadgesList.slice(0, 4).map((badge, bIdx) => (
                      <span key={bIdx} className="chip chip-xs">
                        ★ {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 text-[11px] flex justify-between text-[var(--text-muted)]">
              <span>Problem solving</span>
              <strong className="text-[var(--success)] font-mono font-bold">{profileData?.hackerrank ? 'Certified' : '—'}</strong>
            </div>
          </div>

          {/* 5. GitHub Card */}
          <div className="card card-lift dsa-plat p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`dsa-icon ${profileData?.github ? 'on' : ''}`}>
                    <GithubIcon className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">GitHub</h3>
                </div>
                <span className={`chip chip-xs font-semibold ${profileData?.github ? 'chip-success' : 'chip-neutral'}`}>
                  {profileData?.github ? 'Active' : 'Not linked'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <div className="dsa-kpi-label">Repos</div>
                    <div className="dsa-kpi dsa-kpi-lg dsa-kpi-ink">{ghRepos ?? '—'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <div className="dsa-kpi-label">Followers</div>
                    <div className="dsa-kpi dsa-kpi-lg dsa-kpi-emerald">{ghFollowers ?? '—'}</div>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-[11px] pt-1">
                  <span className="dsa-kpi-label">Total stars</span>
                  <span className="dsa-kpi dsa-kpi-teal text-sm">{ghStars === null ? '—' : `★ ${ghStars}`}</span>
                </div>
                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="dsa-kpi-label">Following</span>
                  <span className="dsa-kpi dsa-kpi-ink text-sm">{ghFollowing ?? '—'}</span>
                </div>

                <div className="pt-1">
                  <span className="dsa-kpi-label block mb-1">Top languages</span>
                  <div className="flex flex-wrap gap-1">
                    {ghLanguages.length === 0 && <span className="caption">—</span>}
                    {ghLanguages.map((lang, lIdx) => (
                      <span key={lIdx} className="chip chip-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 text-[11px] flex justify-between text-[var(--text-muted)]">
              <span>Account age</span>
              <strong className="text-[var(--text-main)] font-mono">{ghAge === null ? '—' : `${ghAge} yrs`}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Portfolio Link Display Banner */}
      {hasPortfolio && profileData && (
        <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--diff-add-bg)] text-[var(--diff-add)] flex items-center justify-center shrink-0 border border-[var(--diff-add)]/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[var(--text-main)] font-sans">Verified portfolio link</h4>
                <span className="chip chip-success chip-xs font-semibold">
                  +3% boost applied
                </span>
              </div>
              <p className="caption mt-0.5">
                Connected: <strong className="text-[var(--accent-color)] font-mono">{debouncedPortfolioUrl}</strong>
              </p>
            </div>
          </div>

          <a
            href={debouncedPortfolioUrl.startsWith('http') ? debouncedPortfolioUrl : `https://${debouncedPortfolioUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-5 py-2.5 text-[13px] shrink-0 self-start md:self-auto"
          >
            Visit Portfolio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="pt-8 space-y-4">
        <div className="flex items-center gap-4 border-b border-[var(--border-hairline)] pb-3">
          <div className="shrink-0">
            <h2 className="font-semibold text-[16px] tracking-tight">Contribution history</h2>
            <p className="caption mt-0.5">{debouncedGithubHandle.trim() ? 'Live from the GitHub handle above.' : 'Enter a GitHub handle and analyze to see activity.'}</p>
          </div>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-hairline)]" />
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
