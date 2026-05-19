"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";
import { GUESTS, RESERVATIONS } from "@/lib/mock/reservations";
import { TABLES } from "@/lib/mock/tables";
import { MOCK_NOW } from "@/lib/time";
import { formatClock } from "@/lib/queries";

const guestById = new Map(GUESTS.map((g) => [g.id, g]));
const tableById = new Map(TABLES.map((t) => [t.id, t]));

export default function CheckinPage() {
  const [query, setQuery] = useState("");

  const upcoming = useMemo(() => {
    const cutoff = MOCK_NOW.getTime() + 45 * 60_000;
    return RESERVATIONS.filter(
      (r) =>
        (r.status === "confirmed" || r.status === "waitlist-claimed") &&
        r.startTime.getTime() >= MOCK_NOW.getTime() - 5 * 60_000 &&
        r.startTime.getTime() <= cutoff
    )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 6);
  }, []);

  const filtered = upcoming.filter((r) => {
    if (!query) return true;
    const guest = guestById.get(r.guestId);
    const haystack = `${r.reference} ${guest?.name ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-6">
        <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
          Check-in
        </p>
        <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
          Welkom.
        </h1>
        <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-dark)]/85 leading-relaxed">
          Gast scant de QR uit zijn bevestigingsmail. Het dashboard tikt
          direct door — de tafel-state schuift naar "Speelt · 0m".
        </p>
      </header>

      <section className="px-9 pb-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
        <BlurFade delay={0.05}>
          <div className="spin-card-light p-6 flex flex-col items-center">
            <div className="relative w-64 h-64 border border-[var(--color-supporting-dark)]/25 flex items-center justify-center bg-[var(--color-main-dark)]/4">
              <motion.div
                animate={{ y: [0, 216, 0] }}
                transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
                className="absolute left-3 right-3 h-[2px] bg-[var(--color-accent-orange)] opacity-80"
              />
              <div className="w-44 h-44 grid grid-cols-7 grid-rows-7 gap-[3px]">
                {Array.from({ length: 49 }).map((_, i) => {
                  const seed = (i * 37 + 11) % 100;
                  const on = seed < 55 || i % 8 === 0;
                  const corner =
                    i === 0 ||
                    i === 6 ||
                    i === 42 ||
                    (i >= 0 && i < 49 && (i % 7 < 1 || i % 7 > 5) && Math.floor(i / 7) < 1);
                  return (
                    <span
                      key={i}
                      className={
                        on || corner
                          ? "bg-[var(--color-main-dark)]"
                          : "bg-transparent"
                      }
                    />
                  );
                })}
              </div>
              <span className="absolute -bottom-7 left-0 right-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/65">
                Scanner actief
              </span>
            </div>
            <div className="mt-12 w-full">
              <label
                htmlFor="ref-search"
                className="block font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/65 mb-2"
              >
                Of zoek op naam / SP-referentie
              </label>
              <input
                id="ref-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SP-…"
                className="w-full bg-transparent border border-[var(--color-supporting-dark)]/25 px-3 py-3 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-main-dark)] placeholder:text-[var(--color-supporting-dark)]/45 focus:outline-none focus:border-[var(--color-accent-purple)]"
              />
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <div className="spin-card-light p-6 flex flex-col">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/65">
              Verwacht · komende 45 minuten
            </p>
            <ul className="mt-4 space-y-1">
              {filtered.map((r, i) => {
                const guest = guestById.get(r.guestId);
                const table = tableById.get(r.tableId);
                return (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="flex items-center justify-between gap-3 py-3 border-b border-[var(--color-supporting-dark)]/8 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-[family-name:var(--font-mono)] text-[12px] spin-tnum text-[var(--color-supporting-dark)]/75 w-10">
                        {formatClock(r.startTime)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-display)] text-[15px] text-[var(--color-main-dark)] truncate">
                          {guest?.name ?? "—"}
                        </p>
                        <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/65 spin-tnum">
                          {r.reference} · {table?.label ?? "—"} · {r.partySize}p
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-[var(--color-accent-orange)]/40 text-[var(--color-accent-orange)] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase hover:bg-[var(--color-accent-orange)] hover:text-[var(--color-main-light)] transition-colors"
                    >
                      Check in
                    </button>
                  </motion.li>
                );
              })}
              {filtered.length === 0 && (
                <li className="py-6 text-center font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/55">
                  Geen verwachte aankomsten.
                </li>
              )}
            </ul>
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
