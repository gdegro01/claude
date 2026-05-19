import * as React from "react";
import { cn } from "@/lib/cn";

type SurfaceVariant = "dark" | "light";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  layered?: boolean;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "dark", layered = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-sm",
          variant === "dark"
            ? [
                "bg-[var(--color-main-dark)] text-[var(--color-main-light)]",
                layered
                  ? "shadow-[inset_0_1px_0_0_var(--color-supporting-dark),0_2px_12px_0_rgba(0,0,0,0.4)]"
                  : "shadow-[0_2px_12px_0_rgba(0,0,0,0.4)]",
              ].join(" ")
            : [
                "bg-[var(--color-main-light)] text-[var(--color-main-dark)]",
                layered
                  ? "shadow-[inset_0_1px_0_0_rgba(101,35,12,0.15),0_1px_6px_0_rgba(101,35,12,0.1)]"
                  : "shadow-[0_1px_6px_0_rgba(101,35,12,0.1)]",
              ].join(" "),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Surface.displayName = "Surface";
