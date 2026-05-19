"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  type Variants,
  type UseInViewOptions,
} from "motion/react";
import { cn } from "@/lib/cn";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
  inViewMargin?: UseInViewOptions["margin"];
  once?: boolean;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.7,
  yOffset = 14,
  blur = "5px",
  inViewMargin = "-10% 0px",
  once = true,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: inViewMargin });

  const variants: Variants = {
    hidden: { opacity: 0, y: yOffset, filter: `blur(${blur})` },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        delay,
        duration,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
