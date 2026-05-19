import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeStatus = "active" | "selected" | "inactive" | "warning" | "critical";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

const statusClasses: Record<BadgeStatus, string> = {
  selected: "bg-[var(--color-accent-purple)]/15 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/30",
  active: "bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/20",
  inactive: "bg-[var(--color-supporting-neutral)]/10 text-[var(--color-supporting-neutral)] border-[var(--color-supporting-neutral)]/20",
  warning: "bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)] border-[var(--color-accent-orange)]/25",
  critical: "bg-[var(--color-error-critical)] text-[var(--color-main-light)] border-[var(--color-error-critical)]",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status = "inactive", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1",
          "font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em] uppercase",
          "px-2 py-0.5 rounded-sm border",
          statusClasses[status],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
