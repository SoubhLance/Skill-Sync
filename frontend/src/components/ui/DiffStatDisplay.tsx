import React from 'react';

interface DiffStatDisplayProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  label?: string;
  className?: string;
}

export const DiffStatDisplay: React.FC<DiffStatDisplayProps> = React.memo(({
  score,
  label = "PROFILE READINESS",
  className = "",
}) => {
  const percentage = score <= 1 ? Math.round(score * 100) : Math.min(100, Math.round(score));
  const gapPercentage = 100 - percentage;
  
  // Calculate visual block representation (e.g. 10 total blocks: +++++++---)
  const totalBlocks = 15;
  const addBlocks = Math.round((percentage / 100) * totalBlocks);
  const delBlocks = totalBlocks - addBlocks;

  return (
    <div className={`p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono ${className}`}>
      {/* Title */}
      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[var(--accent-color)] font-semibold">diff stat</span>
      </div>

      {/* Main Diff Stat Score Line */}
      <div className="flex items-baseline gap-3 my-1">
        <span className="text-3xl md:text-4xl font-extrabold text-[var(--diff-add)] tracking-tight">
          +{percentage}% ready
        </span>
        <span className="text-sm text-[var(--diff-del)] font-medium">
          -{gapPercentage}% gap
        </span>
      </div>

      {/* Visual Diff Stat Block Line */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-hairline)]">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: addBlocks }).map((_, i) => (
            <span key={`add-${i}`} className="w-2.5 h-4 bg-[var(--diff-add)] rounded-[2px]" />
          ))}
          {Array.from({ length: delBlocks }).map((_, i) => (
            <span key={`del-${i}`} className="w-2.5 h-4 bg-[var(--diff-del)] rounded-[2px]" />
          ))}
        </div>
        <span className="text-xs text-[var(--text-muted)] font-semibold ml-auto">
          {percentage}/100 score
        </span>
      </div>
    </div>
  );
});

DiffStatDisplay.displayName = 'DiffStatDisplay';
