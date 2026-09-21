import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { CommitGraph } from '../components/ui/CommitGraph';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import {
  ArrowRight,
  FileText,
  Code2,
  Cpu,
  Compass,
  Sun,
  Moon,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Lazy 3D hero — keeps three.js out of the initial bundle everywhere else.
const HeroParticles = lazy(() =>
  import('../components/hero/HeroParticles').then((m) => ({ default: m.HeroParticles }))
);

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: FileText,
      title: 'Resume parsing',
      desc: 'PDFs and DOCX files become structured skills, project links, and profile metadata.',
    },
    {
      icon: Code2,
      title: 'Verified coding signals',
      desc: 'GitHub activity, LeetCode history, and contest ratings, checked live.',
    },
    {
      icon: Cpu,
      title: 'Semantic matching',
      desc: 'Your resume and the job description are compared as 768-dimension vectors.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Profiles analyzed', icon: TrendingUp },
    { value: '95%', label: 'Match accuracy', icon: Zap },
    { value: '500+', label: 'Career paths', icon: Compass },
    { value: '99.9%', label: 'Uptime', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors duration-300 overflow-x-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logofull.png"
              alt="SkillSync"
              className="h-8 object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[var(--text-muted)]">
            <Link to="/career-path" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">Career Path</Link>
            <Link to="/jd-match" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">JD Match</Link>
            <Link to="/dsa-code" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">DSA Code</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              id="theme-toggle-landing"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-orange-500" />}
            </button>
            <Link to="/login" className="btn-tertiary hidden sm:inline-flex px-2">Sign in</Link>
            <Link to="/login" id="cta-header-get-started" className="btn-primary px-4 py-2 text-[13px]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero (three.js field, lazy) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--grad-hero)' }} />
        <Suspense fallback={null}>
          <HeroParticles className="opacity-70 dark:opacity-80" />
        </Suspense>
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-14 md:pb-20">
          <div className="animate-fade-up inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-[var(--shadow-xs)] text-[13px] text-[var(--text-muted)] mb-7">
            <span className="chip chip-accent !text-[11px]">New</span>
            <span>AI signals from your code and resume</span>
          </div>

          <h1
            className="h-display animate-fade-up text-5xl md:text-6xl lg:text-7xl max-w-4xl mb-6"
            style={{ animationDelay: '0.08s' }}
          >
            See what your GitHub, LeetCode &amp; resume{' '}
            <span className="text-gradient">actually say</span> about you.
          </h1>

          <p className="body-text animate-fade-up text-base md:text-lg max-w-2xl mb-9" style={{ animationDelay: '0.16s' }}>
            SkillSync reads your commit activity, problem-solving record, and resume —
            then builds a career roadmap around what it finds.
          </p>

          <div className="animate-fade-up flex flex-wrap items-center gap-3" style={{ animationDelay: '0.24s' }}>
            <Link to="/login" id="cta-hero-analyze" className="btn-primary px-7 py-3.5 text-[15px] group">
              Analyze your profile
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/career-path" id="cta-hero-career" className="btn-secondary px-7 py-3.5 text-[15px]">
              <Compass className="w-4 h-4 text-[var(--accent-color)]" />
              Explore career paths
            </Link>
          </div>

          <div className="animate-fade-up grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12" style={{ animationDelay: '0.32s' }}>
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="card px-4 py-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--badge-bg)]">
                  <Icon className="w-4 h-4 text-[var(--accent-color)]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[15px] tracking-tight leading-none tabular-nums">{value}</span>
                  <span className="caption block mt-1 truncate">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity ── */}
      <section className="border-y border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 px-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="max-w-xl">
            <h2 className="h-section text-xl md:text-2xl">Recent activity</h2>
            <p className="caption mt-1">A sample signal — connect GitHub to see your own.</p>
          </div>
          <CommitGraph username="tourist" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-xl space-y-2">
            <p className="eyebrow">How it works</p>
            <h2 className="h-section text-2xl md:text-3xl">Three steps from profile to roadmap</h2>
            <p className="body-text text-sm">Resume text, coding platforms, and vector search — combined into one score.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 stagger-children">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="card card-lift p-6">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shrink-0 mb-5">
                  <Icon className="w-5 h-5 text-[var(--accent-color)]" />
                </span>
                <p className="caption mb-1">Step {i + 1}</p>
                <h3 className="font-bold text-[15px] tracking-tight mb-2">{title}</h3>
                <p className="body-text text-[13.5px]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1 space-y-3">
              <p className="eyebrow">Live demo</p>
              <h3 className="h-section text-xl md:text-2xl">How closely does a resume fit a role?</h3>
              <p className="body-text text-sm max-w-md">Semantic similarity between resume and job description. Above 75% is a strong fit.</p>
            </div>
            <div className="w-full md:w-80 shrink-0">
              <DiffStatDisplay score={0.89} label="Resume and JD similarity" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — the one place the gradient takes center stage ── */}
      <section className="pb-20 md:pb-24 px-6">
        <div className="relative max-w-4xl mx-auto card card-elevated p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 accent-strip" />
          <h2 className="h-section text-3xl md:text-4xl max-w-xl mx-auto">
            Ready to decode your <span className="text-gradient">developer signal?</span>
          </h2>
          <p className="body-text mt-3 max-w-xl mx-auto">
            Join thousands of engineers finding better-fitting roles with SkillSync.
          </p>
          <div className="mt-7">
            <Link to="/login" id="cta-bottom-start-free" className="btn-primary px-8 py-4 text-[15px] group">
              Start for free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="caption mt-3">Free tier · No credit card</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SkillSync" className="w-6 h-6 object-contain" />
                <span className="font-bold text-sm">Skill<span className="text-[var(--accent-color)]">Sync</span></span>
              </div>
              <p className="caption text-[12px]">Learn · Upskill · Grow</p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-[var(--text-muted)]">
              <Link to="/login" className="hover:text-[var(--text-main)] transition-colors">Sign in</Link>
              <Link to="/dashboard" className="hover:text-[var(--text-main)] transition-colors">Dashboard</Link>
              <Link to="/career-path" className="hover:text-[var(--text-main)] transition-colors">Career Path</Link>
              <Link to="/jd-match" className="hover:text-[var(--text-main)] transition-colors">JD Match</Link>
              <Link to="/dsa-code" className="hover:text-[var(--text-main)] transition-colors">DSA Code</Link>
            </nav>

            <button
              onClick={toggleTheme}
              className="btn-secondary px-3 py-1.5 text-[12.5px]"
            >
              {theme === 'dark' ? <><Moon className="w-3.5 h-3.5 text-amber-400" /> Dark</> : <><Sun className="w-3.5 h-3.5 text-orange-500" /> Light</>}
            </button>
          </div>

          <p className="caption text-[12px] mt-8 pt-6 border-t border-[var(--border-hairline)]">
            © 2026 SkillSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
