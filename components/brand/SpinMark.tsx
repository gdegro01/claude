import { cn } from "@/lib/cn";

interface SpinMarkProps {
  size?: "sm" | "md" | "lg" | "xl" | "ghost";
  className?: string;
}

const sizeClasses: Record<NonNullable<SpinMarkProps["size"]>, string> = {
  sm: "text-base tracking-[-0.04em]",
  md: "text-xl tracking-[-0.04em]",
  lg: "text-3xl tracking-[-0.045em]",
  xl: "text-5xl tracking-[-0.05em]",
  ghost: "text-[18vw] sm:text-[14rem] tracking-[-0.06em] leading-none",
};

export function SpinMark({ size = "md", className }: SpinMarkProps) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-display)] font-bold uppercase",
        "leading-none inline-block",
        sizeClasses[size],
        className
      )}
      aria-label="SPIN."
    >
      SPIN.
    </span>
  );
}
