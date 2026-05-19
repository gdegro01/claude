"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const ACTIVITIES = [
  {
    id: "pool",
    label: "Pool",
    tagline: "Biljarttafel · cocktails",
    desc: "Tafel voor 2u inclusief eerste rondje cocktails.",
    priceFrom: 65,
  },
  {
    id: "dining",
    label: "Dining",
    tagline: "Diner à la carte",
    desc: "Yakitori-keuken · 2u 30m · keuze uit chef's selection of à la carte.",
    priceFrom: 45,
  },
  {
    id: "bar",
    label: "Listening bar",
    tagline: "Bar seats · vinyl",
    desc: "Plekken aan de bar — cocktails en wisselend vinyl-programma.",
    priceFrom: 0,
  },
];

export default function GuestsPage() {
  const [guests, setGuests] = useState(2);
  const [activity, setActivity] = useState("pool");

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-6 pb-32 max-w-md mx-auto w-full relative">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-4">
        Stap 02 / 06 · Gasten &amp; activiteit
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[2.4rem] sm:text-[2.8rem] leading-[0.96]"
      >
        Met hoeveel
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          en waarvoor?
        </span>
      </motion.h1>

      <div className="mt-9">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-3">
          Aantal gasten
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const active = guests === n;
            return (
              <motion.button
                key={n}
                type="button"
                onClick={() => setGuests(n)}
                whileTap={{ scale: 0.95 }}
                className={[
                  "py-3.5 font-[family-name:var(--font-display)] text-[18px] spin-tnum border transition-colors",
                  active
                    ? "bg-[var(--color-accent-orange)] border-[var(--color-accent-orange)] text-[var(--color-main-light)]"
                    : "border-[var(--color-supporting-neutral)]/25 text-[var(--color-main-light)]/70 hover:border-[var(--color-main-light)]/60",
                ].join(" ")}
              >
                {n}
              </motion.button>
            );
          })}
        </div>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-neutral)]">
          Groter dan 6? Boek dan onze private dining (D-PRIV, max 10).
        </p>
      </div>

      <div className="mt-9">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-3">
          Activiteit
        </p>
        <ul className="space-y-2">
          {ACTIVITIES.map((a) => {
            const active = activity === a.id;
            return (
              <motion.li key={a.id} layout>
                <button
                  type="button"
                  onClick={() => setActivity(a.id)}
                  className={[
                    "w-full text-left p-4 border transition-colors relative overflow-hidden",
                    active
                      ? "border-[var(--color-accent-purple)] bg-[var(--color-supporting-dark)]/25"
                      : "border-[var(--color-supporting-neutral)]/25 hover:border-[var(--color-main-light)]/60",
                  ].join(" ")}
                >
                  {active && (
                    <motion.span
                      layoutId="guests-active-bar"
                      className="absolute top-0 left-0 bottom-0 w-[3px] bg-[var(--color-accent-purple)]"
                      transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    />
                  )}
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-[family-name:var(--font-display)] text-[18px]">
                      {a.label}
                    </span>
                    <span
                      className={[
                        "font-[family-name:var(--font-mono)] text-[11px] tracking-[0.05em] spin-tnum",
                        active
                          ? "text-[var(--color-accent-purple)]"
                          : "text-[var(--color-supporting-neutral)]",
                      ].join(" ")}
                    >
                      {a.priceFrom > 0 ? `vanaf €${a.priceFrom}` : "geen aanbetaling"}
                    </span>
                  </div>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.05em] text-[var(--color-supporting-neutral)]">
                    {a.tagline}
                  </p>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-2 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-main-light)]/80 leading-relaxed overflow-hidden"
                      >
                        {a.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-main-dark)] border-t border-[var(--color-supporting-dark)]/40"
      >
        <div className="max-w-md mx-auto px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <Link
            href="/book"
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)]"
          >
            ← Terug
          </Link>
          <Link
            href="/book/extras"
            className="px-5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Verder →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
