"use client";

import { Children, useMemo } from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { cn } from "@/lib/cn";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  transition?: Transition;
}

const defaultTransition: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.9,
};

export function AnimatedList({
  children,
  className,
  stagger = 0.045,
  transition = defaultTransition,
}: AnimatedListProps) {
  const items = useMemo(() => Children.toArray(children), [children]);

  return (
    <ul className={cn(className)}>
      <AnimatePresence initial={false}>
        {items.map((child, i) => (
          <motion.li
            key={(child as { key?: React.Key }).key ?? i}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { ...transition, delay: i * stagger },
            }}
            exit={{ opacity: 0, scale: 0.97, x: -8 }}
            transition={transition}
          >
            {child}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
