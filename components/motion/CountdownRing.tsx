"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/cn";

interface CountdownRingProps {
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  warnColor?: string;
  warnAt?: number;
  className?: string;
  onComplete?: () => void;
}

export function CountdownRing({
  totalSeconds,
  size = 200,
  strokeWidth = 2,
  trackColor = "var(--color-supporting-neutral)",
  progressColor = "var(--color-accent-purple)",
  warnColor = "var(--color-accent-orange)",
  warnAt = 60,
  className,
  onComplete,
}: CountdownRingProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const progressMv = useMotionValue(0);
  const progressSpring = useSpring(progressMv, {
    stiffness: 70,
    damping: 24,
    mass: 0.8,
  });
  const dashOffset = useTransform(progressSpring, (p) => circ * (1 - p));

  useEffect(() => {
    setRemaining(totalSeconds);
    progressMv.set(1);

    const startedAt = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      progressMv.set(left / totalSeconds);

      if (left <= 0) {
        clearInterval(tick);
        onComplete?.();
      }
    }, 100);

    return () => clearInterval(tick);
  }, [totalSeconds, progressMv, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const isWarn = remaining <= warnAt;
  const color = isWarn ? warnColor : progressColor;

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          opacity={0.18}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeLinecap="round"
          style={{
            strokeDashoffset: dashOffset,
            transition: "stroke 0.4s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-[family-name:var(--font-display)] spin-tnum tabular-nums"
          style={{
            fontSize: size * 0.28,
            lineHeight: 1,
            color: isWarn ? warnColor : "var(--color-main-light)",
            transition: "color 0.4s ease",
          }}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-supporting-neutral)] mt-2">
          resterend
        </span>
      </div>
    </div>
  );
}
