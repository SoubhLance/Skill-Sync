import React, { useState, useMemo, useCallback } from 'react';
import { api, ProfileExtractResponse } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import { useDebounce } from '../lib/useDebounce';
import { 
  Terminal, 
  RefreshCw,
  AlertTriangle,
  GitBranch,
  Cpu,
  ArrowRight,
  Code2,
  Trophy,
  Award
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

export const DSACodePage: React.FC = () => {
  const [rawGithubHandle, setRawGithubHandle] = useState('tourist');
  const [rawLeetcodeHandle, setRawLeetcodeHandle] = useState('tourist');
  const [rawCodechefHandle, setRawCodechefHandle] = useState('tourist');
  const [rawHackerrankHandle, setRawHackerrankHandle] = useState('tourist');
  const [hackathonWins, setHackathonWins] = useState(1);
  const [papersPublished, setPapersPublished] = useState(0);

  const debouncedGithubHandle = useDebounce(rawGithubHandle, 300);
  const debouncedLeetcodeHandle = useDebounce(rawLeetcodeHandle, 300);
  const debouncedCodechefHandle = useDebounce(rawCodechefHandle, 300);
  const debouncedHackerrankHandle = useDebounce(rawHackerrankHandle, 300);

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
  }, [analyzing, debouncedGithubHandle, debouncedLeetcodeHandle, debouncedCodechefHandle, debouncedHackerrankHandle, hackathonWins, papersPublished]);

  const readinessScore = useMemo(() => {
    if (profileData) return profileData.profile_score;
    return 0.78;
  }, [profileData]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)]">
      {/* Top Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <GitBranch className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync dsa-code --configure
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            DSA & Competitive Platforms Signal
          </h1>
        </div>

        <span className="font-mono text-xs font-bold text-[#1A7F37] bg-[#DAFBE1] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] px-2.5 py-1 border border-[#2DA44E]/30 rounded-[2px]">
          +{(readinessScore * 100).toFixed(0)}% dsa score
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-sm bg-[#FFEBE9] border border-[#CF222E]/40 text-[#CF222E] font-mono text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Input Forms Column */}
        <div className="lg:col-span-2 space-y-8 font-mono text-xs">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
              [CONNECT PLATFORM HANDLES & ACHIEVEMENTS]
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5" /> GitHub Username
                </label>
                <input
                  type="text"
                  value={rawGithubHandle}
                  onChange={(e) => setRawGithubHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-500" /> LeetCode Username
                </label>
                <input
                  type="text"
                  value={rawLeetcodeHandle}
                  onChange={(e) => setRawLeetcodeHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" /> CodeChef Username
                </label>
                <input
                  type="text"
                  value={rawCodechefHandle}
                  onChange={(e) => setRawCodechefHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-sky-500" /> HackerRank Username
                </label>
                <input
                  type="text"
                  value={rawHackerrankHandle}
                  onChange={(e) => setRawHackerrankHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Hackathon Wins (+0.05 bonus)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hackathonWins}
                  onChange={(e) => setHackathonWins(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Research Papers (+0.08 bonus)
                </label>
                <input
                  type="number"
                  min="0"
                  value={papersPublished}
                  onChange={(e) => setPapersPublished(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeProfile}
              disabled={analyzing}
              className="w-full py-3.5 px-6 rounded-sm btn-accent font-mono font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-transparent disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> $ calculating platform scores...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> $ calculate --dsa-scores <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="border-t border-[var(--border-hairline)] pt-8 space-y-4">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
              [LIVE COMMIT SIGNAL GRAPH]
            </span>
            <CommitGraph username={debouncedGithubHandle} />
          </div>
        </div>

        {/* Score & Badges Column */}
        <div className="space-y-6 font-mono">
          <DiffStatDisplay score={readinessScore} label="DSA & Code Readiness Score" />

          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-hairline)] pb-2">
              CI Platform Verifications
            </div>

            <PlatformBadge
              platform="GitHub"
              status={profileData?.github ? 'passed' : 'ready'}
              detail={profileData?.github ? `${profileData.github.repos} Repos • ${profileData.github.stars} Stars` : `handle: @${debouncedGithubHandle}`}
              metric={profileData?.github ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="LeetCode"
              status={profileData?.leetcode ? 'passed' : 'ready'}
              detail={profileData?.leetcode ? `${profileData.leetcode.solved} Solved (H:${profileData.leetcode.hard})` : `handle: @${debouncedLeetcodeHandle}`}
              metric={profileData?.leetcode ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="CodeChef"
              status={profileData?.codechef ? 'passed' : 'ready'}
              detail={profileData?.codechef ? `Rating: ${profileData.codechef.rating} (${profileData.codechef.stars})` : `handle: @${debouncedCodechefHandle}`}
              metric={profileData?.codechef ? '✓ CONNECTED' : '✓ READY'}
            />

            <PlatformBadge
              platform="HackerRank"
              status={profileData?.hackerrank ? 'passed' : 'ready'}
              detail={profileData?.hackerrank ? `${profileData.hackerrank.badges} Badges • ${profileData.hackerrank.stars} Stars` : `handle: @${debouncedHackerrankHandle}`}
              metric={profileData?.hackerrank ? '✓ CONNECTED' : '✓ READY'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
