"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  onRemove?: () => void;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ active = true, onRemove, className, children, ...props }, ref) => {
    return (
      <motion.span
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center gap-1.5",
          "font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] uppercase",
          "px-2.5 py-1 rounded-sm border",
          active
            ? "bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/40"
            : "bg-transparent text-[var(--color-supporting-neutral)] border-[var(--color-supporting-neutral)]/30",
          className
        )}
        {...(props as React.ComponentProps<typeof motion.span>)}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Verwijder filter"
            className={cn(
              "flex items-center justify-center w-3.5 h-3.5 rounded-sm",
              "transition-opacity duration-100 hover:opacity-60",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent-purple)]"
            )}
          >
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
              <path d="M1 1l4 4M5 1L1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </motion.span>
    );
  }
);

Tag.displayName = "Tag";
