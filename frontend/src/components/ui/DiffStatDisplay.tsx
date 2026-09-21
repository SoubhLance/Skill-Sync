import React from 'react';

interface DiffStatDisplayProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  label?: string;
  className?: string;
}

export const DiffStatDisplay: React.FC<DiffStatDisplayProps> = React.memo(({
  score,
  label = 'Profile readiness',
  className = '',
}) => {
  const percentage = score <= 1 ? Math.round(score * 100) : Math.min(100, Math.round(score));

  return (
    <div className={`p-5 md:p-6 card ${className}`}>
      <p className="text-[13px] font-semibold text-[var(--text-main)]">{label}</p>

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mt-1.5">
        <span className="text-4xl font-bold tracking-tight tabular-nums text-[var(--success)]">
          {percentage}%
        </span>
        <span className="caption">overall match</span>
      </div>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage} out of 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percentage}%`, background: 'var(--grad-accent)' }}
        />
      </div>

      <p className="caption mt-3 tabular-nums">{percentage} of 100</p>
    </div>
  );
});

DiffStatDisplay.displayName = 'DiffStatDisplay';
