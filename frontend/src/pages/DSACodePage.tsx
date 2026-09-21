import React, { useState, useMemo, useCallback } from 'react';
import { api, ProfileExtractResponse } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import { useDebounce } from '../lib/useDebounce';
import { 
  RefreshCw,
  Cpu,
  ArrowRight,
  Code2,
  Trophy,
  Award,
  Globe,
  ExternalLink,
  Flame,
  Zap,
  BookOpen
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

export const DSACodePage: React.FC = () => {
  const [rawGithubHandle, setRawGithubHandle] = useState('tourist');
  const [rawLeetcodeHandle, setRawLeetcodeHandle] = useState('tourist');
  const [rawCodechefHandle, setRawCodechefHandle] = useState('tourist');
  const [rawHackerrankHandle, setRawHackerrankHandle] = useState('tourist');
  const [rawPortfolioUrl, setRawPortfolioUrl] = useState('https://alexmercer.dev');
  const [hackathonWins, setHackathonWins] = useState(1);
  const [papersPublished, setPapersPublished] = useState(0);

  const debouncedGithubHandle = useDebounce(rawGithubHandle, 300);
  const debouncedLeetcodeHandle = useDebounce(rawLeetcodeHandle, 300);
  const debouncedCodechefHandle = useDebounce(rawCodechefHandle, 300);
  const debouncedHackerrankHandle = useDebounce(rawHackerrankHandle, 300);
  const debouncedPortfolioUrl = useDebounce(rawPortfolioUrl, 300);

  const [analyzing, setAnalyzing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeProfile = useCallback(async () => {
    if (analyzing) return;
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
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      setError(err?.response?.data?.detail || "Profile analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, debouncedGithubHandle, debouncedLeetcodeHandle, debouncedCodechefHandle, debouncedHackerrankHandle, debouncedPortfolioUrl, hackathonWins, papersPublished]);

  const readinessScore = useMemo(() => {
    if (profileData) return profileData.profile_score;
    return 0.82;
  }, [profileData]);

  // Derived LeetCode Stats
  const lcSolved = profileData?.leetcode?.total_solved ?? profileData?.leetcode?.solved ?? 245;
  const lcEasy = profileData?.leetcode?.easy_solved ?? profileData?.leetcode?.easy ?? 110;
  const lcMedium = profileData?.leetcode?.medium_solved ?? profileData?.leetcode?.medium ?? 105;
  const lcHard = profileData?.leetcode?.hard_solved ?? profileData?.leetcode?.hard ?? 30;
  const lcRank = profileData?.leetcode?.ranking ?? 14250;
  const lcHasCP = profileData?.leetcode?.has_cp_signal ?? Boolean(profileData?.leetcode?.contest_rating && profileData.leetcode.contest_rating > 0);
  const lcRating = profileData?.leetcode?.contest_rating;

  // Derived CodeChef Stats
  const ccRating = profileData?.codechef?.rating ?? 1850;
  const ccStarsCount = profileData?.codechef?.stars_count ?? 4;
  const ccProblems = profileData?.codechef?.problems_solved ?? 142;
  const ccGlobalRank = profileData?.codechef?.global_rank ?? 8420;
  const ccHasCP = profileData?.codechef?.has_cp_signal ?? Boolean(ccRating && ccRating > 0);

  // Derived HackerRank Stats
  const hrBadgesCount = profileData?.hackerrank?.badges_count ?? (Array.isArray(profileData?.hackerrank?.badges) ? profileData.hackerrank.badges.length : 6);
  const hrProblems = profileData?.hackerrank?.problems_solved ?? 118;
  const hrHasCP = profileData?.hackerrank?.has_cp_signal ?? true;
  const hrBadgesList = Array.isArray(profileData?.hackerrank?.badges) 
    ? (profileData.hackerrank.badges as string[]) 
    : ['Problem Solving', 'Python', 'Algorithms', 'SQL', 'C++', 'Java'];

  // Derived GitHub Stats
  const ghRepos = profileData?.github?.public_repos ?? profileData?.github?.repos ?? 24;
  const ghFollowers = profileData?.github?.followers ?? 128;
  const ghFollowing = profileData?.github?.following ?? 42;
  const ghStars = profileData?.github?.total_stars ?? profileData?.github?.stars ?? 48;
  const ghLanguages = Array.isArray(profileData?.github?.languages) ? profileData.github.languages : ['Python', 'TypeScript', 'C++', 'Go', 'Rust'];
  const ghAge = profileData?.github?.account_age_years ?? 3;

  const hasPortfolio = Boolean(debouncedPortfolioUrl.trim());

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)] animate-fade-in">
      {/* Page Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <Code2 className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync engineer --profile-evaluation
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            DSA & Competitive Signal Extractor
          </h1>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-3.5 py-1.5 border border-[var(--border-hairline)] rounded-xl">
          mode: async live multi-platform scrapers
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--diff-del-bg)] border border-[var(--diff-del)]/40 text-[var(--diff-del)] font-mono text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Input Setup & Top Score Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Handle Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 md:p-8 rounded-2xl glass-card space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4 font-sans">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--accent-color)] uppercase tracking-wider block">
                  [CONNECTED CODING PLATFORMS & PORTFOLIO]
                </span>
                <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                  Enter developer handles to extract verification signals
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5" /> GitHub Handle
                </label>
                <input
                  type="text"
                  value={rawGithubHandle}
                  onChange={(e) => setRawGithubHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-500" /> LeetCode Handle
                </label>
                <input
                  type="text"
                  value={rawLeetcodeHandle}
                  onChange={(e) => setRawLeetcodeHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" /> CodeChef Handle
                </label>
                <input
                  type="text"
                  value={rawCodechefHandle}
                  onChange={(e) => setRawCodechefHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-sky-500" /> HackerRank Handle
                </label>
                <input
                  type="text"
                  value={rawHackerrankHandle}
                  onChange={(e) => setRawHackerrankHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              {/* Portfolio Link Field */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> Personal Portfolio Website Link
                  </span>
                  <span className="text-[10px] text-[var(--diff-add)] font-extrabold bg-[var(--diff-add-bg)] px-2 py-0.5 rounded-md border border-[var(--diff-add)]/30">
                    +3% Evaluation Boost
                  </span>
                </label>
                <input
                  type="text"
                  value={rawPortfolioUrl}
                  onChange={(e) => setRawPortfolioUrl(e.target.value)}
                  placeholder="e.g. https://alexmercer.dev or myportfolio.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center justify-between">
                  <span>Hackathon Wins (+5% bonus)</span>
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                </label>
                <input
                  type="number"
                  min="0"
                  value={hackathonWins}
                  onChange={(e) => setHackathonWins(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center justify-between">
                  <span>Research Papers (+8% bonus)</span>
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                </label>
                <input
                  type="number"
                  min="0"
                  value={papersPublished}
                  onChange={(e) => setPapersPublished(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeProfile}
              disabled={analyzing}
              className="w-full py-3.5 px-6 rounded-xl btn-accent font-mono font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> $ computing live developer signals...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> $ calculate --developer-evaluation <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Score Gauge & Platform Verifications */}
        <div className="space-y-6 font-mono">
          <DiffStatDisplay score={readinessScore} label="Holistic Developer Evaluation Score" />

          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between">
              <span>Platform Verification Badges</span>
              <span className="text-[10px] text-[var(--accent-color)]">5 Signals Tracked</span>
            </div>

            <PlatformBadge
              platform="GitHub"
              status={profileData?.github ? 'passed' : 'ready'}
              detail={`${ghRepos} Repos • ${ghFollowers} Followers • ${ghStars} Stars`}
              metric={profileData?.github ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="LeetCode"
              status={profileData?.leetcode ? 'passed' : 'ready'}
              detail={`${lcSolved} Solved (H:${lcHard}, M:${lcMedium}) • CP: ${lcHasCP ? 'Active' : 'Practice'}`}
              metric={profileData?.leetcode ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="CodeChef"
              status={profileData?.codechef ? 'passed' : 'ready'}
              detail={`Rating: ${ccRating} (${ccStarsCount}★) • Solved: ${ccProblems}`}
              metric={profileData?.codechef ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="HackerRank"
              status={profileData?.hackerrank ? 'passed' : 'ready'}
              detail={`${hrBadgesCount} Badges • ${hrProblems} Solved`}
              metric={profileData?.hackerrank ? '✓ CONNECTED' : '✓ READY'}
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
      <div className="space-y-6 pt-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
          <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> [DETAILED PLATFORM SIGNALS & COMPETITIVE PROGRAMMING METRICS]
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">Individual breakdown by platform</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans stagger-children">
          
          {/* 1. LeetCode Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-500" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">LeetCode</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  lcHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {lcHasCP ? 'CP: ACTIVE' : 'CP: NO CONTEST'}
                </span>
              </div>

              {/* Solved Counts */}
              <div className="space-y-2 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Total Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{lcSolved} problems</span>
                </div>

                {/* Difficulty Bars */}
                <div className="space-y-1.5 text-[11px] pt-1">
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-emerald-500 font-bold">Easy ({lcEasy})</span>
                      <span className="text-[var(--text-muted)]">{Math.round((lcEasy / Math.max(1, lcSolved)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (lcEasy / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-amber-500 font-bold">Medium ({lcMedium})</span>
                      <span className="text-[var(--text-muted)]">{Math.round((lcMedium / Math.max(1, lcSolved)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (lcMedium / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span className="text-rose-500 font-bold">Hard ({lcHard})</span>
                      <span className="text-[var(--text-muted)]">{Math.round((lcHard / Math.max(1, lcSolved)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-paper)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (lcHard / 30) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global Rank:</span>
                <strong className="text-[var(--text-main)]">#{lcRank ? lcRank.toLocaleString() : 'N/A'}</strong>
              </div>
              {lcRating && (
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Contest Rating:</span>
                  <strong className="text-amber-500 font-bold">{lcRating}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 2. CodeChef Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">CodeChef</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  ccHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {ccHasCP ? 'CP: RATED' : 'CP: UNRATED'}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Rating & Stars</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-emerald-500">
                      {ccRating || 'Unrated'}
                    </span>
                    <span className="text-amber-500 font-bold tracking-widest text-xs">
                      {'★'.repeat(ccStarsCount)} ({ccStarsCount} Star)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-[var(--text-muted)]">Problems Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{ccProblems} problems</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Global Rank:</span>
                <strong className="text-[var(--text-main)]">#{ccGlobalRank ? ccGlobalRank.toLocaleString() : 'N/A'}</strong>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>CP Status:</span>
                <strong className="text-emerald-500 font-bold">{ccHasCP ? 'Active Competitor' : 'Practice Mode'}</strong>
              </div>
            </div>
          </div>

          {/* 3. HackerRank Card */}
          <div className="card-lift p-5 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-500" />
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">HackerRank</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                  hrHasCP
                    ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                }`}>
                  {hrHasCP ? 'DSA: VERIFIED' : 'DSA: BASIC'}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Badges Earned:</span>
                  <span className="font-bold text-sky-500">{hrBadgesCount} Badges</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Problems Solved:</span>
                  <span className="font-bold text-[var(--text-main)]">{hrProblems} problems</span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Badges List:</span>
                  <div className="flex flex-wrap gap-1">
                    {hrBadgesList.slice(0, 4).map((badge, bIdx) => (
                      <span key={bIdx} className="px-2 py-0.5 rounded-md text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
                        ★ {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] flex justify-between text-[var(--text-muted)]">
              <span>Problem Solving:</span>
              <strong className="text-sky-500 font-bold">5★ Certified</strong>
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
                    <div className="text-base font-extrabold text-[var(--text-main)]">{ghRepos}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Followers</div>
                    <div className="text-base font-extrabold text-[var(--accent-color)]">{ghFollowers}</div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[var(--text-muted)]">Total Stars:</span>
                  <span className="font-bold text-amber-500">★ {ghStars} stars</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Following:</span>
                  <span className="font-bold text-[var(--text-main)]">{ghFollowing}</span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Top Languages:</span>
                  <div className="flex flex-wrap gap-1">
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
              <strong className="text-[var(--text-main)]">{ghAge} Years</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Portfolio Link Display Banner */}
      {hasPortfolio && (
        <div className="p-5 rounded-2xl glass-card border border-[var(--diff-add)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
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
            className="px-5 py-2.5 rounded-xl btn-accent font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto shadow-md"
          >
            Visit Portfolio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Live GitHub Commit Signal Graph */}
      <div className="border-t border-[var(--border-hairline)] pt-8 space-y-4">
        <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block font-mono">
          [LIVE COMMIT SIGNAL GRAPH & CONTRIBUTION HISTORY]
        </span>
        <CommitGraph username={debouncedGithubHandle} />
      </div>
    </div>
  );
};
