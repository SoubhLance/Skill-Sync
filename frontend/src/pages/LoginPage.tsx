import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft, Zap, Shield, TrendingUp } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors duration-300">

      {/* ── LEFT BRAND PANEL (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden p-12"
           style={{ background: 'linear-gradient(135deg, #0D1625 0%, #1a0a2e 50%, #0D1625 100%)' }}>
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 animate-pulse-glow"
               style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }} />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <img src="/logo.png" alt="SkillSync" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-lg text-white font-sans">
              Skill<span className="text-[#F59E0B]">Sync</span>
            </span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/8 text-white/70 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              v2.0 · Developer Signal Platform
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight font-sans">
              Your code speaks.<br />
              <span style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #818CF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                We translate it.
              </span>
            </h1>
            <p className="text-white/55 text-sm leading-relaxed font-sans max-w-xs">
              Sign in to unlock AI-powered resume scoring, career path roadmaps, and JD match analysis.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {bullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Icon className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <div className="relative z-10 text-white/30 text-[11px] font-mono">
          © 2026 SkillSync · Learn • Upskill • Grow
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        {/* Subtle bg gradient for right panel */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--grad-hero)' }} />

        <div className="relative w-full max-w-md space-y-6 animate-fade-up">

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--diff-add)]" />
            $ cd .. (back to landing)
          </Link>

          {/* Card */}
          <div className="glass-card rounded-2xl p-8 space-y-6">

            {/* Header */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'var(--grad-accent)' }}>
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-main)] font-sans leading-tight">
                    {mode === 'signin' ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    {mode === 'signin' ? 'SkillSync Developer Auth' : 'Register your developer handle'}
                  </p>
                </div>
              </div>

              {/* Mode switcher pill */}
              <div className="relative flex p-1 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                {/* Sliding indicator */}
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-in-out"
                  style={{
                    background: 'var(--grad-accent)',
                    left: mode === 'signin' ? '4px' : 'calc(50%)',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.30)',
                  }}
                />
                <button
                  id="tab-signin"
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`relative flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors z-10 ${
                    mode === 'signin' ? 'text-white' : 'text-[var(--text-muted)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="tab-signup"
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`relative flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors z-10 ${
                    mode === 'signup' ? 'text-white' : 'text-[var(--text-muted)]'
                  }`}
                >
                  Sign Up
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

            {/* Google Button */}
            <button
              id="btn-google-auth"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-main)] flex items-center justify-center gap-3 transition-all hover:border-[var(--accent-color)] hover:shadow-sm card-lift cursor-pointer"
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
              <span className="relative px-3 bg-[var(--bg-surface)] text-[10px] uppercase font-bold text-[var(--text-muted)] font-mono rounded">
                OR EMAIL AUTH
              </span>
            </div>

            {/* Form */}
            <form id="email-auth-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.developer@example.com"
                    required
                    className="input-glow w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm font-mono text-[var(--text-main)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    id="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-glow w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm font-mono text-[var(--text-main)] transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-email-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl btn-accent font-mono font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'signin' ? (
                  <><LogIn className="w-4 h-4" /> $ authenticate</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> $ register --new</>
                )}
              </button>
            </form>

          </div>

          {/* Bottom note */}
          <p className="text-center text-[11px] text-[var(--text-muted)] font-mono">
            By continuing you agree to SkillSync's{' '}
            <span className="text-[var(--accent-color)] cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
};


