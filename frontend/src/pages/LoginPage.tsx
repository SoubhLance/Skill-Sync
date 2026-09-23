import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AmbientForest } from '../components/ui/AmbientForest';
import { Terminal, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft, Zap, Shield, TrendingUp, GitCommitHorizontal, ScanText, Crosshair } from 'lucide-react';

const TAGLINE = 'We translate it.';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || `${mode === 'signin' ? 'Sign in' : 'Sign up'} failed.`);
    } finally {
      setLoading(false);
    }
  };

  const bullets = [
    { icon: Zap,        text: 'Real-time resume signal scoring' },
    { icon: TrendingUp, text: 'AI-powered career path roadmaps' },
    { icon: Shield,     text: 'Secure OAuth & encrypted storage' },
  ];

  const floatingSignals = [
    { icon: GitCommitHorizontal, text: '2,431 commits synced', color: '#6EE7B7', delay: '0s' },
    { icon: ScanText,            text: '768-d resume vectors', color: '#A7F3D0', delay: '1.4s' },
    { icon: Crosshair,           text: '95% role fit',          color: '#7FB069', delay: '2.6s' },
  ];

  // Render only the forest instance that's actually visible —
  // the CSS-hidden twin would otherwise burn a second rAF loop.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Gentle 3D tilt + spotlight tracking for the floating auth card
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const onCardMove = (e: React.MouseEvent) => {
    const el = cardWrapRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const onCardLeave = () => {
    const el = cardWrapRef.current;
    if (el) el.style.transform = '';
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors duration-300">

      {/* ── LEFT BRAND PANEL (desktop only) — deep forest cinema ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden p-12 bg-[#040805]">
        {/* Rainforest backdrop (shared forest engine) — mounted only when visible */}
        {isDesktop && <AmbientForest />}

        {/* Logo */}
        <div className="relative z-10 pt-7 animate-fade-up">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <img src="/logo.png" alt="SkillSync" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" />
            <span className="font-extrabold text-lg text-white font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              Skill<span className="text-[#6EE7B7]">Sync</span>
            </span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8 pb-2">
          <div className="space-y-4">
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-black/60 text-white/75 text-xs" style={{ animationDelay: '0.1s' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
              Developer signal platform
            </div>
            <h1 className="animate-fade-up text-[2.6rem] font-extrabold text-white leading-[1.05] tracking-tight font-sans drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.18s' }}>
              Your code speaks.<br />
              <span
                className="headline-pan"
                style={{
                  background: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 40%, #34D399 60%, #A7F3D0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {TAGLINE}
              </span>
            </h1>
            <p className="animate-fade-up text-white/65 text-[15px] leading-relaxed font-sans max-w-xs drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.28s' }}>
              Sign in to unlock AI-powered resume scoring, career path roadmaps, and JD match analysis.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {bullets.map(({ icon: Icon, text }, i) => (
              <li key={text} className="animate-fade-up flex items-center gap-3 text-sm text-white/80" style={{ animationDelay: `${0.36 + i * 0.08}s` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(52,211,153,0.35)', boxShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
                  <Icon className="w-3.5 h-3.5 text-[#6EE7B7]" />
                </div>
                <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Floating live-signal chips over the forest */}
        <div className="pointer-events-none absolute right-8 top-[31%] z-10 hidden 2xl:flex flex-col gap-3">
          {floatingSignals.map(({ icon: Icon, text, color, delay }) => (
            <div
              key={text}
              className="float-y flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0A120D]/90 px-3.5 py-2.5 text-[13px] font-medium text-white/85"
              style={{ animationDelay: delay, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}55` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
              {text}
            </div>
          ))}
        </div>

        <div className="relative z-10 pb-7 text-white/40 text-xs">
          © 2026 SkillSync · Learn • Upskill • Grow
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Subtle bg gradient for right panel */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--grad-hero)' }} />
        {/* Forest ambient wash echoing the canopy */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent-color) 14%, transparent), transparent)' }} />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent)' }} />

        <div className="relative w-full max-w-md space-y-6 animate-fade-up">
          {/* Mobile forest strip (desktop gets the full panel) */}
          {!isDesktop && (
            <div className="lg:hidden relative h-36 overflow-hidden rounded-2xl border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]">
              <AmbientForest compact className="!absolute" />
            </div>
          )}

          <Link to="/" className="btn-tertiary w-fit">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>

          {/* Floating card — rotating beam border + 3D tilt + spotlight */}
          <div ref={cardWrapRef} onMouseMove={onCardMove} onMouseLeave={onCardLeave} className="beam-border tilt">
          <div className="card spot-card p-7 md:p-8 space-y-6" style={{ border: 'none', borderRadius: 20 }}>

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: 'var(--grad-accent)' }}>
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="h-section text-xl">
                    {mode === 'signin' ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="caption mt-0.5">
                    {mode === 'signin' ? 'Sign in to your workspace' : 'Set up your workspace'}
                  </p>
                </div>
              </div>

              {/* Mode switcher — quiet segmented control */}
              <div className="segment w-full">
                <button
                  id="tab-signin"
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`segment-btn flex-1 justify-center ${mode === 'signin' ? 'segment-btn-active' : ''}`}
                >
                  Sign in
                </button>
                <button
                  id="tab-signup"
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`segment-btn flex-1 justify-center ${mode === 'signup' ? 'segment-btn-active' : ''}`}
                >
                  Sign up
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 rounded-xl border border-[var(--diff-del)]/40 bg-[var(--diff-del-bg)] text-[var(--diff-del)] flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Button — secondary */}
            <button
              id="btn-google-auth"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-secondary w-full py-2.5 px-4 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-hairline)]" />
              </div>
              <span className="caption relative px-3 bg-[var(--bg-surface)]">
                or continue with email
              </span>
            </div>

            {/* Form */}
            <form id="email-auth-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="field">
                <label htmlFor="input-email" className="field-label">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="input-glow pl-9 pr-3 py-2.5"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="input-password" className="field-label">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    id="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-glow pl-9 pr-3 py-2.5"
                  />
                </div>
              </div>

              <button
                id="btn-email-submit"
                type="submit"
                disabled={loading}
                className="btn-primary btn-shine w-full py-3 px-4 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'signin' ? (
                  <><LogIn className="w-4 h-4" /> Sign in</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create account</>
                )}
              </button>
            </form>

          </div>
          </div>

          {/* Bottom note */}
          <p className="caption text-center">
            By continuing you agree to SkillSync's{' '}
            <span className="text-[var(--accent-color)] cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
};


