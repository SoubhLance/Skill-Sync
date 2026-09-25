import React, { useEffect, useRef } from 'react';

/*
  AmbientForest — shared forest atmosphere: a lush, rainy, close-up
  rainforest canopy (think wet cedar fronds filling the frame), with driving
  rain, drifting mist, and a slow drone push-in. Pure canvas + CSS, zero assets.
  Used on login cinema, landing bands, and the global app shell.
  No HUD, no labels — just footage vibes.
*/

/* Deterministic RNG so re-renders stay stable */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface LayerOpts {
  fronds: number;
  minLen: number;
  maxLen: number;
  /** resolution scale: <1 paints fewer pixels; upscale on draw = free softness (no blur filters) */
  scale: number;
  alpha: number;
  /** greens sampled for needles: [shadow, mid, highlight] */
  palette: [string, string, string];
  /** bias fronds to start near frame edges (foreground framing) */
  edgeBias: number;
  seed: number;
}

/* One cedar-like frond: curved stem + dense drooping needles */
function drawFrond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  angle: number,
  palette: [string, string, string],
  rng: () => number,
) {
  const steps = 9;
  const pts: Array<[number, number]> = [];
  const bend = (rng() - 0.5) * 0.9;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const a = angle + bend * f * f;
    pts.push([x + Math.cos(a) * len * f, y + Math.sin(a) * len * f]);
  }
  ctx.lineCap = 'round';
  // stem
  ctx.strokeStyle = palette[0];
  ctx.lineWidth = Math.max(1.5, len / 90);
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();
  // needles
  for (let i = 1; i <= steps; i++) {
    const [px, py] = pts[i];
    const taper = Math.sin((i / steps) * Math.PI) * 0.75 + 0.25;
    const nLen = len * 0.16 * taper + len * 0.03;
    const segAngle = Math.atan2(py - pts[i - 1][1], px - pts[i - 1][0]);
    for (const side of [-1, 1]) {
      const spread = 0.9 + rng() * 0.5;
      const droop = 0.35 + rng() * 0.3;
      const na = segAngle + side * spread + droop * 0.4;
      const shade = rng();
      ctx.strokeStyle = shade < 0.45 ? palette[0] : shade < 0.8 ? palette[1] : palette[2];
      ctx.lineWidth = 1 + rng() * 1.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(na) * nLen, py + Math.sin(na) * nLen);
      ctx.stroke();
    }
  }
}

