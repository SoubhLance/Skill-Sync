import React from 'react';
import { Link } from 'react-router-dom';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { CommitGraph } from '../components/ui/CommitGraph';
import { ProgressRing } from '../components/ui/progress-ring';
import { Sparkline } from '../components/ui/Sparkline';
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Compass,
  Sparkles,
  Target,
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';

export const DashboardPage: React.FC = () => {
  const username = 'tourist';
  const readinessScore = 0.78;

  const minis = [
    {
      label: 'Skills extracted',
      value: '18',
      hint: 'From your latest resume',
      data: [9, 11, 10, 13, 14, 16, 18],
      stroke: 'var(--accent-color)',
    },
    {
      label: 'Platforms linked',
      value: '4 of 4',
      hint: 'GitHub · LeetCode · CodeChef · HackerRank',
      data: [1, 2, 3, 3, 4, 4, 4],
      stroke: 'var(--success)',
    },
    {
      label: 'Best role fit',
      value: 'Senior ML Eng.',
      hint: '92% alignment',
      data: [62, 70, 74, 80, 85, 88, 92],
      stroke: 'var(--accent-2)',
    },
  ];

  const quickActions = [
    {
      to: '/dsa-code',
      icon: Code2,
      iconColor: '#38BDF8',
      title: 'Connect coding handles',
      desc: 'Recalculate your DSA score from live profiles.',
    },
    {
      to: '/career-path',
      icon: Compass,
      iconColor: '#B45309',
      title: 'View career path',
      desc: 'Skill-building and advancement roadmaps.',
    },
    {
      to: '/optimizer',
      icon: Sparkles,
      iconColor: '#E85A2D',
      title: 'Optimize LinkedIn profile',
      desc: 'Keyword gaps and section-by-section scoring.',
    },
    {
      to: '/jd-match',
      icon: Target,
      iconColor: '#15803D',
      title: 'Match job descriptions',
      desc: 'Resume similarity plus skill gap report.',
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">Dashboard</h1>
          <p className="caption mt-1">Your engineering signal at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">@{username}</span>
          <span className="chip chip-success tabular-nums">
            {(readinessScore * 100).toFixed(0)}% ready
          </span>
        </div>
      </div>

      {/* Readiness + key numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="card card-elevated p-6 flex items-center gap-5">
          <ProgressRing
            value={readinessScore}
            size={124}
            strokeWidth={11}
            color="stroke-[var(--accent-color)]"
            trackColor="stroke-[var(--bg-elevated)]"
          />
          <div>
            <p className="font-semibold text-[15px] tracking-tight">Profile readiness</p>
            <p className="caption mt-1">Resume 60 · Profile 25 · DSA 15</p>
            <Link to="/jd-match" className="btn-tertiary mt-2">
              Check a role <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {minis.map(({ label, value, hint, data, stroke }) => (
            <div key={label} className="card card-lift p-5 flex flex-col justify-between gap-3">
              <div>
                <p className="caption">{label}</p>
                <p className="text-[1.4rem] font-bold tracking-tight tabular-nums mt-1">{value}</p>
                <p className="caption mt-0.5 truncate">{hint}</p>
              </div>
              <Sparkline data={data} stroke={stroke} width={150} height={38} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity + shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[16px] tracking-tight">Coding activity</h2>
              <p className="caption mt-0.5">Sample signal · connect GitHub for your own graph</p>
            </div>
            <CommitGraph username={username} />
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-[16px] tracking-tight">Shortcuts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map(({ to, icon: Icon, iconColor, title, desc }) => (
                <Link key={to} to={to} className="card card-lift p-5 group block">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shrink-0">
                      <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-subtle)] transition-all group-hover:text-[var(--accent-color)] group-hover:translate-x-0.5 mt-1" />
                  </div>
                  <p className="font-semibold text-[14px] tracking-tight">{title}</p>
                  <p className="caption mt-1">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-[16px] tracking-tight">Verifications</h2>
            <p className="caption mt-0.5">Platforms checked live</p>
          </div>
          <div className="card p-3 space-y-1">
            <div className="px-2 pt-1 pb-2 flex items-center gap-2">
              <GithubIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="caption">All systems connected</span>
            </div>
            <PlatformBadge platform="GitHub" status="passed" detail="42 repos · 18 stars" metric="Connected" />
            <PlatformBadge platform="LeetCode" status="passed" detail="450 solved · 95 hard" metric="Connected" />
            <PlatformBadge platform="CodeChef" status="passed" detail="Rating 1850 · 4 star" metric="Connected" />
            <PlatformBadge platform="HackerRank" status="passed" detail="12 badges · Python 5 star" metric="Connected" />
          </div>
        </div>
      </div>
    </div>
  );
};
