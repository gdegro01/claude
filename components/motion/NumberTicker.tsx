"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

interface NumberTickerProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  delay?: number;
}

export function NumberTicker({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  delay = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 26,
    mass: 0.9,
  });
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toFixed(decimals).replace(".", ",")}${suffix}`
  );

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionValue.set(value), delay);
    return () => clearTimeout(t);
  }, [inView, value, motionValue, delay]);

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block spin-tnum", className)}
    >
      {display}
    </motion.span>
  );
}
