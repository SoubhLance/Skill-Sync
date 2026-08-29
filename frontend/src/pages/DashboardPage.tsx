import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import { 
  LayoutDashboard, 
  GitBranch, 
  ArrowRight, 
  UploadCloud, 
  Code2, 
  TrendingUp, 
  Zap, 
  Activity,
  FileCheck2,
  Compass
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

/*
  ================================================================================
  GRAFANA-STYLE ANALYSIS-ONLY DASHBOARD
  ================================================================================
  - Strict separation of concerns: Zero input forms on the Dashboard.
  - Analysis & Summary KPI Tiles: Readiness score, resume signal status, platform checks.
  - Empty State Prompts: Direct action links to /dsa-code, /optimizer, and /career-path.
  ================================================================================
*/

export const DashboardPage: React.FC = () => {
  // Baseline demo state (Can be fetched from auth context / backend)
  const hasLinkedPlatforms = true;
  const username = 'tourist';
  const readinessScore = 0.78;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans text-[var(--text-main)]">
      {/* Top Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync dashboard --grafana-summary
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Engineering Signal Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[var(--text-muted)]">handle: <strong className="text-[var(--text-main)]">@{username}</strong></span>
          <span className="font-mono text-xs font-bold text-[#1A7F37] bg-[#DAFBE1] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] px-2.5 py-1 border border-[#2DA44E]/30 rounded-[2px]">
            +{(readinessScore * 100).toFixed(0)}% ready
          </span>
        </div>
      </div>

      {/* Grafana-Style 4 KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* KPI 1: Overall Readiness */}
        <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center justify-between">
            <span>Overall Readiness</span>
            <Activity className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A7F37] dark:text-[#2DA44E]">
            +78%
          </div>
          <p className="text-[11px] font-sans text-[var(--text-muted)]">
            Blended semantic cosine + DSA signal
          </p>
        </div>

        {/* KPI 2: Resume Signal */}
        <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center justify-between">
            <span>Extracted Skills</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            18 Skills
          </div>
          <p className="text-[11px] font-sans text-[var(--text-muted)]">
            Extracted from latest parsed resume
          </p>
        </div>

        {/* KPI 3: Connected Platforms */}
        <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center justify-between">
            <span>Linked Platforms</span>
            <GithubIcon className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            4 / 4 Active
          </div>
          <p className="text-[11px] font-sans text-[var(--text-muted)]">
            GitHub, LeetCode, CodeChef, HackerRank
          </p>
        </div>

        {/* KPI 4: Recommended Target */}
        <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center justify-between">
            <span>Recommended Match</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#2DA44E]" />
          </div>
          <div className="text-sm font-extrabold text-[var(--text-main)] font-sans leading-tight">
            Senior ML Engineer
          </div>
          <p className="text-[11px] font-sans text-[var(--text-muted)]">
            92% alignment on target career path
          </p>
        </div>
      </div>

      {/* Main Grafana Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity & Setup Prompt Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-8 font-mono text-xs">
          
          {/* Section 01: Live Commit Activity Motif */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
              [LIVE GITHUB COMMIT SIGNAL ACTIVITY]
            </span>
            <CommitGraph username={username} />
          </div>

          {/* Section 02: Quick Action Setup Prompts (If missing data or setup link) */}
          <div className="border-t border-[var(--border-hairline)] pt-6 space-y-4">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
              [QUICK SETUP ACTIONS & PIPELINE SHORTCUTS]
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/dsa-code"
                className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 hover:border-[var(--accent-color)] transition-colors group block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[var(--text-main)] font-sans group-hover:text-[var(--accent-color)] transition-colors">
                    Connect Coding Handles
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--accent-color)]" />
                </div>
                <p className="text-[11px] font-sans text-[var(--text-muted)]">
                  Update GitHub, LeetCode, CodeChef, and HackerRank handles to recalculate DSA score.
                </p>
              </Link>

              <Link
                to="/career-path"
                className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 hover:border-[var(--accent-color)] transition-colors group block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[var(--text-main)] font-sans group-hover:text-[var(--accent-color)] transition-colors">
                    View Recommended Career Path
                  </span>
                  <Compass className="w-4 h-4 text-[var(--accent-color)]" />
                </div>
                <p className="text-[11px] font-sans text-[var(--text-muted)]">
                  Access student skill-building or working pro advancement roadmaps.
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Score Summary & CI Status Checks (1 Col) */}
        <div className="space-y-6 font-mono">
          <DiffStatDisplay score={readinessScore} label="Profile Readiness Score" />

          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-hairline)] pb-2">
              CI Platform Verifications
            </div>

            <PlatformBadge
              platform="GitHub"
              status="passed"
              detail="42 Repos • 18 Stars"
              metric="✓ CONNECTED"
            />

            <PlatformBadge
              platform="LeetCode"
              status="passed"
              detail="450 Solved (95 Hard)"
              metric="✓ CONNECTED"
            />

            <PlatformBadge
              platform="CodeChef"
              status="passed"
              detail="Rating: 1850 (4★)"
              metric="✓ CONNECTED"
            />

            <PlatformBadge
              platform="HackerRank"
              status="passed"
              detail="12 Badges • 5★ Python"
              metric="✓ CONNECTED"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
