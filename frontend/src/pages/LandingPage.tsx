import React from 'react';
import { Link } from 'react-router-dom';
import { CommitGraph } from '../components/ui/CommitGraph';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { PlatformBadge } from '../components/ui/PlatformBadge';
import { 
  Terminal, 
  ArrowRight, 
  FileText, 
  Code2, 
  GitCompare,
  Cpu,
  Sparkles,
  Compass,
  Layout,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] font-sans transition-colors duration-200">
      {/* Top Header with Fixed Logo Mark */}
      <header className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logofull.png" alt="SkillSync Logo" className="h-9 object-contain" />
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-sm border border-[var(--border-hairline)] text-[var(--text-main)] hover:bg-[var(--bg-paper)] transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-orange-500" />}
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              $ signin
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-sm btn-accent font-mono text-xs font-bold transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 space-y-10">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
            <span>git checkout main --track-developer-signals</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-main)] leading-[1.15] font-sans">
            See what your GitHub, LeetCode, and resume <span className="underline decoration-[var(--accent-color)] decoration-4 underline-offset-4">actually say</span> about you.
          </h1>

          <p className="text-base md:text-lg text-[var(--text-muted)] leading-relaxed font-sans max-w-2xl">
            SkillSync extracts engineering signals — commit activity, competitive problem metrics, resume vectors, and scoring formulas — to build custom career roadmaps.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-sm btn-accent font-bold hover:opacity-95 transition-opacity flex items-center gap-2"
            >
              Analyze Your Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/career-path"
              className="px-6 py-3.5 rounded-sm bg-[var(--bg-surface)] text-[var(--text-main)] font-bold border border-[var(--border-hairline)] hover:border-[var(--text-main)] transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[var(--accent-color)]" /> Explore Career Paths
            </Link>
          </div>
        </div>

        {/* Hero Visual Motif: GitHub Commit Graph */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[var(--accent-color)]" /> HERO MOTIF: LIVE COMMIT GRAPH SIGNAL
            </span>
            <span>0.60×cosine + 0.25×profile + 0.15×dsa</span>
          </div>
          
          <CommitGraph username="tourist" />
        </div>
      </section>

      {/* Technical Pipeline Section */}
      <section className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-1 font-mono">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider">
              [SYSTEM PIPELINE]
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
              Three-stage developer signal evaluation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent-color)]" /> 01. OCR & Embed
                </span>
                <span className="text-[10px] text-[#1A7F37] bg-[#DAFBE1] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] px-1.5 py-0.5 border border-[#2DA44E]/30 font-bold">
                  ASYNC
                </span>
              </div>
              <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
                Raw PDF/DOCX parsed into structured skill arrays, project links, and handle metadata automatically.
              </p>
            </div>

            <div className="p-6 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-500" /> 02. CI Badges
                </span>
                <span className="text-[10px] text-sky-500 bg-sky-500/10 px-1.5 py-0.5 border border-sky-500/30 font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
                Live GitHub repo stars, LeetCode problem difficulty counts, and competitive programming ratings parsed as CI build checks.
              </p>
            </div>

            <div className="p-6 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--accent-color)]" /> 03. Pairwise Cosine
                </span>
                <span className="text-[10px] text-[var(--accent-color)] bg-[var(--badge-bg)] px-1.5 py-0.5 border border-[var(--border-hairline)] font-bold">
                  BERT 768d
                </span>
              </div>
              <DiffStatDisplay score={0.89} label="BERT Cosine Match" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] py-8 px-6 font-mono text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-[var(--text-main)]">
              SkillSync v2.0
            </span>
          </div>

          <p>© 2026 SkillSync. Learn • Upskill • Grow.</p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/login" className="text-[var(--accent-color)] hover:underline">$ login</Link>
            <Link to="/dashboard" className="text-[var(--accent-color)] hover:underline">$ dashboard</Link>
            <Link to="/career-path" className="text-[var(--accent-color)] hover:underline">$ career-path</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
