import React, { useMemo } from 'react';

interface CommitGraphProps {
  username?: string;
  className?: string;
}

// Green heat levels — level 0 (empty) is rendered via a CSS-var-aware class,
// levels 1-4 use GitHub-green tones that read on both cream and near-black backgrounds.
const GREEN_LEVELS_HEX = [
  null,        // level 0: rendered by className, not inline style
  '#9BE9A8',   // level 1
  '#40C463',   // level 2
  '#30A14E',   // level 3
  '#216E39',   // level 4 (highest)
];

// Hash function to deterministically derive commit activity matrix from username string
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function generateCommitData(username: string = 'tourist') {
  const weeks = 28;
  const daysPerWeek = 7;
  const matrix: number[][] = [];
  let totalCommits = 0;
  let additions = 0;
  let gaps = 0;

  const baseHash = hashString(username.toLowerCase().trim() || 'developer');

  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < daysPerWeek; d++) {
      // Deterministic hashing based on username + week index + day index
      const val = hashString(`${username}-${w}-${d}-${baseHash}`) % 100;
      let level = 0;
      if (val > 78) level = 4;
      else if (val > 52) level = 3;
      else if (val > 32) level = 2;
      else if (val > 18) level = 1;

      const commits = level === 0 ? 0 : level * 2 + (val % 4);
      if (commits > 0) {
        additions += commits * 6 + (val % 7);
      } else {
        if (val % 4 === 0) gaps += 1;
      }
      totalCommits += commits;
      week.push(level);
    }
    matrix.push(week);
  }

  return { matrix, totalCommits, additions, gaps };
}

export const CommitGraph: React.FC<CommitGraphProps> = React.memo(({
  username = 'tourist',
  className = '',
}) => {
  const { matrix, totalCommits, additions, gaps } = useMemo(
    () => generateCommitData(username),
    [username]
  );

  return (
    <div className={`p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs ${className}`}>
      {/* Commit Graph Header line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-[#2DA44E] rounded-full animate-pulse shrink-0" />
          <span className="font-bold text-[var(--text-main)] tracking-tight">
            @{username}: {totalCommits} engineering signals in last 196 days
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[var(--text-muted)]">src: github.com/{username}</span>
          <span className="text-[#1A7F37] dark:text-[#2DA44E] bg-[#DAFBE1] dark:bg-[#2DA44E]/15 px-2 py-0.5 border border-[#2DA44E]/30 font-bold">
            +{Math.round(additions / 10)}% activity
          </span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-max">
          {matrix.map((week, wIdx) => (
            <div key={`week-${wIdx}`} className="flex flex-col gap-[3px]">
              {week.map((level, dIdx) => (
                <div
                  key={`cell-${username}-${wIdx}-${dIdx}`}
                  style={level > 0 ? { backgroundColor: GREEN_LEVELS_HEX[level]! } : undefined}
                  className={`w-[11px] h-[11px] rounded-[1px] transition-all cursor-pointer hover:ring-1 hover:ring-[var(--text-main)] ${
                    level === 0 ? 'bg-[var(--border-hairline)]' : ''
                  }`}
                  title={`Week ${wIdx + 1}, Day ${dIdx + 1}: ${level * 2} commits`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend & Diff stat */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-hairline)] mt-1">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[10px] h-[10px] rounded-[1px] bg-[var(--border-hairline)]" />
            {GREEN_LEVELS_HEX.slice(1).map((col, i) => (
              <div key={`legend-${i}`} style={{ backgroundColor: col! }} className="w-[10px] h-[10px] rounded-[1px]" />
            ))}
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[#2DA44E] font-semibold">+{additions} additions</span>
          <span className="text-[#CF222E] font-semibold">-{gaps} gaps</span>
        </div>
      </div>
    </div>
  );
});

CommitGraph.displayName = 'CommitGraph';
