"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CountdownRing } from "@/components/motion/CountdownRing";

interface GuestClaimProps {
  id: string;
}

export function GuestClaim({ id }: GuestClaimProps) {
  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-2 pb-8 max-w-md mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-accent-orange)]">
          Plek beschikbaar · #{id === "demo" ? "1" : id}
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.06 }}
        className="mt-4 text-[2.4rem] leading-[0.98] text-center"
      >
        Er is een tafel
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          vrijgekomen.
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-10 flex justify-center"
      >
        <CountdownRing totalSeconds={300} warnAt={60} size={210} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-10 grid grid-cols-3 gap-3"
      >
        {[
          { l: "Tafel", v: "Dining D2" },
          { l: "Personen", v: "3" },
          { l: "Wanneer", v: "Vandaag · 20:36" },
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="mt-10 space-y-3"
      >
        <Link
          href="/book/confirmed"
          className="block w-full py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[13px] tracking-[0.2em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
        >
          Claim deze tafel
        </Link>
        <Link
          href="/"
          className="block w-full py-3 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] transition-colors"
        >
          Laat plek doorgaan naar volgende
        </Link>
      </motion.div>
    </div>
  );
}
