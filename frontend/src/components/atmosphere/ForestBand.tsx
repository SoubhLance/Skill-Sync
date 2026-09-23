import React, { useEffect, useRef, useState } from 'react';
import { AmbientForest } from '../ui/AmbientForest';

/*
  ForestBand — shared forest atmosphere reusing the forest engine
  (AmbientForest, variant="mist") at readability-safe opacity.

  Used on landing hero + every protected page header (via AppLayout shell).
  Layer order: deep-green base → mist foliage + drizzle canvas →
  theme-aware veil (strongest over the text zone, thinning at the
  margins so the forest reads at the edges) → page content on top.

  Performance: the canvas pauses itself via IntersectionObserver when the
  band scrolls out of view. No backdrop-blur, no DOM particles.
*/

export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = '120px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

interface ForestBandProps {
  className?: string;
  /** 'strong' centers a heavy cream veil over headlines · 'soft' fades top-down */
  veil?: 'strong' | 'soft';
}

export const ForestBand: React.FC<ForestBandProps> = ({ className = '', veil = 'soft' }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Deep green base — same world as login, lifted half a stop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 0%, #224434 0%, #10231B 48%, #060F0B 100%)',
        }}
      />
      {/* Mist foliage + drizzle — canvas pauses itself offscreen */}
      <AmbientForest
        variant="mist"
        rainLevel="drizzle"
        interactive={false}
        compact
        paused={!inView}
      />
      {/* Readability veil — theme-aware forest mist, never touches content colors */}
      {veil === 'strong' ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 72% 66% at 50% 42%, color-mix(in srgb, var(--bg-paper) 92%, transparent) 0%, color-mix(in srgb, var(--bg-paper) 78%, transparent) 42%, color-mix(in srgb, var(--bg-paper) 42%, transparent) 68%, color-mix(in srgb, var(--bg-paper) 8%, transparent) 100%)',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--bg-paper) 82%, transparent) 0%, color-mix(in srgb, var(--bg-paper) 42%, transparent) 55%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
};

export default ForestBand;
