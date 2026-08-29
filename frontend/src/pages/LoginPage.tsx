import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#14151A] font-sans flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md space-y-5 font-mono text-xs">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#57606A] hover:text-[#14151A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#2DA44E]" /> $ cd .. (back to landing)
        </Link>

        {/* Card */}
        <div className="rounded-sm bg-[#FFFFFF] border border-[#D0D7DE] p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-10 h-10 rounded-sm bg-[#14151A] text-[#FFFFFF] items-center justify-center font-bold mb-1">
              <Terminal className="w-5 h-5 text-[#2DA44E]" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#14151A] font-sans">
              {mode === 'signin' ? 'SkillSync Developer Auth' : 'Create SkillSync Account'}
            </h1>
            <p className="text-[11px] text-[#57606A] font-mono">
              {mode === 'signin'
                ? 'Authenticate to access developer signal scoring'
                : 'Register your developer handle and profile'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-0.5 rounded-sm bg-[#F7F6F3] border border-[#D0D7DE]">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 rounded-sm font-bold transition-all text-xs ${
                mode === 'signin'
                  ? 'bg-[#FFFFFF] text-[#14151A] border border-[#D0D7DE]'
                  : 'text-[#57606A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-1.5 rounded-sm font-bold transition-all text-xs ${
                mode === 'signup'
                  ? 'bg-[#FFFFFF] text-[#14151A] border border-[#D0D7DE]'
                  : 'text-[#57606A]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-sm bg-[#FFEBE9] border border-[#CF222E]/40 text-[#CF222E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-sm border border-[#D0D7DE] bg-[#FFFFFF] hover:bg-[#F7F6F3] text-xs font-mono font-bold text-[#14151A] flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D0D7DE]" />
            </div>
            <span className="relative px-3 bg-[#FFFFFF] text-[10px] uppercase font-bold text-[#57606A]">
              OR EMAIL AUTH
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block font-bold text-[#57606A] uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#57606A] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.developer@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-sm border border-[#D0D7DE] bg-[#F7F6F3] text-xs font-mono text-[#14151A] focus:outline-none focus:border-[#14151A]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#57606A] uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#57606A] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-sm border border-[#D0D7DE] bg-[#F7F6F3] text-xs font-mono text-[#14151A] focus:outline-none focus:border-[#14151A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-sm bg-[#14151A] hover:bg-[#2DA44E] text-[#FFFFFF] font-mono font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-[#14151A] cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" /> $ authenticate
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> $ register --new
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
