"use client";

import { cn } from "@/lib/cn";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  durationSec?: number;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  durationSec = 40,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:2.5rem] gap-[var(--gap)]",
        className
      )}
      style={{
        ["--duration" as string]: `${durationSec}s`,
      }}
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i === 1 ? "true" : undefined}
          className={cn(
            "flex shrink-0 justify-around gap-[var(--gap)]",
            "[animation:spin-marquee_var(--duration)_linear_infinite]",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
      <style>{`
        @keyframes spin-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - var(--gap))); }
        }
      `}</style>
    </div>
  );
}
