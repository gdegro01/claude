"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";
import { GUESTS, RESERVATIONS } from "@/lib/mock/reservations";
import { TABLES } from "@/lib/mock/tables";
import { ACTIVITIES } from "@/lib/mock/activities";
import { MOCK_NOW, formatOccupancy } from "@/lib/time";
import { formatClock } from "@/lib/queries";
import type { Reservation } from "@/types";

const STATUS_META: Record<
  Reservation["status"],
  { label: string; cls: string }
> = {
  confirmed: {
    label: "Bevestigd",
    cls:
      "bg-[var(--color-accent-purple)]/12 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/30",
  },
  "checked-in": {
    label: "Ingecheckt",
    cls:
      "bg-[var(--color-confirm-green)]/15 text-[var(--color-confirm-green)] border-[var(--color-confirm-green)]/35",
  },
  "no-show": {
    label: "No-show",
    cls:
      "bg-[var(--color-error-critical)] text-[var(--color-main-light)] border-[var(--color-error-critical)]",
  },
  cancelled: {
    label: "Geannuleerd",
    cls:
      "bg-[var(--color-supporting-neutral)]/15 text-[var(--color-supporting-dark)]/65 border-[var(--color-supporting-neutral)]/30 line-through",
  },
  "waitlist-claimed": {
    label: "Waitlist claim",
    cls:
      "bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)] border-[var(--color-accent-orange)]/35",
  },
};

type FilterKey = "alles" | "vanavond" | "actief" | "aandacht";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "alles", label: "Alles" },
  { key: "vanavond", label: "Vanavond" },
  { key: "actief", label: "Actief" },
  { key: "aandacht", label: "Aandacht" },
];

const guestById = new Map(GUESTS.map((g) => [g.id, g]));
const tableById = new Map(TABLES.map((t) => [t.id, t]));
const activityById = new Map(ACTIVITIES.map((a) => [a.id, a]));

export default function ReservationsPage() {
  const [filter, setFilter] = useState<FilterKey>("vanavond");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const now = MOCK_NOW;
    return RESERVATIONS.filter((r) => {
      if (filter === "actief") {
        return (
          (r.status === "confirmed" || r.status === "checked-in") &&
          r.startTime <= now &&
          r.expectedEndTime >= now
        );
      }
      if (filter === "vanavond") {
        return (
          r.startTime.toDateString() === now.toDateString() &&
          r.status !== "cancelled"
        );
      }
      if (filter === "aandacht") {
        if (r.status === "no-show") return true;
        if (r.status === "confirmed" && r.startTime < now) {
          const lateMinutes = (now.getTime() - r.startTime.getTime()) / 60_000;
          return lateMinutes > 15;
        }
        return false;
      }
      return true;
    }).filter((r) => {
      if (!query) return true;
      const guest = guestById.get(r.guestId);
      const haystack = `${r.reference} ${guest?.name ?? ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [filter, query]);

  const dateLabel = MOCK_NOW.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-6 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
            Reserveringen · {dateLabel}
          </p>
          <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
            Boekingen.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ref of naam"
              className="font-[family-name:var(--font-mono)] text-[12px] px-3 py-2.5 bg-transparent border border-[var(--color-supporting-dark)]/30 text-[var(--color-main-dark)] placeholder:text-[var(--color-supporting-dark)]/45 focus:outline-none focus:border-[var(--color-accent-purple)] w-44"
            />
          </div>
          <button
            type="button"
            className="px-4 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            + Nieuw
          </button>
        </div>
      </header>

      <div className="px-9 pb-3 flex items-center gap-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="relative px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.15em] uppercase transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="reservations-filter-pill"
                  className="absolute inset-0 bg-[var(--color-main-dark)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={[
                  "relative",
                  active
                    ? "text-[var(--color-main-light)]"
                    : "text-[var(--color-supporting-dark)]/70 hover:text-[var(--color-main-dark)]",
                ].join(" ")}
              >
                {f.label}
              </span>
            </button>
          );
        })}
        <p className="ml-auto font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/65">
          {rows.length} resultaten
        </p>
      </div>

      <section className="px-9 pb-12">
        <BlurFade delay={0.05}>
          <div className="spin-card-light overflow-hidden">
            <div className="hidden md:grid grid-cols-[90px_70px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_50px_120px_120px] items-center gap-3 px-5 py-3 bg-[var(--color-supporting-dark)]/8 border-b border-[var(--color-supporting-dark)]/12 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
              <span>Ref</span>
              <span>Tijd</span>
              <span>Gast</span>
              <span>Activiteit</span>
              <span>Tafel</span>
              <span>Pers</span>
              <span>Status</span>
              <span className="text-right">Occupancy</span>
            </div>
            <ul>
              {rows.map((r, i) => {
                const guest = guestById.get(r.guestId);
                const table = tableById.get(r.tableId);
                const activity = activityById.get(r.activityId);
                const meta = STATUS_META[r.status];
                const occ = formatOccupancy(
                  r.startTime,
                  MOCK_NOW,
                  r.expectedEndTime
                );
                return (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    className="grid grid-cols-[90px_70px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_50px_120px_120px] items-center gap-3 px-5 py-3.5 border-b border-[var(--color-supporting-dark)]/6 last:border-0 hover:bg-[var(--color-supporting-dark)]/4 transition-colors cursor-pointer"
                  >
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/75 spin-tnum">
                      {r.reference}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] spin-tnum text-[var(--color-main-dark)]">
                      {formatClock(r.startTime)}
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-[15px] text-[var(--color-main-dark)] truncate flex items-center gap-2">
                      {guest?.name ?? "—"}
                      {guest?.isVip && (
                        <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border border-[var(--color-accent-purple)]/40 text-[var(--color-accent-purple)]">
                          VIP
                        </span>
                      )}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-main-dark)]/85 truncate">
                      {activity?.name ?? "—"}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] spin-tnum text-[var(--color-supporting-dark)]/85">
                      {table?.label ?? "—"}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] spin-tnum text-[var(--color-main-dark)]/85">
                      {r.partySize}
                    </span>
                    <span>
                      <span
                        className={[
                          "inline-flex font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase px-2 py-1 border",
                          meta.cls,
                        ].join(" ")}
                      >
                        {meta.label}
                      </span>
                    </span>
                    <span
                      className={[
                        "text-right font-[family-name:var(--font-mono)] text-[11px] tracking-[0.05em] spin-tnum",
                        occ.kind === "overtime"
                          ? "text-[var(--color-accent-orange)]"
                          : occ.kind === "active" || occ.kind === "arriving"
                          ? "text-[var(--color-main-dark)]"
                          : "text-[var(--color-supporting-dark)]/70",
                      ].join(" ")}
                    >
                      {occ.label}
                    </span>
                  </motion.li>
                );
              })}
              {rows.length === 0 && (
                <li className="px-5 py-10 text-center font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/65">
                  Geen reserveringen voor dit filter.
                </li>
              )}
            </ul>
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
