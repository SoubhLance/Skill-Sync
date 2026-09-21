import React from 'react';
import { Link } from 'react-router-dom';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import {
  LayoutDashboard,
  ArrowRight,
  Code2,
  TrendingUp,
  Zap,
  Activity,
  FileCheck2,
  Compass,
  Sparkles,
  Target,
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

/*
  ================================================================================
  GRAFANA-STYLE ANALYSIS-ONLY DASHBOARD — Premium Glassmorphism Redesign
  ================================================================================
*/

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, accentColor, badge }) => (
  <div className="relative card-lift glass-card rounded-2xl p-5 overflow-hidden space-y-3">
    {/* Top colored accent strip */}
    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: accentColor }} />

    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">{label}</span>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}22` }}>
        {icon}
      </div>
    </div>

    <div className="text-2xl font-extrabold text-[var(--text-main)] font-sans">{value}</div>

    <div className="flex items-center justify-between">
      <p className="text-[11px] font-sans text-[var(--text-muted)] leading-tight">{sub}</p>
      {badge && (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[var(--bg-paper)] border border-[var(--border-hairline)] text-[var(--text-muted)] uppercase tracking-wider">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const username = 'tourist';
  const readinessScore = 0.78;

  const quickActions = [
    {
      to: '/dsa-code',
      icon: Code2,
      title: 'Connect Coding Handles',
      desc: 'Update GitHub, LeetCode, CodeChef, and HackerRank handles to recalculate DSA score.',
      iconColor: '#38BDF8',
      bgGlow: 'rgba(56, 189, 248, 0.08)',
    },
    {
      to: '/career-path',
      icon: Compass,
      title: 'View Career Path',
      desc: 'Access student skill-building or working pro advancement roadmaps.',
      iconColor: '#818CF8',
      bgGlow: 'rgba(129, 140, 248, 0.08)',
    },
    {
      to: '/optimizer',
      icon: Sparkles,
      title: 'Optimize LinkedIn Profile',
      desc: 'Upload your LinkedIn PDF export for live scoring, keyword gaps, and section analysis.',
      iconColor: '#FB923C',
      bgGlow: 'rgba(251, 146, 60, 0.08)',
    },
    {
      to: '/jd-match',
      icon: Target,
      title: 'Match Job Descriptions',
      desc: 'Upload resume + JD to get a BERT cosine similarity score and skill gap report.',
      iconColor: '#34D399',
      bgGlow: 'rgba(52, 211, 153, 0.08)',
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)] animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            $ skillsync dashboard --grafana-summary
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Engineering Signal Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[var(--text-muted)]">
            handle: <strong className="text-[var(--text-main)]">@{username}</strong>
          </span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{
                  color: 'var(--diff-add)',
                  background: 'var(--diff-add-bg)',
                  border: '1px solid color-mix(in srgb, var(--diff-add) 30%, transparent)',
                }}>
            +{(readinessScore * 100).toFixed(0)}% ready
          </span>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KpiCard
          label="Overall Readiness"
          value="+78%"
          sub="Blended semantic cosine + DSA signal"
          icon={<Activity className="w-4 h-4" style={{ color: 'var(--diff-add)' }} />}
          accentColor="var(--diff-add)"
          badge="demo data"
        />
        <KpiCard
          label="Extracted Skills"
          value="18 Skills"
          sub="From latest parsed resume"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          accentColor="#F59E0B"
        />
        <KpiCard
          label="Linked Platforms"
          value="4 / 4 Active"
          sub="GitHub, LeetCode, CodeChef, HackerRank"
          icon={<GithubIcon className="w-4 h-4 text-sky-500" />}
          accentColor="#0EA5E9"
        />
        <KpiCard
          label="Recommended Match"
          value="Senior ML Eng."
          sub="92% alignment on target career path"
          icon={<TrendingUp className="w-4 h-4" style={{ color: 'var(--diff-add)' }} />}
          accentColor="var(--accent-color)"
        />
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Commit Graph + Quick Actions */}
        <div className="lg:col-span-2 space-y-8">

          {/* Commit Graph */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider font-mono block">
              [LIVE GITHUB COMMIT SIGNAL ACTIVITY]
            </span>
            <CommitGraph username={username} className="border-0 !p-0 !bg-transparent" />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider font-mono block">
              [QUICK SETUP ACTIONS & PIPELINE SHORTCUTS]
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map(({ to, icon: Icon, title, desc, bgGlow, iconColor }) => (
                <Link
                  key={to}
                  to={to}
                  className="card-lift p-5 rounded-2xl glass-card space-y-3 group block relative overflow-hidden"
                >
                  {/* Subtle tint bg */}
                  <div className="absolute inset-0 rounded-2xl opacity-40 transition-opacity group-hover:opacity-90"
                       style={{ background: bgGlow }} />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: `${iconColor}22`, border: `1px solid ${iconColor}33` }}>
                        <Icon className="w-4 h-4" style={{ color: iconColor }} />
                      </div>
                      <span className="font-extrabold text-sm text-[var(--text-main)] font-sans group-hover:text-[var(--accent-color)] transition-colors">
                        {title}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--accent-color)] shrink-0 transition-transform group-hover:translate-x-1 mt-0.5" />
                  </div>

                  <p className="relative text-[11px] font-sans text-[var(--text-muted)] leading-relaxed">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Score + CI Checks */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <DiffStatDisplay score={readinessScore} label="Profile Readiness Score" className="border-0 !p-0 !bg-transparent" />
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-hairline)] pb-2 font-mono">
              CI Platform Verifications
            </div>

            <PlatformBadge platform="GitHub"     status="passed" detail="42 Repos • 18 Stars"     metric="✓ CONNECTED" />
            <PlatformBadge platform="LeetCode"   status="passed" detail="450 Solved (95 Hard)"     metric="✓ CONNECTED" />
            <PlatformBadge platform="CodeChef"   status="passed" detail="Rating: 1850 (4★)"        metric="✓ CONNECTED" />
            <PlatformBadge platform="HackerRank" status="passed" detail="12 Badges • 5★ Python"    metric="✓ CONNECTED" />
          </div>
        </div>
      </div>
    </div>
  );
};
