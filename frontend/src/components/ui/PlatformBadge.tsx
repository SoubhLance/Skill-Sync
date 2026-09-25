import React from 'react';

interface PlatformBadgeProps {
  platform: string; // 'GitHub' | 'LeetCode' | 'CodeChef' | 'HackerRank'
  status: 'passed' | 'ready' | 'pending' | 'connected';
  detail?: string;
  metric?: string;
  className?: string;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = React.memo(({
  platform,
  status,
  detail,
  metric,
  className = '',
}) => {
  const isPassed = status === 'passed' || status === 'connected' || status === 'ready';

  return (
    <div className={`px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-between gap-3 transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isPassed ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`} />
        <div className="min-w-0">
          <p className="font-semibold text-[13.5px] tracking-tight truncate">
            {platform}
            <span className={`ml-2 text-[11px] font-semibold ${isPassed ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {isPassed ? 'Connected' : 'Pending'}
            </span>
          </p>
          {detail && <p className="caption truncate mt-0.5">{detail}</p>}
        </div>
      </div>

      {metric && (
        <span className={`shrink-0 tabular-nums px-2 py-1 rounded-lg text-[12px] font-semibold border ${
          isPassed
            ? 'bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]/60 dark:bg-[var(--success-bg)] dark:text-[var(--success)] dark:border-transparent'
            : 'caption bg-[var(--bg-elevated)] border-transparent'
        }`}>
          {metric}
        </span>
      )}
    </div>
  );
});

PlatformBadge.displayName = 'PlatformBadge';
