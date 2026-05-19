"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function ConfirmedPage() {
  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-4 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.7 }}
          className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent-purple)] grid place-items-center mb-7"
        >
          <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true">
            <motion.path
              d="M6 16l6 6L24 8"
              stroke="var(--color-main-light)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-[2.4rem] leading-[1] text-center"
        >
          Gereserveerd.
          <br />
          <span className="spin-em text-[var(--color-accent-purple)]">
            tot vrijdag.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-5 text-center font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-neutral)] leading-relaxed max-w-xs mx-auto"
        >
          Bevestiging per e-mail onderweg. We verwachten je vrijdag 23 mei om 19:00.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.55 }}
          className="mt-9 p-5 border border-[var(--color-supporting-dark)]/30"
        >
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] mb-2">
            Referentie
          </p>
          <p className="font-[family-name:var(--font-display)] text-[1.7rem] text-[var(--color-accent-purple)] spin-tnum">
            SP-2405-0042
          </p>
          <div className="mt-5 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-supporting-dark)]/20">
            {[
              { l: "Tafel", v: "Pool P3" },
              { l: "Personen", v: "4" },
              { l: "Tijd", v: "19:00" },
            ].map((it) => (
              <div key={it.l}>
                <p className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]">
                  {it.l}
                </p>
                <p className="font-[family-name:var(--font-display)] text-[15px] mt-1">
                  {it.v}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            className="py-3 border border-[var(--color-supporting-dark)]/40 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-main-light)]/80 hover:border-[var(--color-main-light)]/70 transition-colors"
          >
            ↓ Agenda
          </button>
          <button
            type="button"
            className="py-3 border border-[var(--color-supporting-dark)]/40 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-main-light)]/80 hover:border-[var(--color-main-light)]/70 transition-colors"
          >
            ⤴ Delen
          </button>
        </motion.div>
      </div>

      <Link
        href="/"
        className="mt-6 block w-full py-4 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] transition-colors"
      >
        Terug naar begin
      </Link>
    </div>
  );
}
