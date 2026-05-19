"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type FieldContext = "booking" | "ops";

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  context?: FieldContext;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      label,
      helper,
      error,
      required,
      context = "booking",
      inputProps,
      inputRef,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const inputId = inputProps?.id ?? id;

    const isDark = context === "booking";

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1.5", className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "font-[family-name:var(--font-mono)] text-xs tracking-[0.08em] uppercase",
              isDark
                ? "text-[var(--color-supporting-neutral)]"
                : "text-[var(--color-supporting-dark)]"
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-[var(--color-accent-orange)]">*</span>
            )}
          </label>
        )}

        {children ?? (
          <input
            ref={inputRef}
            id={inputId}
            aria-describedby={
              helper || error ? `${inputId}-desc` : undefined
            }
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full rounded-sm px-3 py-2.5",
              "font-[family-name:var(--font-mono)] text-sm",
              "border transition-colors duration-150",
              "placeholder:text-[var(--color-supporting-neutral)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-purple)]",
              isDark
                ? [
                    "bg-[var(--color-main-dark)] text-[var(--color-main-light)]",
                    "border-[var(--color-supporting-dark)] focus:border-[var(--color-accent-purple)]",
                  ].join(" ")
                : [
                    "bg-[var(--color-main-light)] text-[var(--color-main-dark)]",
                    "border-[var(--color-supporting-neutral)]/40 focus:border-[var(--color-accent-purple)]",
                  ].join(" "),
              error && "border-[var(--color-error-critical)]"
            )}
            {...inputProps}
          />
        )}

        {(helper || error) && (
          <p
            id={`${inputId}-desc`}
            className={cn(
              "font-[family-name:var(--font-mono)] text-xs",
              error
                ? "text-[var(--color-accent-orange)]"
                : isDark
                ? "text-[var(--color-supporting-neutral)]"
                : "text-[var(--color-supporting-dark)]"
            )}
          >
            {error ?? helper}
          </p>
        )}
      </div>
    );
  }
);

Field.displayName = "Field";
