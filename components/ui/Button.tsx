"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "subtle" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-accent-orange)] text-[var(--color-main-light)]",
    "hover:bg-[var(--color-supporting-dark)]",
    "border border-[var(--color-accent-orange)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-main-light)]",
    "hover:bg-[var(--color-supporting-dark)]/30",
    "border border-transparent",
  ].join(" "),
  subtle: [
    "bg-[var(--color-supporting-dark)]/20 text-[var(--color-main-light)]",
    "hover:bg-[var(--color-supporting-dark)]/40",
    "border border-transparent",
  ].join(" "),
  outline: [
    "bg-transparent text-[var(--color-main-light)]",
    "border border-[var(--color-supporting-neutral)]",
    "hover:border-[var(--color-main-light)]",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs tracking-[0.06em]",
  md: "px-5 py-2.5 text-sm tracking-[0.05em]",
  lg: "px-7 py-3.5 text-base tracking-[0.04em]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", size = "md", className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.1 }}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-sm font-[family-name:var(--font-display)]",
          "transition-colors duration-150 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent-purple)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
