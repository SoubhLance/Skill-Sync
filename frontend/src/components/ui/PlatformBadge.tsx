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
    <div className={`p-3 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs flex items-center justify-between transition-colors hover:border-[var(--text-main)] ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Status Badge Box */}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[2px] border ${
            isPassed
              ? 'bg-[#DAFBE1] text-[#1A7F37] border-[#2DA44E]/40 dark:bg-[#2DA44E]/15 dark:text-[#2DA44E]'
              : 'bg-[#FFEBE9] text-[#CF222E] border-[#CF222E]/40 dark:bg-[#CF222E]/15'
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
        <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-paper)] px-2 py-1 border border-[var(--border-hairline)] rounded-[2px]">
          {metric}
        </span>
      )}
    </div>
  );
});

PlatformBadge.displayName = 'PlatformBadge';
