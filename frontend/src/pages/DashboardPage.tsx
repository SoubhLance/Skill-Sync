import React, { useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useUserProfile, useDsaProfile } from '../lib/userProfile';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { skills } = useUserProfile(user?.uid);
  const { dsa } = useDsaProfile(user?.uid);

  const profileData = dsa?.data ?? null;
  const handles = dsa?.handles ?? {};
  const isEmpty = !profileData && skills.length === 0;

  const readinessScore = profileData?.profile_score ?? 0;
  const username =
    handles.github ||
    handles.leetcode ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'not-connected';

  const activePlatforms: string[] = profileData?.active_platforms ?? [];
  const linkedCount = useMemo(() => {
    let n = 0;
    if (profileData?.github) n++;
    if (profileData?.leetcode) n++;
    if (profileData?.codechef) n++;
    if (profileData?.hackerrank) n++;
    return n;
  }, [profileData]);

  const ghDetail = profileData?.github
    ? `${profileData.github.public_repos ?? profileData.github.repos ?? 0} repos · ${profileData.github.total_stars ?? profileData.github.stars ?? 0} stars`
    : 'Not connected';
  const lcSolved = profileData?.leetcode?.total_solved ?? profileData?.leetcode?.solved;
  const lcHard = profileData?.leetcode?.hard_solved ?? profileData?.leetcode?.hard;
  const lcDetail = profileData?.leetcode
    ? `${lcSolved ?? 0} solved · ${lcHard ?? 0} hard`
    : 'Not connected';
  const ccDetail = profileData?.codechef
    ? `Rating ${profileData.codechef.rating ?? '—'} · ${profileData.codechef.stars_count ?? 0} star`
    : 'Not connected';
  const hrCount =
    profileData?.hackerrank?.badges_count ??
    (Array.isArray(profileData?.hackerrank?.badges) ? profileData.hackerrank.badges.length : undefined);
  const hrDetail = profileData?.hackerrank ? `${hrCount ?? 0} badges` : 'Not connected';

  const minis = [
    {
      label: 'Skills extracted',
      value: String(skills.length),
      hint: skills.length ? 'From resume + career + JD' : 'Add skills via career path or resume',
      data: skills.length ? [0, 0, Math.max(0, skills.length - 2), Math.max(0, skills.length - 1), skills.length] : [0, 0, 0, 0, 0],
      stroke: 'var(--accent-color)',
    },
    {
      label: 'Platforms linked',
      value: `${linkedCount} of 4`,
      hint: linkedCount ? activePlatforms.join(' · ') || 'DSA connected' : 'Connect handles to begin',
      data: [0, 0, 0, linkedCount, linkedCount],
      stroke: 'var(--success)',
    },
    {
      label: 'Best role fit',
      value: '—',
      hint: 'Run JD match to compute',
      data: [0, 0, 0, 0, 0],
      stroke: 'var(--accent-2)',
    },
  ];

  const quickActions = [
    {
      to: '/dsa-code',
      icon: Code2,
      iconColor: '#0D9488',
      title: 'Connect coding handles',
      desc: 'Recalculate your DSA score from live profiles.',
    },
    {
      to: '/career-path',
      icon: Compass,
      iconColor: '#4D7C0F',
      title: 'View career path',
      desc: 'Skill-building and advancement roadmaps.',
    },
    {
      to: '/optimizer',
      icon: Sparkles,
      iconColor: '#1B7A4B',
      title: 'Optimize LinkedIn profile',
      desc: 'Keyword gaps and section-by-section scoring.',
    },
    {
      to: '/jd-match',
      icon: Target,
      iconColor: '#166534',
      title: 'Match job descriptions',
      desc: 'Resume similarity plus skill gap report.',
    },
  ];

  const githubHandle = handles.github?.trim() || '';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">Dashboard</h1>
          <p className="caption mt-1">
            {isEmpty ? 'Nothing here yet — connect your profiles to build your signal.' : 'Your engineering signal at a glance.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">@{username}</span>
          <span className={`chip tabular-nums ${readinessScore > 0 ? 'chip-success' : ''}`}>
            {(readinessScore * 100).toFixed(0)}% ready
          </span>
        </div>
      </div>

      {/* Empty-state CTA */}
      {isEmpty && (
        <div className="card card-elevated p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between border-dashed">
          <div>
            <p className="font-semibold text-[15px] tracking-tight">Get started — 2 minutes</p>
            <p className="caption mt-1 max-w-xl">
              Your dashboard is empty until you add data. Connect DSA handles, add career-path skills, or import resume skills — everything here is extracted from those, no sample numbers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link to="/dsa-code" className="btn-primary px-5 py-2.5 text-[13px]">
              <Code2 className="w-4 h-4" /> Connect coding handles
            </Link>
            <Link to="/resume-builder" className="btn-secondary px-5 py-2.5 text-[13px]">
              Import resume skills
            </Link>
          </div>
        </div>
      )}

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
            <p className="caption mt-1">
              {isEmpty ? 'No data yet' : `Skills ${skills.length} · Platforms ${linkedCount} · DSA ${Math.round(readinessScore * 100)}%`}
            </p>
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
              <p className="caption mt-0.5">
                {githubHandle && profileData?.github ? `Live from @${githubHandle}` : 'Connect GitHub on the DSA page to see your graph'}
              </p>
            </div>
            {githubHandle && profileData?.github ? (
              <CommitGraph username={githubHandle} />
            ) : (
              <div className="card p-8 text-center border-dashed space-y-3">
                <p className="caption">No activity yet.</p>
                <Link to="/dsa-code" className="btn-secondary px-5 py-2.5 text-[13px] inline-flex">
                  <Code2 className="w-4 h-4" /> Go to DSA / Code
                </Link>
              </div>
            )}
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
            <p className="caption mt-0.5">{isEmpty ? 'No platforms checked yet' : 'Platforms checked live'}</p>
          </div>
          <div className="card p-3 space-y-1">
            <div className="px-2 pt-1 pb-2 flex items-center gap-2">
              <GithubIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="caption">{isEmpty ? 'Nothing connected' : `${linkedCount} of 4 connected`}</span>
            </div>
            <PlatformBadge platform="GitHub" status={profileData?.github ? 'passed' : 'pending'} detail={ghDetail} metric={profileData?.github ? 'Connected' : 'Not connected'} />
            <PlatformBadge platform="LeetCode" status={profileData?.leetcode ? 'passed' : 'pending'} detail={lcDetail} metric={profileData?.leetcode ? 'Connected' : 'Not connected'} />
            <PlatformBadge platform="CodeChef" status={profileData?.codechef ? 'passed' : 'pending'} detail={ccDetail} metric={profileData?.codechef ? 'Connected' : 'Not connected'} />
            <PlatformBadge platform="HackerRank" status={profileData?.hackerrank ? 'passed' : 'pending'} detail={hrDetail} metric={profileData?.hackerrank ? 'Connected' : 'Not connected'} />
          </div>
        </div>
      </div>
    </div>
  );
};
