import React, { useEffect, useRef } from 'react';

/*
  RainOverlay — visible forest rain + drifting spores, site-wide.
  Mounted ONCE in App (not per page):
  - single fixed canvas, single rAF loop, dpr 1
  - batched strokes (one path per pass), drop count capped by viewport area
  - pauses when the tab hides; renders nothing under reduced-motion
  - adaptive: sheds load (half drops → ~30fps → off) if frames run slow,
    so low-end machines never choke on atmosphere
  - theme-aware: reads document .dark to pick sage (light) vs mist (dark) stroke
*/

interface Drop { x: number; y: number; len: number; spd: number }
interface Mote {
  x: number; y: number; r: number;
  vx: number; vy: number; phase: number; color: string;
}

const MOTES = ['251,191,36', '110,231,183'];

export const RainOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;
    let w = 0;
    let h = 0;
    let drops: Drop[] = [];
    let motes: Mote[] = [];
    let emaDt = 16.7;
    let last = 0;
    let frames = 0;

    const seed = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const n = Math.max(60, Math.min(150, Math.floor((w * h) / 14000)));
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * (w + 80) - 40,
        y: Math.random() * (h + 40) - 20,
        len: 7 + Math.random() * 9,
        spd: 7 + Math.random() * 6,
      }));
      motes = Array.from({ length: 10 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.05 - Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        color: MOTES[i % MOTES.length],
      }));
    };
    seed();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(seed, 220);
    };
    window.addEventListener('resize', onResize);

    const step = (now: number) => {
      if (cancelled) return;
      if (last) {
        const dt = now - last;
        emaDt = emaDt * 0.95 + Math.min(dt, 100) * 0.05;
      }
      last = now;
      frames += 1;

      // adaptive quality check roughly every 2s
      if (frames % 120 === 0) {
        if (emaDt > 27 && motes.length > 0) {
          motes = []; // spores first — rain is the signature
        } else if (emaDt > 27 && drops.length > 40) {
          drops = drops.filter((_, i) => i % 2 === 0); // halve the rain
        } else if (emaDt > 34) {
          cancelled = true; // bow out gracefully on very slow machines
          ctx.clearRect(0, 0, w, h);
          window.removeEventListener('resize', onResize);
          document.removeEventListener('visibilitychange', onVis);
          return;
        }
      }

      // ~30fps mode once shedding started (keeps motion smooth, halves cost)
      if (motes.length === 0 && drops.length <= 40 && frames % 2 === 0) {
        raf = requestAnimationFrame(step);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // rain — one batched path, one stroke (theme-aware, boosted visibility)
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.strokeStyle = isDark ? 'rgba(190,212,198,0.20)' : 'rgba(46,94,70,0.30)';
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.spd;
        d.x -= d.spd * 0.16;
        if (d.y > h + 24) {
          d.y = -24;
          d.x = Math.random() * (w + 80) - 40;
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.16, d.y - d.len);
      }
      ctx.stroke();

      // drifting spores — faint forest glow
      for (const m of motes) {
        m.phase += 0.02;
        m.x += m.vx + Math.sin(m.phase) * 0.1;
        m.y += m.vy;
        if (m.y < -8) { m.y = h + 8; m.x = Math.random() * w; }
        if (m.x < -8) m.x = w + 8;
        if (m.x > w + 8) m.x = -8;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(m.phase * 2));
        ctx.fillStyle = `rgba(${m.color},${(0.22 * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        last = 0;
      } else if (!cancelled) {
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  );
};

export default RainOverlay;
