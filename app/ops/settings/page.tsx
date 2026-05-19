"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";

interface Section {
  id: string;
  title: string;
  tagline: string;
  items: { label: string; value: string }[];
}

const SECTIONS: Section[] = [
  {
    id: "openings",
    title: "Beschikbaarheid",
    tagline: "Wanneer SPIN open is en welke zones beschikbaar zijn.",
    items: [
      { label: "Avonddienst", value: "17:00 – 01:00" },
      { label: "Pool capaciteit", value: "4 tafels · 16 pers" },
      { label: "Dining capaciteit", value: "6 tafels · 40 pers" },
      { label: "Bar seats", value: "8 plekken" },
      { label: "Blokkeringsdata", value: "27 mei (private event)" },
    ],
  },
  {
    id: "deposit",
    title: "Aanbetaling",
    tagline: "Hoe wij no-shows voorkomen zonder onnodig friction.",
    items: [
      { label: "Pool", value: "€20 per persoon" },
      { label: "Dining", value: "€25 per persoon" },
      { label: "Bar seats", value: "Geen aanbetaling" },
      { label: "Annuleringsbeleid", value: "Gratis tot 48u" },
      { label: "Betaalprovider", value: "Mollie (iDEAL · CC · Apple Pay)" },
    ],
  },
  {
    id: "waitlist",
    title: "Wachtlijst",
    tagline: "Hoe vrijgekomen plekken automatisch worden uitgespeeld.",
    items: [
      { label: "Claimtijd", value: "5 minuten" },
      { label: "Notificatie", value: "SMS + push" },
      { label: "Prioriteitsregel", value: "Dinner > Pool > Bar" },
      { label: "Max wachtende", value: "12 per zone" },
    ],
  },
  {
    id: "communicatie",
    title: "Communicatie",
    tagline: "Bevestigingen, herinneringen en late-arrival logica.",
    items: [
      { label: "Bevestigingsmail", value: "Direct na betaling" },
      { label: "Herinnering", value: "24u + 3u van tevoren" },
      { label: "Late-arrival drempel", value: "15 minuten" },
      { label: "No-show flag", value: "Na 3 instances binnen 6m" },
    ],
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-6">
        <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
          Instellingen
        </p>
        <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
          Configuratie.
        </h1>
        <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-dark)]/85 leading-relaxed">
          Venue-configuratie. Veranderingen zijn live — geen deploy nodig.
        </p>
      </header>

      <section className="px-9 pb-12 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className="relative text-left px-4 py-3 font-[family-name:var(--font-mono)] text-[12px] tracking-[0.05em]"
              >
                {isActive && (
                  <motion.span
                    layoutId="settings-active"
                    className="absolute inset-0 bg-[var(--color-main-dark)]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <span
                  className={[
                    "relative",
                    isActive
                      ? "text-[var(--color-main-light)]"
                      : "text-[var(--color-supporting-dark)]/75 hover:text-[var(--color-main-dark)]",
                  ].join(" ")}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </nav>

        <div>
          <AnimatePresence mode="wait">
            {SECTIONS.filter((s) => s.id === active).map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="spin-card-light p-6"
              >
                <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/65 mb-2">
                  Sectie · {s.title.toLowerCase()}
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-[24px] text-[var(--color-main-dark)] leading-tight">
                  {s.title}
                </h2>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/80 leading-relaxed max-w-md">
                  {s.tagline}
                </p>
                <ul className="mt-6 divide-y divide-[var(--color-supporting-dark)]/12">
                  {s.items.map((it) => (
                    <li
                      key={it.label}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/80">
                        {it.label}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-main-dark)] text-right">
                        {it.value}
                        <button
                          type="button"
                          className="ml-3 text-[var(--color-accent-orange)] hover:underline underline-offset-2"
                        >
                          Bewerk
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
