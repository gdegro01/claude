"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { SpinMark } from "@/components/brand/SpinMark";
import { HouseRulesSheet } from "@/components/landing/HouseRulesSheet";

export default function Home() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className="relative min-h-[100dvh] spin-vignette spin-grain overflow-hidden flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <SpinMark size="lg" />
        <Link
          href="/book"
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase px-3.5 py-2 border border-[var(--color-supporting-neutral)]/40 hover:border-[var(--color-main-light)] transition-colors"
        >
          Reserveer
        </Link>
      </header>

      <section className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-8 max-w-md sm:max-w-2xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-6 sm:mb-8"
        >
          Amsterdam · Bar &amp; Dining
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[3.4rem] sm:text-[5.5rem] leading-[0.92] uppercase font-bold"
        >
          Reserveer
          <br />
          <span className="spin-em normal-case text-[var(--color-accent-purple)] lowercase">
            jouw tafel.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-7 sm:mt-9 text-sm sm:text-base leading-relaxed text-[var(--color-main-light)]/80 max-w-sm"
        >
          Yakitori &amp; cocktails in het hart van de stad. Reserveer in
          seconden, annuleer tot 48 uur van tevoren.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.26 }}
          className="mt-10 sm:mt-12 flex flex-col gap-3 max-w-sm"
        >
          <Link
            href="/book"
            className="block w-full text-center py-4 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[13px] tracking-[0.2em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Start reservering
          </Link>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="block w-full text-center py-4 border border-[var(--color-supporting-neutral)]/40 text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[13px] tracking-[0.2em] uppercase hover:border-[var(--color-main-light)] transition-colors"
          >
            Hoe het werkt
          </button>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-14 sm:mt-16 flex flex-wrap gap-x-5 gap-y-2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]"
        >
          <Link href="/ops" className="hover:text-[var(--color-main-light)]">
            Operator dashboard →
          </Link>
          <Link href="/demo" className="hover:text-[var(--color-main-light)]">
            Pitch demo →
          </Link>
        </motion.nav>
      </section>

      <SpinMark
        size="ghost"
        className="pointer-events-none select-none absolute -bottom-6 sm:-bottom-12 right-0 text-[var(--color-supporting-dark)]/35 z-0"
      />

      <HouseRulesSheet open={rulesOpen} onOpenChange={setRulesOpen} />
    </main>
  );
}
