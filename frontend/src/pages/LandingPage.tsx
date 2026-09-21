import React from 'react';
import { Link } from 'react-router-dom';
import { CommitGraph } from '../components/ui/CommitGraph';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import {
  ArrowRight,
  FileText,
  Code2,
  GitCompare,
  Cpu,
  Compass,
  Sun,
  Moon,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: FileText,
      title: '01. OCR & Embed',
      badge: 'ASYNC',
      badgeClass: 'text-[var(--diff-add)] bg-[var(--diff-add-bg)] border-[var(--diff-add)]/30',
      desc: 'Raw PDF/DOCX parsed into structured skill arrays, project links, and handle metadata automatically.',
      color: 'text-[var(--accent-color)]',
    },
    {
      icon: Code2,
      title: '02. CI Badges',
      badge: 'VERIFIED',
      badgeClass: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
      desc: 'Live GitHub stars, LeetCode difficulty counts, and competitive ratings parsed as CI build checks.',
      color: 'text-sky-500',
    },
    {
      icon: Cpu,
      title: '03. Pairwise Cosine',
      badge: 'BERT 768d',
      badgeClass: 'text-[var(--accent-color)] bg-[var(--badge-bg)] border-[var(--border-hairline)]',
      desc: 'Semantic cosine similarity between your resume vector and job description embeddings at 768 dimensions.',
      color: 'text-[var(--accent-color)]',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Profiles Analyzed', icon: TrendingUp },
    { value: '95%', label: 'Match Accuracy', icon: Zap },
    { value: '500+', label: 'Career Paths', icon: Compass },
    { value: '99.9%', label: 'Uptime SLA', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] font-sans transition-colors duration-300 overflow-x-hidden">

      {/* ── STICKY GLASSMORPHISM HEADER ─────────────────────────── */}
      <header className="sticky top-0 z-50 glass-card border-b border-[var(--border-hairline)]">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between font-mono">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logofull.png" alt="SkillSync Logo" className="h-8 object-contain transition-transform group-hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-muted)]">
            <Link to="/career-path" className="hover:text-[var(--text-main)] transition-colors">$ career-path</Link>
            <Link to="/jd-match" className="hover:text-[var(--text-main)] transition-colors">$ jd-match</Link>
            <Link to="/dsa-code" className="hover:text-[var(--text-main)] transition-colors">$ dsa-code</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              id="theme-toggle-landing"
              className="p-2 rounded-lg border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Moon className="w-4 h-4 text-amber-400" />
                : <Sun className="w-4 h-4 text-orange-500" />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-block text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-mono"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              id="cta-header-get-started"
              className="px-4 py-2 rounded-lg btn-accent font-mono text-xs font-bold"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--grad-hero)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20">
          {/* Badge pill */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-muted)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
            <span>git checkout main &nbsp;·&nbsp; tracking developer signals</span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up text-4xl md:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.12] font-sans max-w-4xl mb-6"
            style={{ animationDelay: '0.08s' }}
          >
            See what your GitHub, LeetCode & resume{' '}
            <span className="text-gradient">actually say</span> about you.
          </h1>

          <p
            className="animate-fade-up text-base md:text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl mb-10"
            style={{ animationDelay: '0.16s' }}
          >
            SkillSync extracts engineering signals — commit activity, competitive problem metrics, resume
            vectors, and scoring formulas — to build custom career roadmaps that actually matter.
          </p>

          {/* CTA row */}
          <div
            className="animate-fade-up flex flex-wrap items-center gap-4"
            style={{ animationDelay: '0.24s' }}
          >
            <Link
              to="/login"
              id="cta-hero-analyze"
              className="px-7 py-3.5 rounded-xl btn-accent font-bold font-mono text-sm flex items-center gap-2 group"
            >
              Analyze Your Profile
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/career-path"
              id="cta-hero-career"
              className="px-7 py-3.5 rounded-xl glass-card border border-[var(--border-hairline)] text-[var(--text-main)] font-bold font-mono text-sm flex items-center gap-2 hover:border-[var(--accent-color)] transition-all"
            >
              <Compass className="w-4 h-4 text-[var(--accent-color)]" />
              Explore Career Paths
            </Link>
          </div>

          {/* Social proof strip */}
          <div
            className="animate-fade-up flex flex-wrap items-center gap-4 mt-10 pt-8 border-t border-[var(--border-hairline)]"
            style={{ animationDelay: '0.32s' }}
          >
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-mono">
                <Icon className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="font-extrabold text-[var(--text-main)]">{value}</span>
                <span className="text-[var(--text-muted)] text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMIT GRAPH BAND ──────────────────────────────────── */}
      <section className="border-y border-[var(--border-hairline)] bg-[var(--bg-surface)] py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[var(--accent-color)]" />
              LIVE COMMIT GRAPH SIGNAL
            </span>
            <span className="hidden sm:block opacity-70">0.60×cosine + 0.25×profile + 0.15×dsa</span>
          </div>
          <CommitGraph username="tourist" />
        </div>
      </section>

      {/* ── PIPELINE FEATURE CARDS ─────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          {/* Section header */}
          <div className="space-y-2 font-mono stagger-children">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
              [SYSTEM PIPELINE]
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
              Three-stage developer signal evaluation
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xl font-sans">
              Each candidate's profile is scored through a multi-stage pipeline that combines NLP, API data, and vector embeddings.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {features.map(({ icon: Icon, title, badge, badgeClass, desc, color }) => (
              <div
                key={title}
                className="card-lift p-6 rounded-2xl glass-card space-y-4 relative overflow-hidden group"
              >
                {/* Top gradient accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 accent-strip rounded-t-2xl opacity-70" />

                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                  <span className={`font-bold text-[var(--text-main)] flex items-center gap-2 font-mono text-sm`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                    {title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 border font-bold font-mono rounded-sm ${badgeClass}`}>
                    {badge}
                  </span>
                </div>

                <p className="text-sm font-sans text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* DiffStatDisplay showcase */}
          <div className="glass-card rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-2">
              <span className="text-xs font-mono font-bold text-[var(--accent-color)] uppercase tracking-wider">LIVE SCORE DEMO</span>
              <h3 className="text-xl font-extrabold text-[var(--text-main)] font-sans">BERT Cosine Match Score</h3>
              <p className="text-sm text-[var(--text-muted)] font-sans">Real-time semantic similarity between your resume and a job description. Scores above 0.75 indicate strong role alignment.</p>
            </div>
            <div className="w-full md:w-72 shrink-0">
              <DiffStatDisplay score={0.89} label="Resume ↔ JD Similarity" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--grad-hero)' }} />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
            Ready to decode your{' '}
            <span className="text-gradient">developer signal?</span>
          </h2>
          <p className="text-[var(--text-muted)] text-base md:text-lg font-sans">
            Join thousands of engineers who use SkillSync to find their ideal career path and land better roles.
          </p>
          <Link
            to="/login"
            id="cta-bottom-start-free"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl btn-accent font-bold font-mono text-sm group"
          >
            Start for Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-10 px-6 font-mono text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                <span className="font-extrabold text-sm text-[var(--text-main)]">
                  Skill<span className="text-[var(--accent-color)]">Sync</span>
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-subtle,#8B949E)]">
                Learn • Upskill • Grow
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold">
              <Link to="/login"        className="hover:text-[var(--accent-color)] transition-colors">$ login</Link>
              <Link to="/dashboard"    className="hover:text-[var(--accent-color)] transition-colors">$ dashboard</Link>
              <Link to="/career-path"  className="hover:text-[var(--accent-color)] transition-colors">$ career-path</Link>
              <Link to="/jd-match"     className="hover:text-[var(--accent-color)] transition-colors">$ jd-match</Link>
              <Link to="/dsa-code"     className="hover:text-[var(--accent-color)] transition-colors">$ dsa-code</Link>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] hover:border-[var(--accent-color)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              {theme === 'dark'
                ? <><Moon className="w-3.5 h-3.5 text-amber-400" /> Dark Ochre</>
                : <><Sun className="w-3.5 h-3.5 text-orange-500" /> Warm Cream</>}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border-hairline)] text-[11px] text-[var(--text-muted)]">
            © 2026 SkillSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
