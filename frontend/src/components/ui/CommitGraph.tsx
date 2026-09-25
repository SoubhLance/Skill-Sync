import React, { useMemo, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

interface CommitGraphProps {
  username?: string;
  className?: string;
}

// Forest heat levels — level 0 (empty) is rendered via a CSS-var-aware class,
// levels 1-4 use forest greens that read on both mist and canopy backgrounds.
const GREEN_LEVELS_HEX = [
  null,        // level 0: rendered by className, not inline style
  '#B7E4C7',   // level 1 — fog fern
  '#74C69D',   // level 2 — light fern
  '#2E7D4F',   // level 3 — pine
  '#14532D',   // level 4 (highest) — deep pine
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

interface RealData {
  weeks: number[][];
  total: number;
  counts: number[][];
}

export const CommitGraph: React.FC<CommitGraphProps> = React.memo(({
  username = 'tourist',
  className = '',
}) => {
  const [real, setReal] = useState<RealData | null>(null);

  useEffect(() => {
    const name = (username || '').trim();
    if (!name) { setReal(null); return; }
    let cancelled = false;
    setReal(null);
    apiClient.get('/github/contributions', { params: { username: name } })
      .then((res) => {
        if (cancelled) return;
        const weeks: number[][] = res.data?.weeks ?? [];
        const days: { count: number }[] = res.data?.days ?? [];
        const total: number = res.data?.total_last_year ?? 0;
        if (!weeks.length) return;
        // Align counts to weeks matrix shape for tooltips.
        const counts: number[][] = [];
        let di = Math.max(0, days.length - weeks.length * 7);
        for (let w = 0; w < weeks.length; w++) {
          const row: number[] = [];
          for (let d = 0; d < 7; d++) {
            row.push(days[di]?.count ?? 0);
            di++;
          }
          counts.push(row);
        }
        setReal({ weeks, total, counts });
      })
      .catch(() => { if (!cancelled) setReal(null); });
    return () => { cancelled = true; };
  }, [username]);

  const fallback = useMemo(() => generateCommitData(username), [username]);
  const matrix = real?.weeks ?? fallback.matrix;
  // Real GitHub total = last 12 months (matches github.com profile).
  // Fallback total = simulated 28-week window only.
  const totalLabel = real
    ? `${real.total.toLocaleString()} contributions · last year`
    : `${fallback.totalCommits.toLocaleString()} contributions · 28 weeks (sample)`;
  const footerRight = real
    ? 'Live from GitHub'
    : `${fallback.additions.toLocaleString()} additions · ${fallback.gaps} quiet days`;

  return (
    <div className={`p-5 md:p-6 card ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4 gap-1">
        <p className="font-semibold text-[14px] tracking-tight truncate">
          @{username}
          <span className="caption font-normal"> · {totalLabel}</span>
        </p>
        <p className="caption tabular-nums shrink-0">
          {real ? <span className="chip chip-success">Live</span> : `+${Math.round(fallback.additions / 10)}% activity · Sample`}
        </p>
      </div>

      {/* Grid Canvas */}
      <div className="overflow-x-auto pb-2 scroll-thin">
        <div className="flex gap-1 min-w-max py-1">
          {matrix.map((week, wIdx) => (
            <div key={`week-${wIdx}`} className="flex flex-col gap-1">
              {week.map((level, dIdx) => {
                const realCount = real?.counts?.[wIdx]?.[dIdx];
                return (
                  <div
                    key={`cell-${username}-${wIdx}-${dIdx}`}
                    style={level > 0 ? { backgroundColor: GREEN_LEVELS_HEX[Math.min(4, level)]! } : { backgroundColor: 'var(--heatmap-empty)' }}
                    className={`w-3 h-3 rounded-[4px] transition-transform duration-150 cursor-pointer hover:scale-125 hover:ring-1 hover:ring-[var(--accent-color)] hover:ring-offset-1 hover:ring-offset-[var(--bg-surface)] ${
                      level === 0 ? 'border border-[var(--border-hairline)]' : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                    }`}
                    title={realCount !== undefined ? `${realCount} contributions` : `Week ${wIdx + 1}, Day ${dIdx + 1}: ${level * 2} commits`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-2 caption">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-[3px] border border-[var(--border-hairline)]" style={{ backgroundColor: 'var(--heatmap-empty)' }} />
            {GREEN_LEVELS_HEX.slice(1).map((col, i) => (
              <div key={`legend-${i}`} style={{ backgroundColor: col! }} className="w-2.5 h-2.5 rounded-[3px]" />
            ))}
          </div>
          <span>More</span>
        </div>
        <p className="caption tabular-nums">
          {footerRight}
        </p>
      </div>
    </div>
  );
});

CommitGraph.displayName = 'CommitGraph';
