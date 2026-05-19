"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";

const METHODS = [
  { id: "ideal", label: "iDEAL", meta: "Direct via je bank" },
  { id: "card", label: "Creditcard", meta: "Visa · Mastercard · Amex" },
  { id: "applepay", label: "Apple Pay", meta: "Eén tap" },
];

const SUMMARY = [
  ["Wanneer", "Vr 23 mei · 19:00"],
  ["Activiteit", "Pool · P3"],
  ["Gasten", "4 personen"],
  ["Pakket", "SPIN Signature · €115"],
];

export default function DepositPage() {
  const [method, setMethod] = useState("ideal");
  const deposit = 4 * 20 + 115;

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-6 pb-32 max-w-md mx-auto w-full relative">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-4">
        Stap 05 / 06 · Aanbetaling
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[2.4rem] sm:text-[2.8rem] leading-[0.96]"
      >
        Plek
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          definitief vastleggen.
        </span>
      </motion.h1>
      <p className="mt-4 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-neutral)] leading-relaxed">
        Aanbetaling wordt verrekend met je rekening. Annuleer tot 48 uur van tevoren voor volledige terugbetaling.
      </p>

      <div className="mt-7 border border-[var(--color-supporting-neutral)]/30 p-5">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-3">
          Reserveringsoverzicht
        </p>
        <dl className="space-y-2">
          {SUMMARY.map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between font-[family-name:var(--font-mono)] text-[13px]"
            >
              <dt className="text-[var(--color-supporting-neutral)]">{k}</dt>
              <dd className="text-[var(--color-main-light)]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 pt-4 border-t border-[var(--color-supporting-dark)]/40 flex items-baseline justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]">
            Aanbetaling
          </span>
          <span className="font-[family-name:var(--font-display)] text-[2rem] text-[var(--color-accent-orange)] spin-tnum">
            €{deposit}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-2.5">
          Betaalmethode
        </p>
        <div className="space-y-2">
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={[
                  "w-full flex items-center justify-between gap-3 p-4 border transition-colors relative overflow-hidden",
                  active
                    ? "border-[var(--color-accent-purple)] bg-[var(--color-supporting-dark)]/25"
                    : "border-[var(--color-supporting-neutral)]/30 hover:border-[var(--color-main-light)]/60",
                ].join(" ")}
              >
                {active && (
                  <motion.span
                    layoutId="deposit-method-bar"
                    className="absolute top-0 left-0 bottom-0 w-[3px] bg-[var(--color-accent-purple)]"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <div className="text-left">
                  <p className="font-[family-name:var(--font-display)] text-[16px]">
                    {m.label}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-neutral)] mt-0.5">
                    {m.meta}
                  </p>
                </div>
                <span
                  className={[
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    active
                      ? "border-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]"
                      : "border-[var(--color-supporting-neutral)]/50",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-main-dark)] border-t border-[var(--color-supporting-dark)]/40"
      >
        <div className="max-w-md mx-auto px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <Link
            href="/book/contact"
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)]"
          >
            ← Terug
          </Link>
          <Link
            href="/book/confirmed"
            className="px-5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Betaal €{deposit} →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
