import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
  HeroParticles — subtle three.js hero backdrop for the landing page.
  - ~650 soft points in a flattened sphere, warm ember + mint tones
  - Very slow drift + rotation, low opacity, pointer-events-none
  - No drei (keeps bundle minimal); fiber only.
  - Respects prefers-reduced-motion (renders one static frame).
*/

const BRAND = ['#FF6A3D', '#F59E0B', '#FBBF24', '#6EE7B7'];

function Field({ count = 650, animated }: { count?: number; animated: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Flattened sphere (wide, shallow) so it sits behind text, not around it
      const r = 2.2 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.7 - 1;
      c.set(BRAND[i % BRAND.length]);
      // Vary lightness so the field feels airy, not neon
      c.offsetHSL(0, -0.05, (Math.random() - 0.5) * 0.12);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (!animated || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += delta * 0.028;
    ref.current.rotation.x = Math.sin(t * 0.08) * 0.08;
    ref.current.position.y = Math.sin(t * 0.18) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export const HeroParticles: React.FC<{ className?: string }> = ({ className = '' }) => {
  const animated = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.4, 6.4], fov: 58 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        frameloop={animated ? 'always' : 'never'}
        style={{ background: 'transparent' }}
      >
        <Field animated={animated} />
      </Canvas>
      {/* Fade the field out toward the content edges so text stays crisp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 62% at 50% 38%, transparent 45%, var(--bg-paper) 92%)',
        }}
      />
    </div>
  );
};

export default HeroParticles;
