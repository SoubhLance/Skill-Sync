import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CommitGraph } from '../components/ui/CommitGraph';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { ForestBand } from '../components/atmosphere/ForestBand';
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
  CheckCircle2,
  Sparkles,
  GitBranch,
  Terminal,
  ChevronRight,
  Menu,
  X,
  Award,
  Layers,
  Check,
  Flame,
  Target,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroActiveTab, setHeroActiveTab] = useState<'match' | 'github' | 'dsa'>('match');
  const [demoRole, setDemoRole] = useState<'frontend' | 'backend' | 'aiml'>('backend');
  const [activeUsername, setActiveUsername] = useState<'tourist' | 'antirez' | 'gaearon'>('tourist');

  const stats = [
    { value: '10,000+', label: 'Profiles analyzed', icon: TrendingUp, desc: 'Across GitHub, LeetCode & Resumes' },
    { value: '95.4%', label: 'Match accuracy', icon: Zap, desc: 'Cosine similarity on 768-dim embeddings' },
    { value: '500+', label: 'Career roadmaps', icon: Compass, desc: 'Milestone-based progression paths' },
    { value: '< 1.2s', label: 'Signal latency', icon: Shield, desc: 'Real-time vector calculation & gap audit' },
  ];

  const steps = [
    {
      num: '01',
      tag: 'Ingest & Parse',
      title: 'Upload resume or sync handles',
      desc: 'Drop your PDF/DOCX resume or plug in your GitHub and LeetCode usernames. Our parser extracts structured skills, projects, and live metrics in seconds.',
      badge: 'Zero manual entry',
    },
    {
      num: '02',
      tag: 'Vector Intelligence',
      title: 'Generate multi-modal signals',
      desc: 'Your resume is transformed into 768-dimensional dense embeddings while commit entropy, repo complexity, and DSA problem distributions are verified live.',
      badge: 'Dual verification',
    },
    {
      num: '03',
      tag: 'Precision Roadmap',
      title: 'Bridge gaps & match roles',
      desc: 'Get an immediate ATS fit percentage against any target job description with missing keyword alerts, plus a tailored roadmap of concepts to master next.',
      badge: 'Actionable outcomes',
    },
  ];

  const roleDemoData = {
    backend: {
      title: 'Senior Distributed Systems Engineer',
      company: 'High-Scale Cloud Platform',
      matchScore: 0.89,
      skillsMatched: ['Go', 'Distributed Systems', 'Redis', 'PostgreSQL', 'Concurrency', 'gRPC'],
      missingSkills: ['Apache Kafka', 'eBPF Profiling'],
      salaryRange: '$165,000 - $210,000',
    },
    frontend: {
      title: 'Staff Frontend Architect',
      company: 'Enterprise SaaS',
      matchScore: 0.94,
      skillsMatched: ['TypeScript', 'React 19', 'Next.js', 'Web Vitals', 'Design Systems', 'State Machines'],
      missingSkills: ['WebAssembly', 'Micro-frontends'],
      salaryRange: '$170,000 - $225,000',
    },
    aiml: {
      title: 'AI/ML Systems Engineer',
      company: 'Autonomous Systems & LLMs',
      matchScore: 0.82,
      skillsMatched: ['Python', 'PyTorch', 'Vector DBs', 'RAG Architecture', 'CUDA', 'FastAPI'],
      missingSkills: ['TensorRT', 'Triton Server'],
      salaryRange: '$180,000 - $240,000',
    },
  };

  const comparison = [
    {
      metric: 'Profile Validation',
      traditional: 'Keyword stuffing on plain PDF resumes with no verified proof.',
      skillsync: 'Live GitHub commit entropy, repo complexity & LeetCode verification.',
    },
    {
      metric: 'Job Alignment',
      traditional: 'Naive keyword regex matching that misses semantic synonyms.',
      skillsync: '768-dimension semantic vector embeddings with deep context similarity.',
    },
    {
      metric: 'Career Direction',
      traditional: 'Generic generic blog posts with outdated role requirements.',
      skillsync: 'Dynamic milestone roadmaps built around your exact existing gaps.',
    },
    {
      metric: 'Interview Prep',
      traditional: 'Blind grinding through random problem sets without targeting weaknesses.',
      skillsync: 'Targeted DSA weakness radar prioritized by role requirements.',
    },
  ];

  const faqs = [
    {
      question: 'How does SkillSync calculate semantic match scores?',
      answer: 'SkillSync encodes both your structured resume content and the job description using state-of-the-art transformer models into 768-dimensional dense vectors. We then compute cosine similarity while weighting hard engineering signals, seniority signals, and domain requirements.',
    },
    {
      question: 'Do I need to grant write permissions to my GitHub account?',
      answer: 'Never. SkillSync only uses public GitHub and LeetCode API signals (public commit timestamps, repository languages, and contest history). Your code and repositories remain strictly your own.',
    },
    {
      question: 'Can I export customized, ATS-optimized resumes for specific jobs?',
      answer: 'Yes. The built-in Resume Builder and Optimizer allow you to adjust bullet points to emphasize relevant vector-matched competencies and download clean, ATS-compliant formats.',
    },
    {
      question: 'Is there a free tier available?',
      answer: 'SkillSync is completely free to get started. You can analyze your profile, run semantic JD matches, inspect your commit signals, and generate initial career roadmaps without entering credit card info.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors duration-300 overflow-x-hidden selection:bg-[var(--accent-color)]/20">
      
      {/* ── STICKY NAVIGATION BAR ── */}
      <header className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0 shadow-[var(--shadow-xs)]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none">
            <img
              src="/logofull.png"
              alt="SkillSync"
              className="h-8 md:h-9 object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              onError={(e) => {
                // Fallback if full logo image missing
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = document.getElementById('brand-fallback-logo');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div id="brand-fallback-logo" className="hidden items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shadow-sm" style={{ background: 'var(--grad-accent)' }}>
                S
              </div>
              <span className="font-bold text-base tracking-tight">Skill<span className="text-[var(--accent-color)]">Sync</span></span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--text-muted)]">
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              How It Works
            </a>
            <a href="#platform" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              Platform Features
            </a>
            <a href="#live-demo" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              Signal Demo
            </a>
            <a href="#faq" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              FAQ
            </a>
            <span className="h-4 w-px bg-[var(--border-hairline)] mx-1" />
            <Link to="/career-path" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              Career Path
            </Link>
            <Link to="/jd-match" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              JD Matcher
            </Link>
            <Link to="/dsa-code" className="px-3 py-1.5 rounded-lg hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors">
              DSA Code
            </Link>
          </nav>

          {/* Actions: Theme + Sign In + CTA */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              id="theme-toggle-landing"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-[var(--shadow-xs)]"
              title={theme === 'dark' ? 'Switch to light mode (Misty Sage)' : 'Switch to dark mode (Deep Canopy)'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-[#6EE7B7]" /> : <Sun className="w-4 h-4 text-[#4D7C0F]" />}
            </button>

            <Link
              to="/login"
              className="btn-secondary hidden sm:inline-flex px-3.5 py-1.5 text-[13px]"
            >
              Sign in
            </Link>

            <Link
              to="/login"
              id="cta-header-get-started"
              className="btn-primary px-4 py-2 text-[13px] group"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-main)]"
              >
                How It Works
              </a>
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-main)]"
              >
                Platform
              </a>
              <Link
                to="/career-path"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                Career Path
              </Link>
              <Link
                to="/jd-match"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                JD Match
              </Link>
              <Link
                to="/dsa-code"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                DSA Code
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION: 2-COLUMN BALANCED COMPOSITION ── */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-16 md:pb-24 border-b border-[var(--border-hairline)]">
        <ForestBand veil="strong" />
        <div className="absolute inset-0 hero-grid pointer-events-none opacity-60" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Content & Value Prop */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pill Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-[var(--shadow-xs)] text-[13px] text-[var(--text-muted)]">
                <span className="chip chip-accent !text-[11px] font-bold uppercase tracking-wider">SkillSync v3</span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  AI Signals for Code, Commits &amp; Resume
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="h-display animate-fade-up text-4xl sm:text-5xl md:text-6xl max-w-2xl leading-[1.08]">
                See what your GitHub, LeetCode &amp; resume{' '}
                <span className="text-gradient">actually say</span> about you.
              </h1>

              {/* Subtitle */}
              <p className="body-text animate-fade-up text-base md:text-lg max-w-xl text-[var(--text-muted)]">
                SkillSync unifies your commit history, algorithmic problem solving, and resume text
                into a single high-signal vector profile — showing your true fit for top tech roles.
              </p>

              {/* Action Buttons */}
              <div className="animate-fade-up flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  id="cta-hero-analyze"
                  className="btn-primary px-6 py-3.5 text-[15px] group shadow-[var(--shadow-md)]"
                >
                  <span>Analyze your profile</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/career-path"
                  id="cta-hero-career"
                  className="btn-secondary px-5 py-3.5 text-[15px]"
                >
                  <Compass className="w-4 h-4 text-[var(--accent-color)]" />
                  <span>Explore career paths</span>
                </Link>
              </div>

              {/* Micro Trust Indicators */}
              <div className="animate-fade-up flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-[var(--text-subtle)] pt-3">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  Public repos only (Zero write access)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  Instant ATS vector breakdown
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Live Profile Signal Showcase */}
            <div className="lg:col-span-5">
              <div className="relative card card-elevated p-5 md:p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-[var(--shadow-lg)] rounded-2xl animate-fade-up">
                
                {/* Accent top stripe */}
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl accent-strip" />

                {/* Candidate Header Mockup */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-hairline)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-bold text-sm text-[var(--accent-color)]">
                      AC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Alex Chen</span>
                        <span className="chip chip-success !text-[10px] !py-0.5 !px-2">Active Signal</span>
                      </div>
                      <p className="caption text-[11.5px] text-[var(--text-subtle)]">alexchen.dev · Fullstack Candidate</p>
                    </div>
                  </div>
                  <span className="caption px-2 py-1 rounded-md bg-[var(--bg-elevated)] text-[11px] font-mono">
                    768-D EMBED
                  </span>
                </div>

                {/* Interactive Signal Switcher Tabs */}
                <div className="segment w-full mb-4 grid grid-cols-3 text-center">
                  <button
                    onClick={() => setHeroActiveTab('match')}
                    className={`segment-btn justify-center text-[12px] py-1.5 ${heroActiveTab === 'match' ? 'segment-btn-active' : ''}`}
                  >
                    <Target className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <span>JD Match</span>
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('github')}
                    className={`segment-btn justify-center text-[12px] py-1.5 ${heroActiveTab === 'github' ? 'segment-btn-active' : ''}`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <span>GitHub</span>
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('dsa')}
                    className={`segment-btn justify-center text-[12px] py-1.5 ${heroActiveTab === 'dsa' ? 'segment-btn-active' : ''}`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <span>DSA Code</span>
                  </button>
                </div>

                {/* Tab 1: JD Match Preview */}
                {heroActiveTab === 'match' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-hairline)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-semibold text-[var(--text-main)]">Target Role Alignment</span>
                        <span className="text-xs font-bold text-[var(--success)] tabular-nums">89% Match</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--bg-paper)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '89%', background: 'var(--grad-accent)' }} />
                      </div>
                      <p className="caption text-[11px] mt-2 text-[var(--text-muted)]">
                        Target: <strong className="text-[var(--text-main)]">Staff Infrastructure Engineer</strong>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="caption font-semibold text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                        Verified Strengths (Cosine &gt; 0.85)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Distributed Systems', 'Go / Concurrency', 'Redis Cluster', 'Microservices'].map((sk) => (
                          <span key={sk} className="chip !text-[11.5px] !py-0.5 !px-2 bg-[var(--badge-bg)] text-[var(--badge-text)]">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="caption font-semibold text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                        Identified Skill Gaps
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['eBPF Observability', 'Kafka Stream Partitioning'].map((sk) => (
                          <span key={sk} className="chip !text-[11px] !py-0.5 !px-2 border-dashed border-[var(--border-strong)]">
                            + {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: GitHub Signals Preview */}
                {heroActiveTab === 'github' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                        <p className="caption text-[11px]">Commit Frequency</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5 text-[var(--text-main)]">842 commits</p>
                        <p className="caption text-[10.5px] text-[var(--success)]">Top 8% consistency</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                        <p className="caption text-[11px]">Primary Language</p>
                        <p className="text-lg font-bold tabular-nums mt-0.5 text-[var(--text-main)]">Go (64%)</p>
                        <p className="caption text-[10.5px] text-[var(--text-muted)]">Followed by TS (28%)</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-hairline)]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium">Repository Complexity Score</span>
                        <span className="font-bold text-[var(--accent-color)]">88 / 100</span>
                      </div>
                      <p className="caption text-[11px]">
                        Analyzed AST depth, test coverage presence, and architectural modularity across 14 public repos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 3: DSA & LeetCode Preview */}
                {heroActiveTab === 'dsa' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                      <div>
                        <p className="caption text-[11px]">Contest Rating</p>
                        <p className="text-xl font-bold tabular-nums text-[var(--accent-color)]">1,942</p>
                      </div>
                      <span className="chip chip-accent !text-[11px]">Knight Tier</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60">
                        <p className="text-[var(--text-subtle)] text-[10px]">Easy</p>
                        <p className="font-bold text-[var(--text-main)] mt-0.5">140</p>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60">
                        <p className="text-[var(--text-subtle)] text-[10px]">Medium</p>
                        <p className="font-bold text-[var(--text-main)] mt-0.5">285</p>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60">
                        <p className="text-[var(--text-subtle)] text-[10px]">Hard</p>
                        <p className="font-bold text-[var(--text-main)] mt-0.5">62</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)]/40 text-[11.5px] text-[var(--text-muted)] flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                      <span>Strong mastery in Graph BFS/DFS, DP, and Bit Manipulation.</span>
                    </div>
                  </div>
                )}

                {/* Card Footer CTA */}
                <div className="mt-4 pt-3.5 border-t border-[var(--border-hairline)] flex items-center justify-between">
                  <span className="caption text-[11.5px]">Want to see your score?</span>
                  <Link to="/login" className="btn-tertiary text-[12px] !font-bold flex items-center gap-1 text-[var(--accent-color)]">
                    Audit your profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── METRICS & SOCIAL PROOF STRIP ── */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map(({ value, label, icon: Icon, desc }) => (
              <div
                key={label}
                className="card p-4 md:p-5 flex items-start gap-3.5 transition-all hover:border-[var(--border-strong)]"
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--badge-bg)] text-[var(--accent-color)] border border-[var(--border-hairline)]">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <span className="block font-extrabold text-xl md:text-2xl tracking-tight leading-none tabular-nums text-[var(--text-main)]">
                    {value}
                  </span>
                  <span className="font-semibold text-[13px] block mt-1 text-[var(--text-main)] truncate">
                    {label}
                  </span>
                  <span className="caption text-[11.5px] block mt-0.5 text-[var(--text-muted)] truncate">
                    {desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: STRUCTURED 3-STEP PIPELINE ── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44"
          style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent-color) 10%, transparent), transparent)' }}
        />

        <div className="relative max-w-7xl mx-auto space-y-16">
          
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="eyebrow justify-center">The Architecture</p>
            <h2 className="h-section text-3xl md:text-4xl text-[var(--text-main)]">
              Three steps from raw profile to job leverage
            </h2>
            <p className="body-text text-base text-[var(--text-muted)]">
              How SkillSync processes code commits, resumes, and market demand vectors into clear career progression.
            </p>
          </div>

          {/* 3 Steps Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {steps.map(({ num, tag, title, desc, badge }) => (
              <div
                key={num}
                className="card card-lift p-7 md:p-8 relative flex flex-col justify-between overflow-hidden group"
              >
                {/* Background Number Accent */}
                <span className="absolute -right-3 -bottom-4 text-7xl font-extrabold font-mono opacity-[0.06] select-none pointer-events-none group-hover:opacity-[0.10] transition-opacity">
                  {num}
                </span>

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-mono font-bold text-sm text-[var(--accent-color)]">
                      {num}
                    </span>
                    <span className="chip !text-[11px] font-semibold">{badge}</span>
                  </div>

                  <p className="caption font-semibold text-[11px] uppercase tracking-wider text-[var(--accent-color)] mb-1">
                    {tag}
                  </p>
                  <h3 className="font-bold text-lg text-[var(--text-main)] tracking-tight mb-2.5">
                    {title}
                  </h3>
                  <p className="body-text text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                    {desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-hairline)] flex items-center text-[12px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--accent-color)] transition-colors">
                  <span>Learn workflow</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── PLATFORM CAPABILITIES: STRUCTURED BENTO GRID ── */}
      <section id="platform" className="py-20 md:py-24 px-6 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl space-y-2">
              <p className="eyebrow">Platform Capabilities</p>
              <h2 className="h-section text-3xl md:text-4xl text-[var(--text-main)]">
                Precision tools built for serious engineers
              </h2>
              <p className="body-text text-sm md:text-base text-[var(--text-muted)]">
                Every feature was designed to eliminate guesswork from technical interviews and job searches.
              </p>
            </div>
            <Link to="/login" className="btn-secondary px-4 py-2 text-[13px] self-start md:self-auto">
              <span>View all 7 tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento 1: Semantic JD Matcher (8 cols) */}
            <div className="md:col-span-8 card card-lift p-7 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-[var(--badge-bg)] text-[var(--accent-color)] border border-[var(--border-hairline)] flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[var(--text-main)]">
                      Semantic JD Matcher &amp; ATS Gap Analysis
                    </h3>
                    <p className="caption text-[12px] text-[var(--text-muted)]">
                      Embeddings-based relevance comparison vs raw keyword regex
                    </p>
                  </div>
                </div>

                <p className="body-text text-sm mb-6 text-[var(--text-muted)]">
                  Standard ATS filters reject qualified engineers over synonym mismatches. SkillSync compares
                  your resume against the exact requirements using high-dimensional cosine similarity, highlighting
                  the highest-impact missing skills to add.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                    <p className="caption text-[11px]">Cosine Distance</p>
                    <p className="text-base font-bold text-[var(--accent-color)]">0.892 (Optimal)</p>
                    <p className="caption text-[10px] text-[var(--text-subtle)]">Above 0.75 passes ATS</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                    <p className="caption text-[11px]">Keywords Matched</p>
                    <p className="text-base font-bold text-[var(--text-main)]">18 / 21 Core</p>
                    <p className="caption text-[10px] text-[var(--text-subtle)]">85.7% coverage</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                    <p className="caption text-[11px]">Seniority Confidence</p>
                    <p className="text-base font-bold text-[var(--text-main)]">Senior / Lead</p>
                    <p className="caption text-[10px] text-[var(--text-subtle)]">5+ YOE verified</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <span className="caption text-[12px]">Direct role alignment engine</span>
                <Link to="/jd-match" className="btn-tertiary text-[13px] font-bold text-[var(--accent-color)]">
                  Launch JD Matcher <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento 2: Code Signal Verification (4 cols) */}
            <div className="md:col-span-4 card card-lift p-7 md:p-8 flex flex-col justify-between">
              <div>
                <span className="w-10 h-10 rounded-xl bg-[var(--badge-bg)] text-[var(--accent-color)] border border-[var(--border-hairline)] flex items-center justify-center mb-4">
                  <GitBranch className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-lg md:text-xl text-[var(--text-main)] mb-2">
                  Verified Coding Signals
                </h3>
                <p className="body-text text-sm text-[var(--text-muted)] mb-5">
                  Anyone can claim skills on a resume. SkillSync validates claims by pulling real commit velocity,
                  AST repository patterns, and sustained cadence directly from GitHub.
                </p>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Commit Entropy</span>
                    <span className="text-[var(--success)]">High Activity</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Multi-Repo Consistency</span>
                    <span className="text-[var(--accent-color)]">96%</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Pull Request Hygiene</span>
                    <span className="text-[var(--text-main)]">Verified</span>
                  </div>
                </div>
              </div>

              <Link to="/dsa-code" className="btn-tertiary text-[13px] font-bold text-[var(--accent-color)]">
                Inspect Code Signals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento 3: DSA & Code Problem Coach (4 cols) */}
            <div className="md:col-span-4 card card-lift p-7 md:p-8 flex flex-col justify-between">
              <div>
                <span className="w-10 h-10 rounded-xl bg-[var(--badge-bg)] text-[var(--accent-color)] border border-[var(--border-hairline)] flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-lg md:text-xl text-[var(--text-main)] mb-2">
                  DSA &amp; LeetCode Radar
                </h3>
                <p className="body-text text-sm text-[var(--text-muted)] mb-5">
                  Pinpoint your exact technical interview blind spots with automated problem distribution radar
                  and topic-weighted difficulty recommendations.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Dynamic Programming</span>
                    <span className="font-bold text-[var(--text-main)]">78% Mastery</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent-color)]" style={{ width: '78%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[var(--text-muted)]">Trees &amp; Graphs</span>
                    <span className="font-bold text-[var(--text-main)]">92% Mastery</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent-color)]" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-hairline)]">
                <Link to="/dsa-code" className="btn-tertiary text-[13px] font-bold text-[var(--accent-color)]">
                  Explore DSA Coach <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento 4: Dynamic Career Roadmaps (8 cols) */}
            <div className="md:col-span-8 card card-lift p-7 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-[var(--badge-bg)] text-[var(--accent-color)] border border-[var(--border-hairline)] flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[var(--text-main)]">
                      Dynamic Career Path &amp; Milestone Engine
                    </h3>
                    <p className="caption text-[12px] text-[var(--text-muted)]">
                      Step-by-step roadmap from your current level to target seniority
                    </p>
                  </div>
                </div>

                <p className="body-text text-sm text-[var(--text-muted)] mb-5">
                  Instead of generic guides, SkillSync reads your verified current tech stack and calculates
                  the minimum critical path of skills, system designs, and projects required to reach
                  Senior, Staff, or Principal roles.
                </p>

                {/* Milestone Stepper Mockup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                    <span className="chip chip-success !text-[10px] mb-1.5">Completed</span>
                    <p className="text-xs font-bold text-[var(--text-main)]">Core Backend &amp; DBs</p>
                    <p className="caption text-[11px] text-[var(--text-muted)]">PostgreSQL, SQL Indexing, REST APIs</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent-color)]">
                    <span className="chip chip-accent !text-[10px] mb-1.5">Current Focus</span>
                    <p className="text-xs font-bold text-[var(--text-main)]">Distributed Consensus</p>
                    <p className="caption text-[11px] text-[var(--text-muted)]">Raft Protocol, Partitioning, sharding</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-hairline)] opacity-80">
                    <span className="chip !text-[10px] mb-1.5">Next Milestone</span>
                    <p className="text-xs font-bold text-[var(--text-main)]">Staff Architecture</p>
                    <p className="caption text-[11px] text-[var(--text-muted)]">Capacity planning, cost optimization</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <span className="caption text-[12px]">Personalized to your background</span>
                <Link to="/career-path" className="btn-tertiary text-[13px] font-bold text-[var(--accent-color)]">
                  Explore Career Paths <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── LIVE SIGNAL DEMO SECTION ── */}
      <section id="live-demo" className="py-20 md:py-24 px-6 border-b border-[var(--border-hairline)] relative">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="eyebrow justify-center">Interactive Signal Audit</p>
            <h2 className="h-section text-3xl md:text-4xl text-[var(--text-main)]">
              Test the engine right now
            </h2>
            <p className="body-text text-sm md:text-base text-[var(--text-muted)]">
              Switch target engineering roles or inspect live GitHub contributor activity.
            </p>
          </div>

          {/* Interactive Role Switcher Card */}
          <div className="card card-elevated p-6 md:p-8 bg-[var(--bg-surface)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-6 border-b border-[var(--border-hairline)]">
              <div>
                <p className="caption text-[11px] uppercase tracking-wider text-[var(--accent-color)] font-semibold">
                  Live Semantic JD Simulation
                </p>
                <h3 className="h-section text-xl md:text-2xl text-[var(--text-main)] mt-1">
                  Select a target role archetype
                </h3>
              </div>

              {/* Segmented control for roles */}
              <div className="segment flex-wrap">
                <button
                  onClick={() => setDemoRole('backend')}
                  className={`segment-btn ${demoRole === 'backend' ? 'segment-btn-active' : ''}`}
                >
                  Distributed Backend
                </button>
                <button
                  onClick={() => setDemoRole('frontend')}
                  className={`segment-btn ${demoRole === 'frontend' ? 'segment-btn-active' : ''}`}
                >
                  Frontend Architect
                </button>
                <button
                  onClick={() => setDemoRole('aiml')}
                  className={`segment-btn ${demoRole === 'aiml' ? 'segment-btn-active' : ''}`}
                >
                  AI/ML Systems
                </button>
              </div>
            </div>

            {/* Role Demo Output */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="chip !text-[11px] mb-2">{roleDemoData[demoRole].company}</span>
                  <h4 className="text-xl font-bold text-[var(--text-main)]">
                    {roleDemoData[demoRole].title}
                  </h4>
                  <p className="caption text-[12px] text-[var(--text-subtle)] mt-1">
                    Estimated Compensation Range: <strong className="text-[var(--text-main)]">{roleDemoData[demoRole].salaryRange}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="caption font-semibold text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                    Verified Matched Proficiencies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleDemoData[demoRole].skillsMatched.map((sk) => (
                      <span key={sk} className="chip bg-[var(--badge-bg)] text-[var(--badge-text)] !text-[12px]">
                        <Check className="w-3 h-3 mr-1" /> {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="caption font-semibold text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                    Recommended Additions to hit 95%+ Match
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleDemoData[demoRole].missingSkills.map((sk) => (
                      <span key={sk} className="chip !text-[12px] border-dashed border-[var(--border-strong)]">
                        + {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* DiffStat Gauge */}
              <div className="lg:col-span-5">
                <DiffStatDisplay
                  score={roleDemoData[demoRole].matchScore}
                  label="Semantic Compatibility Vector"
                />
              </div>
            </div>
          </div>

          {/* GitHub Live Contributor Graph Demo */}
          <div className="card p-6 md:p-8 bg-[var(--bg-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="h-section text-xl text-[var(--text-main)]">
                  Live Public GitHub Activity Stream
                </h3>
                <p className="caption text-[12px] text-[var(--text-muted)] mt-1">
                  Connect any public handle to audit contribution heatmaps and commit density.
                </p>
              </div>

              <div className="segment">
                <button
                  onClick={() => setActiveUsername('tourist')}
                  className={`segment-btn ${activeUsername === 'tourist' ? 'segment-btn-active' : ''}`}
                >
                  @tourist
                </button>
                <button
                  onClick={() => setActiveUsername('antirez')}
                  className={`segment-btn ${activeUsername === 'antirez' ? 'segment-btn-active' : ''}`}
                >
                  @antirez
                </button>
                <button
                  onClick={() => setActiveUsername('gaearon')}
                  className={`segment-btn ${activeUsername === 'gaearon' ? 'segment-btn-active' : ''}`}
                >
                  @gaearon
                </button>
              </div>
            </div>

            <CommitGraph username={activeUsername} />
          </div>

        </div>
      </section>

      {/* ── COMPARISON SECTION: TRADITIONAL VS SKILLSYNC ── */}
      <section className="py-20 md:py-24 px-6 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="eyebrow justify-center">Why SkillSync</p>
            <h2 className="h-section text-3xl md:text-4xl text-[var(--text-main)]">
              Traditional job hunting vs. verified signal intelligence
            </h2>
            <p className="body-text text-sm md:text-base text-[var(--text-muted)]">
              Why blind applications fail and how real engineering signals change the equation.
            </p>
          </div>

          <div className="card overflow-hidden border border-[var(--border-hairline)]">
            <div className="grid grid-cols-1 md:grid-cols-12 bg-[var(--bg-elevated)]/70 border-b border-[var(--border-hairline)] text-xs font-bold uppercase tracking-wider py-3.5 px-6 text-[var(--text-muted)]">
              <div className="md:col-span-3">Dimension</div>
              <div className="md:col-span-4 mt-2 md:mt-0 text-[var(--diff-del)]">Traditional Approach</div>
              <div className="md:col-span-5 mt-2 md:mt-0 text-[var(--success)]">SkillSync Platform</div>
            </div>

            <div className="divide-y divide-[var(--border-hairline)]">
              {comparison.map(({ metric, traditional, skillsync }) => (
                <div key={metric} className="grid grid-cols-1 md:grid-cols-12 p-6 gap-4 items-center">
                  <div className="md:col-span-3 font-semibold text-sm text-[var(--text-main)]">
                    {metric}
                  </div>
                  <div className="md:col-span-4 text-xs md:text-sm text-[var(--text-muted)] flex items-start gap-2">
                    <span className="text-[var(--diff-del)] font-bold shrink-0">✕</span>
                    <span>{traditional}</span>
                  </div>
                  <div className="md:col-span-5 text-xs md:text-sm text-[var(--text-main)] font-medium flex items-start gap-2">
                    <span className="text-[var(--success)] font-bold shrink-0">✓</span>
                    <span>{skillsync}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section id="faq" className="py-20 md:py-24 px-6 border-b border-[var(--border-hairline)]">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <p className="eyebrow justify-center">Got Questions?</p>
            <h2 className="h-section text-3xl md:text-4xl text-[var(--text-main)]">
              Frequently Asked Questions
            </h2>
            <p className="body-text text-sm md:text-base text-[var(--text-muted)]">
              Everything you need to know about SkillSync privacy, vector embeddings, and integrations.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map(({ question, answer }, index) => (
              <details
                key={question}
                className="disclosure group"
                open={index === 0}
              >
                <summary className="font-semibold text-sm md:text-base text-[var(--text-main)] flex items-center justify-between cursor-pointer py-4 px-5 select-none">
                  <span>{question}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-90 shrink-0 ml-2" />
                </summary>
                <div className="disclosure-body px-5 pb-5 pt-1 text-sm leading-relaxed text-[var(--text-muted)] border-t border-[var(--border-hairline)]">
                  {answer}
                </div>
              </details>
            ))}
          </div>

        </div>
      </section>

      {/* ── FINAL HIGH-CONVERSION CTA ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent-color) 12%, transparent), transparent)' }}
        />

        <div className="relative max-w-5xl mx-auto card card-elevated p-8 md:p-14 text-center overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-[var(--shadow-lg)]">
          <div className="absolute inset-x-0 top-0 h-1 accent-strip" />

          <span className="chip chip-accent !text-[11px] mb-4">
            Instant Developer Audit
          </span>

          <h2 className="h-section text-3xl sm:text-4xl md:text-5xl max-w-2xl mx-auto leading-tight text-[var(--text-main)]">
            Ready to decode your <span className="text-gradient">developer signal?</span>
          </h2>

          <p className="body-text text-base md:text-lg mt-4 max-w-xl mx-auto text-[var(--text-muted)]">
            Connect your public handles, upload your resume, and discover your true market alignment in less than two minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              id="cta-bottom-start-free"
              className="btn-primary px-8 py-4 text-[15px] group w-full sm:w-auto shadow-[var(--shadow-md)]"
            >
              <span>Start free profile audit</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/career-path"
              className="btn-secondary px-7 py-4 text-[15px] w-full sm:w-auto"
            >
              <Compass className="w-4 h-4 text-[var(--accent-color)]" />
              <span>Browse roadmaps</span>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-subtle)]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              Free tier included
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              Zero installation required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              Full data privacy guarantee
            </span>
          </div>
        </div>
      </section>

      {/* ── STRUCTURED MULTI-COLUMN FOOTER ── */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] pt-14 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[var(--border-hairline)]">
            
            {/* Col 1: Brand & Identity */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="SkillSync" className="w-7 h-7 object-contain" />
                <span className="font-extrabold text-base tracking-tight">
                  Skill<span className="text-[var(--accent-color)]">Sync</span>
                </span>
              </div>
              <p className="body-text text-[13px] text-[var(--text-muted)] max-w-sm">
                AI-driven career intelligence platform bridging developer code commits, LeetCode problem solving,
                and resume vectors with real market demand.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                <span className="caption text-[11.5px] font-mono text-[var(--text-subtle)]">All systems operational</span>
              </div>
            </div>

            {/* Col 2: Platform Products */}
            <div className="md:col-span-3 space-y-3">
              <p className="caption font-bold uppercase tracking-wider text-[var(--text-main)] text-[11px]">
                Platform Capabilities
              </p>
              <ul className="space-y-2 text-[13px] text-[var(--text-muted)]">
                <li><Link to="/jd-match" className="hover:text-[var(--text-main)] transition-colors">Semantic JD Matcher</Link></li>
                <li><Link to="/career-path" className="hover:text-[var(--text-main)] transition-colors">Career Path Engine</Link></li>
                <li><Link to="/dsa-code" className="hover:text-[var(--text-main)] transition-colors">DSA Code Tracker</Link></li>
                <li><Link to="/resume-builder" className="hover:text-[var(--text-main)] transition-colors">ATS Resume Builder</Link></li>
                <li><Link to="/optimizer" className="hover:text-[var(--text-main)] transition-colors">Resume Optimizer</Link></li>
                <li><Link to="/dashboard" className="hover:text-[var(--text-main)] transition-colors">Developer Dashboard</Link></li>
              </ul>
            </div>

            {/* Col 3: Exploration & Signals */}
            <div className="md:col-span-3 space-y-3">
              <p className="caption font-bold uppercase tracking-wider text-[var(--text-main)] text-[11px]">
                Signals &amp; Integrations
              </p>
              <ul className="space-y-2 text-[13px] text-[var(--text-muted)]">
                <li><a href="#live-demo" className="hover:text-[var(--text-main)] transition-colors">GitHub Commit Signal</a></li>
                <li><a href="#live-demo" className="hover:text-[var(--text-main)] transition-colors">LeetCode Contest Tracker</a></li>
                <li><a href="#how-it-works" className="hover:text-[var(--text-main)] transition-colors">768-D Vector Embeddings</a></li>
                <li><a href="#faq" className="hover:text-[var(--text-main)] transition-colors">ATS Scoring Methodology</a></li>
                <li><Link to="/interrox" className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
                  InterroX <span className="chip chip-accent !text-[9px] !py-0 !px-1.5">SOON</span>
                </Link></li>
              </ul>
            </div>

            {/* Col 4: Theme & Preferences */}
            <div className="md:col-span-2 space-y-3">
              <p className="caption font-bold uppercase tracking-wider text-[var(--text-main)] text-[11px]">
                Atmosphere Theme
              </p>
              <p className="caption text-[12px] text-[var(--text-muted)]">
                Dual forest world: Misty Sage or Deep Canopy.
              </p>
              <button
                onClick={toggleTheme}
                className="btn-secondary w-full py-2 px-3 text-[12.5px] justify-center"
              >
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#6EE7B7]" />
                    <span>Deep Canopy</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#4D7C0F]" />
                    <span>Misty Sage</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-subtle)]">
            <p>© {new Date().getFullYear()} SkillSync Inc. All rights reserved. Crafted for engineers.</p>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-[var(--text-main)] transition-colors">Privacy Notice</a>
              <a href="#faq" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1">
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