function paintLayer(w: number, h: number, o: LayerOpts): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(w * o.scale));
  c.height = Math.max(1, Math.floor(h * o.scale));
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(o.seed);
  ctx.scale(o.scale, o.scale); // paint in CSS px; upscale on draw softens for free
  ctx.globalAlpha = o.alpha;
  const diag = Math.hypot(w, h);
  for (let i = 0; i < o.fronds; i++) {
    let x = rng() * w;
    let y = rng() * h;
    if (rng() < o.edgeBias) {
      // start near a random edge so foreground fronds frame the shot
      const edge = Math.floor(rng() * 4);
      if (edge === 0) { x = rng() * w; y = -20; }
      else if (edge === 1) { x = rng() * w; y = h + 20; }
      else if (edge === 2) { x = -20; y = rng() * h; }
      else { x = w + 20; y = rng() * h; }
    }
    const len = o.minLen + rng() * (o.maxLen - o.minLen);
    // aim roughly inward so edges feel overgrown
    const inward = Math.atan2(h / 2 - y, w / 2 - x);
    const angle = inward + (rng() - 0.5) * 1.6 + (rng() < 0.3 ? Math.PI * (rng() < 0.5 ? 1 : -1) * 0.15 : 0);
    void diag;
    drawFrond(ctx, x, y, len, angle, o.palette, rng);
  }
  // light-catching bokeh droplets
  for (let i = 0; i < 26; i++) {
    const r = 2 + rng() * 11;
    const gx = rng() * w;
    const gy = rng() * h;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    const warm = rng() > 0.6;
    g.addColorStop(0, warm ? 'rgba(254,243,199,0.20)' : 'rgba(216,243,220,0.16)');
    g.addColorStop(1, 'rgba(216,243,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

interface Drop { x: number; y: number; len: number; spd: number; op: number }

export interface AmbientForestProps {
  className?: string;
  compact?: boolean;
  /** 'cinema' = deep login-grade jungle · 'mist' = brighter sage treatment for light pages */
  variant?: 'cinema' | 'mist';
  /** 'storm' = full two-layer rain · 'drizzle' = light far rain only */
  rainLevel?: 'storm' | 'drizzle';
  /** mouse parallax (disable for decorative background bands) */
  interactive?: boolean;
  /** pause the rAF loop (parent drives via IntersectionObserver) */
  paused?: boolean;
}

export const AmbientForest: React.FC<AmbientForestProps> = ({
  className = '',
  compact = false,
  variant = 'cinema',
  rainLevel = 'storm',
  interactive = true,
  paused = false,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let back: HTMLCanvasElement | null = null;
    let mid: HTMLCanvasElement | null = null;
    let front: HTMLCanvasElement | null = null;
    let mist: HTMLCanvasElement | null = null;

    let drops: Drop[] = [];
    let nearDrops: Drop[] = [];
    let cancelled = false;
    let gen = 0;

    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

    // Heavy foliage painting is chunked across frames so the page opens instantly;
    // rain starts immediately, layers fade in progressively as they land.
    const paintAsync = async (g: number): Promise<void> => {
      const r = wrap.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      // dpr 1: foliage + rain stay soft by design; halves fill cost
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // drop stale-size layers immediately so they never draw stretched
      back = mid = front = null;

      const mk = (n: number, far: boolean): Drop[] =>
        Array.from({ length: n }, () => ({
          x: Math.random() * (w + 120) - 60,
          y: Math.random() * (h + 60) - 30,
          len: far ? 10 + Math.random() * 16 : 24 + Math.random() * 22,
          spd: far ? 9 + Math.random() * 8 : 16 + Math.random() * 9,
          op: far ? 0.08 + Math.random() * 0.2 : 0.05 + Math.random() * 0.09,
        }));
      const drizzle = rainLevel === 'drizzle';
      drops = mk(compact ? 70 : drizzle ? 90 : 160, true);
      nearDrops = drizzle ? [] : mk(compact ? 14 : 30, false);

      const mistMode = variant === 'mist';
      const s = Math.max(w, h);
      await sleep(0);
      if (cancelled || g !== gen) return;
      back = paintLayer(w, h, {
        fronds: compact ? 18 : mistMode ? 22 : 32, minLen: s * 0.06, maxLen: s * 0.16, scale: 0.5, alpha: mistMode ? 0.5 : 0.72,
        palette: mistMode ? ['#3E5C4B', '#5B7A63', '#8AA78F'] : ['#0E2018', '#1A3A2B', '#2A6B4A'], edgeBias: 0.25, seed: 1234567,
      });
      await sleep(0);
      if (cancelled || g !== gen) return;
      mid = paintLayer(w, h, {
        fronds: compact ? 14 : mistMode ? 16 : 24, minLen: s * 0.12, maxLen: s * 0.3, scale: 1, alpha: mistMode ? 0.55 : 0.78,
        palette: mistMode ? ['#2E4A3A', '#4C6B57', '#7C9A83'] : ['#10251B', '#1E4A33', '#35855A'], edgeBias: 0.45, seed: 7654321,
      });
      await sleep(0);
      if (cancelled || g !== gen) return;
      front = paintLayer(w, h, {
        fronds: compact ? 8 : mistMode ? 9 : 12, minLen: s * 0.28, maxLen: s * 0.55, scale: 0.5, alpha: mistMode ? 0.5 : 0.75,
        palette: mistMode ? ['#1E3329', '#3A5A46', '#66855F'] : ['#0A1712', '#162E23', '#255A3E'], edgeBias: 0.95, seed: 987654,
      });
      // soft mist sprite (painted once, reused)
      mist = document.createElement('canvas');
      mist.width = 220;
      mist.height = 120;
      const mctx = mist.getContext('2d')!;
      const g2 = mctx.createRadialGradient(110, 60, 0, 110, 60, 110);
      g2.addColorStop(0, 'rgba(214,235,220,0.55)');
      g2.addColorStop(1, 'rgba(214,235,220,0)');
      mctx.fillStyle = g2;
      mctx.fillRect(0, 0, 220, 120);
    };

    void paintAsync(gen);

    // Debounced resize: never repaint mid-gesture
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!cancelled) void paintAsync(++gen);
      }, 220);
    });
    ro.observe(wrap);

    let t = Math.random() * 100;
    const drawFrame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const px = parseFloat(wrap.style.getPropertyValue('--px')) || 0;
      const py = parseFloat(wrap.style.getPropertyValue('--py')) || 0;

      if (back) ctx.drawImage(back, Math.sin(t * 0.1) * 5 + px * 0.25, Math.cos(t * 0.08) * 4 + py * 0.25, w, h);
      if (mid) ctx.drawImage(mid, Math.sin(t * 0.14 + 1) * 8 + px * 0.55, Math.cos(t * 0.11) * 6 + py * 0.55, w, h);

      // far rain
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      for (const d of drops) {
        d.y += d.spd;
        d.x -= d.spd * 0.16;
        if (d.y > h + 30) { d.y = -30; d.x = Math.random() * (w + 120) - 60; }
        ctx.strokeStyle = `rgba(190,212,198,${d.op.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.16, d.y - d.len);
        ctx.stroke();
      }

      // drifting mist banks
      if (mist) {
        const banks = [
          { x: ((t * 9) % (w + 480)) - 240, y: h * 0.3, ww: w * 0.9, hh: 150, a: 0.10 },
          { x: w - (((t * 6.5) % (w + 480)) - 240), y: h * 0.62, ww: w * 1.1, hh: 190, a: 0.13 },
          { x: ((t * 4 + 300) % (w + 480)) - 240, y: h * 0.85, ww: w * 0.8, hh: 130, a: 0.09 },
        ];
        for (const b of banks) {
          ctx.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(t * 0.4 + b.y));
          ctx.drawImage(mist, b.x - b.ww / 2, b.y - b.hh / 2, b.ww, b.hh);
        }
        ctx.globalAlpha = 1;
      }

      // near rain
      ctx.lineWidth = 1.5;
      for (const d of nearDrops) {
        d.y += d.spd;
        d.x -= d.spd * 0.16;
        if (d.y > h + 40) { d.y = -40; d.x = Math.random() * (w + 120) - 60; }
        ctx.strokeStyle = `rgba(205,225,210,${d.op.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.16, d.y - d.len);
        ctx.stroke();
      }

      if (front) ctx.drawImage(front, Math.sin(t * 0.12 + 2.4) * 10 + px * 0.9, Math.cos(t * 0.1 + 1) * 7 + py * 0.9, w, h);
    };

    const tick = () => {
      if (cancelled) return;
      // paused (e.g. scrolled out of view): skip drawing, keep the cheap heartbeat
      if (!pausedRef.current) drawFrame();
      raf = requestAnimationFrame(tick);
    };

    if (reduced) {
      // single still frame once foliage has landed — no motion, no loop
      let waits = 0;
      const iv = window.setInterval(() => {
        if (cancelled || front || ++waits > 40) {
          window.clearInterval(iv);
          if (!cancelled) drawFrame();
        }
      }, 120);
      const cleanupIv = () => window.clearInterval(iv);
      document.addEventListener('visibilitychange', cleanupIv, { once: true });
      return () => {
        cancelled = true;
        window.clearInterval(iv);
        window.clearTimeout(resizeTimer);
        ro.disconnect();
        document.removeEventListener('visibilitychange', cleanupIv);
      };
    }

    raf = requestAnimationFrame(tick);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!cancelled) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [compact, variant, rainLevel]);

  // Gentle mouse parallax (CSS vars drive canvas layers)
  const onMouse = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--px', `${(nx * 16).toFixed(2)}px`);
    el.style.setProperty('--py', `${(ny * 12).toFixed(2)}px`);
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={interactive ? onMouse : undefined}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden bg-[#0C1310] ${className}`}
      style={{ ['--px' as string]: '0px', ['--py' as string]: '0px' }}
    >
      <style>{`
        @keyframes forest-push { 0% { transform: scale(1.03); } 100% { transform: scale(1.16); } }
        @keyframes grain-shift { 0%{background-position:0 0} 25%{background-position:-40px 30px} 50%{background-position:30px -45px} 75%{background-position:-25px -20px} 100%{background-position:0 0} }
        .forest-zoom { animation: forest-push 36s ease-in-out infinite alternate; }
        .grain { animation: grain-shift 1.2s steps(4) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .forest-zoom,.grain { animation: none !important; }
        }
      `}</style>

      {/* Slow drone push-in over everything */}
      <div className="absolute -inset-[7%] forest-zoom">
        {/* Jungle grade — lifted slightly for the mist variant */}
        <div
          className="absolute inset-0"
          style={{
            background: variant === 'mist'
              ? 'radial-gradient(ellipse 90% 60% at 50% 0%, #24473A 0%, #12291F 45%, #071410 100%)'
              : 'radial-gradient(ellipse 90% 55% at 50% 0%, #162E23 0%, #101E17 34%, #0C1310 60%, #080F0C 100%)',
          }}
        />
        {/* Diffuse overcast canopy light (gradient only — no backdrop cost) */}
        <div
          className="absolute left-1/2 top-[-14%] h-[52%] w-[78%] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(204,242,216,0.14), transparent 70%)' }}
        />
        {/* Moss glow low-left (forest brand tie-in) */}
        <div
          className="absolute -left-[10%] bottom-[-20%] h-[50%] w-[60%] rounded-full opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(127,176,105,0.12), transparent 70%)' }}
        />

        {/* Foliage + rain + mist canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      {/* Cinematic finish: vignette, film grain, legibility grades */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 105% 92% at 50% 45%, transparent 50%, rgba(4,10,8,0.42) 100%)' }} />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[36%]" style={{ background: 'linear-gradient(180deg, rgba(4,10,8,0.38), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[44%]" style={{ background: 'linear-gradient(0deg, rgba(4,10,8,0.42), transparent)' }} />
    </div>
  );
};

export default AmbientForest;
