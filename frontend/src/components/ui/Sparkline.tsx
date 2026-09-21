import React, { useId, useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

/* Minimal SVG sparkline — no deps, area fill + line. */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 36,
  stroke = 'var(--accent-color)',
  className = '',
}) => {
  const gid = useId();
  const { line, area } = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = width / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = i * stepX;
      const y = height - 4 - ((v - min) / span) * (height - 10);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [data, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 1 && (
        <circle
          cx={width}
          cy={height - 4 - ((data[data.length - 1] - Math.min(...data)) / ((Math.max(...data) - Math.min(...data)) || 1)) * (height - 10)}
          r="2.6"
          fill={stroke}
        />
      )}
    </svg>
  );
};

export default Sparkline;
