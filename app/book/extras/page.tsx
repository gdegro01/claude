"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KOELKAST_PACKAGES, KOELKAST_ITEMS } from "@/lib/mock/koelkast";

const itemById = new Map(KOELKAST_ITEMS.map((i) => [i.id, i]));

export default function ExtrasPage() {
  const [selected, setSelected] = useState("pkg-signature");

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-6 pb-32 max-w-md mx-auto w-full relative">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-4">
        Stap 03 / 06 · Koelkast
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[2.4rem] sm:text-[2.8rem] leading-[0.96]"
      >
        Koelkast
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          klaar bij aankomst.
        </span>
      </motion.h1>
      <p className="mt-4 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-neutral)] leading-relaxed">
        Kies een pakket of bestel later aan tafel. Onze signature heeft champagne, Monkey 47 en geroosterde noten.
      </p>

      <ul className="mt-7 space-y-2.5">
        {KOELKAST_PACKAGES.map((pkg) => {
          const active = selected === pkg.id;
          return (
            <motion.li key={pkg.id} layout>
              <button
                type="button"
                onClick={() => setSelected(pkg.id)}
                className={[
                  "w-full text-left p-4 border transition-all relative overflow-hidden",
                  active
                    ? "border-[var(--color-accent-purple)] bg-[var(--color-supporting-dark)]/25"
                    : "border-[var(--color-supporting-neutral)]/25 hover:border-[var(--color-main-light)]/60",
                ].join(" ")}
              >
                {active && (
                  <motion.span
                    layoutId="extras-active-bar"
                    className="absolute top-0 left-0 bottom-0 w-[3px] bg-[var(--color-accent-purple)]"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-[family-name:var(--font-display)] text-[18px]">
                        {pkg.name}
                      </p>
                      {pkg.isSignature && (
                        <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border border-[var(--color-accent-purple)]/45 text-[var(--color-accent-purple)]">
                          Signature
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-neutral)] leading-relaxed">
                      {pkg.tagline}
                    </p>
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-[16px] spin-tnum shrink-0">
                    {pkg.priceEuros > 0 ? `€${pkg.priceEuros}` : "—"}
                  </p>
                </div>
                <AnimatePresence initial={false}>
                  {active && pkg.items.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 pt-3 border-t border-[var(--color-supporting-dark)]/40 space-y-1 overflow-hidden"
                    >
                      {pkg.items.map((id) => {
                        const item = itemById.get(id);
                        if (!item) return null;
                        return (
                          <li
                            key={id}
                            className="flex items-baseline justify-between font-[family-name:var(--font-mono)] text-[12px]"
                          >
                            <span className="text-[var(--color-main-light)]/90">
                              {item.name}
                            </span>
                            <span className="text-[var(--color-supporting-neutral)] spin-tnum">
                              €{item.priceEuros}
                            </span>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-main-dark)] border-t border-[var(--color-supporting-dark)]/40"
      >
        <div className="max-w-md mx-auto px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <Link
            href="/book/guests"
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)]"
          >
            ← Terug
          </Link>
          <Link
            href="/book/contact"
            className="px-5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Verder →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
