import React from 'react';
import { Sparkles, Terminal, Rocket, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InterroXPage: React.FC = () => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 font-sans text-[var(--text-main)] min-h-[70vh] flex flex-col justify-center items-center text-center">
      <div className="w-16 h-16 rounded-sm bg-[var(--accent-color)] text-[#0A192F] flex items-center justify-center font-bold shadow-md mb-2">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-3 font-mono">
        <span className="px-3 py-1 rounded-sm bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--border-hairline)] font-bold text-xs">
          [FEATURE IN DEVELOPMENT]
        </span>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
          InterroX AI Technical Interviewer
        </h1>

        <p className="text-sm md:text-base text-[var(--text-muted)] max-w-lg mx-auto font-sans leading-relaxed">
          Interactive real-time voice and coding interview simulator designed to test system design, DSA algorithms, and ML pipelines under live pressure.
        </p>
      </div>

      <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] max-w-md w-full font-mono text-xs text-[var(--text-muted)] space-y-2">
        <p className="font-bold text-[var(--text-main)] flex items-center justify-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--accent-color)]" /> $ interrox --status
        </p>
        <pre className="text-[11px] text-[var(--accent-color)] bg-[var(--bg-paper)] p-3 rounded-sm border border-[var(--border-hairline)] text-left">
{`status: 503 SERVICE_UNAVAILABLE
release: InterroX v3.0 Early Access
target: Q4 2026 Engine Deployment`}
        </pre>
      </div>

      <Link
        to="/dashboard"
        className="px-5 py-2.5 rounded-sm btn-accent font-mono font-bold text-xs flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> $ cd /dashboard
      </Link>
    </div>
  );
};
