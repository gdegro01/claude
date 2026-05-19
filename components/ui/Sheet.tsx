"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";

type SheetSide = "bottom" | "right";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const bottomVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const rightVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

const sheetTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 38,
  mass: 0.9,
};

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

export function SheetTrigger({ children, asChild }: SheetTriggerProps) {
  return (
    <Dialog.Trigger asChild={asChild}>
      {children}
    </Dialog.Trigger>
  );
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "bottom", className, children, ...props }, ref) => {
    const variants = side === "bottom" ? bottomVariants : rightVariants;

    return (
      <Dialog.Portal>
        <AnimatePresence>
          <Dialog.Overlay asChild>
            <motion.div
              key="sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[var(--color-main-dark)]/70 backdrop-blur-sm"
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              key="sheet-content"
              ref={ref}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={sheetTransition}
              className={cn(
                "fixed z-50 bg-[var(--color-main-dark)] text-[var(--color-main-light)]",
                "focus:outline-none",
                side === "bottom"
                  ? "inset-x-0 bottom-0 rounded-t-lg max-h-[90dvh] overflow-y-auto"
                  : "inset-y-0 right-0 w-full max-w-md overflow-y-auto",
                className
              )}
              {...(props as React.ComponentProps<typeof motion.div>)}
            >
              {children}
              <Dialog.Close className="sr-only">Sluiten</Dialog.Close>
            </motion.div>
          </Dialog.Content>
        </AnimatePresence>
      </Dialog.Portal>
    );
  }
);

SheetContent.displayName = "SheetContent";

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 px-5 pt-5 pb-3", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Dialog.Title
      className={cn(
        "font-[family-name:var(--font-display)] text-lg tracking-[-0.01em] text-[var(--color-main-light)]",
        className
      )}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Dialog.Description
      className={cn(
        "font-[family-name:var(--font-mono)] text-xs text-[var(--color-supporting-neutral)]",
        className
      )}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-2 px-5 pt-3 pb-6", className)}
      {...props}
    />
  );
}
