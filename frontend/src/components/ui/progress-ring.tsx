import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  value: number; // 0 to 100 or 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  color,
  trackColor,
  className = '',
}) => {
  // Normalize value to 0-100 percentage scale
  const normalizedValue = value <= 1 ? Math.round(value * 100) : Math.min(100, Math.round(value));

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className={trackColor || "stroke-neutral-200 dark:stroke-neutral-800"}
          fill="transparent"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          className={color || "stroke-[var(--accent-primary)]"}
          fill="transparent"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]"
        >
          {label !== undefined ? label : `${normalizedValue}%`}
        </motion.span>
        {sublabel && (
          <span className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
