"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";

const PREFERENCES = [
  { id: "birthday", label: "Verjaardag" },
  { id: "anniversary", label: "Jubileum" },
  { id: "vegan", label: "Vegan-keuken" },
  { id: "gluten", label: "Glutenvrij" },
  { id: "allergy", label: "Allergie" },
  { id: "quiet", label: "Rustige plek" },
];

export default function ContactPage() {
  const [active, setActive] = useState<Set<string>>(new Set(["birthday"]));
  const [opmerking, setOpmerking] = useState("");

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-6 pb-32 max-w-md mx-auto w-full relative">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-4">
        Stap 04 / 06 · Contact
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[2.4rem] sm:text-[2.8rem] leading-[0.96]"
      >
        Even snel
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          contactgegevens.
        </span>
      </motion.h1>
      <p className="mt-4 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-neutral)] leading-relaxed">
        Alleen voor bevestiging en late-arrival berichten. Geen nieuwsbrieven.
      </p>

      <div className="mt-7 space-y-3">
        {[
          { id: "naam", label: "Naam", placeholder: "Lotte van den Berg", type: "text", auto: "name" },
          { id: "email", label: "E-mail", placeholder: "lotte@example.nl", type: "email", auto: "email" },
          { id: "tel", label: "Telefoon", placeholder: "+31 6 …", type: "tel", auto: "tel" },
        ].map((f) => (
          <div key={f.id}>
            <label
              htmlFor={f.id}
              className="block font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-1.5"
            >
              {f.label}
            </label>
            <input
              id={f.id}
              type={f.type}
              autoComplete={f.auto}
              placeholder={f.placeholder}
              className="w-full bg-transparent border border-[var(--color-supporting-neutral)]/30 px-3 py-3 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-main-light)] placeholder:text-[var(--color-supporting-neutral)]/55 focus:outline-none focus:border-[var(--color-accent-purple)] transition-colors"
            />
          </div>
        ))}

        <div className="pt-2">
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-2">
            Bijzonderheden
          </p>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map((p) => {
              const on = active.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  whileTap={{ scale: 0.96 }}
                  className={[
                    "px-3 py-1.5 border font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] transition-colors",
                    on
                      ? "border-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]/15 text-[var(--color-accent-purple)]"
                      : "border-[var(--color-supporting-neutral)]/30 text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] hover:border-[var(--color-main-light)]/60",
                  ].join(" ")}
                >
                  {p.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="pt-3">
          <label
            htmlFor="opmerking"
            className="block font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-1.5"
          >
            Opmerking (optioneel)
          </label>
          <textarea
            id="opmerking"
            rows={3}
            value={opmerking}
            onChange={(e) => setOpmerking(e.target.value)}
            placeholder="Bijv. allergie, voorkeur voor stoel naast bar, etc."
            className="w-full bg-transparent border border-[var(--color-supporting-neutral)]/30 px-3 py-3 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-main-light)] placeholder:text-[var(--color-supporting-neutral)]/55 focus:outline-none focus:border-[var(--color-accent-purple)] resize-none transition-colors"
          />
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
            href="/book/extras"
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)]"
          >
            ← Terug
          </Link>
          <Link
            href="/book/deposit"
            className="px-5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Verder →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
