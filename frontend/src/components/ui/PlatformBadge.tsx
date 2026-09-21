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
  className = "",
}) => {
  const isPassed = status === 'passed' || status === 'connected' || status === 'ready';

  return (
    <div className={`p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs flex items-center justify-between transition-all hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-elevated)] ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Status Badge Box */}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
            isPassed
              ? 'bg-[var(--diff-add-bg)] text-[var(--diff-add)] border-[var(--diff-add)]/30'
              : 'bg-[var(--diff-del-bg)] text-[var(--diff-del)] border-[var(--diff-del)]/30'
          }`}
        >
          {isPassed ? '✓ PASSED' : '⌛ PENDING'}
        </span>

        <div>
          <span className="font-bold text-[var(--text-main)] block leading-none">
            {platform}
          </span>
          {detail && (
            <span className="text-[11px] text-[var(--text-muted)] block mt-1">
              {detail}
            </span>
          )}
        </div>
      </div>

      {metric && (
        <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-paper)] px-2 py-1 border border-[var(--border-hairline)] rounded-md">
          {metric}
        </span>
      )}
    </div>
  );
});

PlatformBadge.displayName = 'PlatformBadge';
