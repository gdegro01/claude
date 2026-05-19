"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { BlurFade } from "@/components/motion/BlurFade";
import { SpinMark } from "@/components/brand/SpinMark";

type RowState = "arriving" | "active" | "overtime" | "soon";

interface LiveRow {
  id: string;
  guest: string;
  table: string;
  state: RowState;
  /** Minutes for current state — positive for elapsed, negative for "starts over" */
  minutes: number;
}

const STATE_COLORS: Record<RowState, string> = {
  arriving: "var(--color-accent-purple)",
  active: "var(--color-main-light)",
  overtime: "var(--color-accent-orange)",
  soon: "var(--color-accent-purple)",
};

function formatStatus(row: LiveRow): string {
  const abs = Math.abs(row.minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const time = h > 0 ? (m === 0 ? `${h}u` : `${h}u ${m}m`) : `${m}m`;

  switch (row.state) {
    case "arriving":
      return "Komt eraan";
    case "soon":
      return `Start over · ${time}`;
    case "overtime":
      return `Overtijd · +${time}`;
    case "active":
      return abs >= 60 ? `Ingecheckt · ${time}` : `Speelt · ${time}`;
  }
}

const INITIAL_ROWS: LiveRow[] = [
  { id: "r1", guest: "Verhoeven", table: "Pool P3", state: "active", minutes: 47 },
  { id: "r2", guest: "Bakker", table: "Dining D1", state: "active", minutes: 72 },
  { id: "r3", guest: "De Vries", table: "Bar B5–6", state: "overtime", minutes: 22 },
  { id: "r4", guest: "Jansen", table: "Pool P1", state: "soon", minutes: -18 },
  { id: "r5", guest: "Pieters", table: "Dining D2", state: "soon", minutes: -21 },
];

const ARRIVAL_QUEUE: LiveRow[] = [
  { id: "r6", guest: "Hofman", table: "Bar B3", state: "arriving", minutes: 0 },
  { id: "r7", guest: "Koster", table: "Pool P4", state: "arriving", minutes: 0 },
];

export default function DashboardLiveDemo() {
  const [rows, setRows] = useState<LiveRow[]>(INITIAL_ROWS);
  const [arrivalIdx, setArrivalIdx] = useState(0);
  const [metrics, setMetrics] = useState({
    occupancy: 67,
    waitlist: 6,
    attention: 2,
    couverts: 38,
  });
  const [tick, setTick] = useState(0);
  const dateLabel = useMemo(
    () =>
      new Date("2026-05-19T20:14:00+02:00").toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tick === 0) return;

    setRows((prev) => {
      const next = prev.map<LiveRow>((row) => {
        if (row.state === "soon" && row.minutes < 0) {
          const newMin = row.minutes + 5;
          if (newMin >= 0) {
            return { ...row, state: "arriving", minutes: 0 };
          }
          return { ...row, minutes: newMin };
        }
        if (row.state === "arriving") {
          return { ...row, state: "active", minutes: 1 };
        }
        if (row.state === "active") {
          const newMin = row.minutes + 1;
          if (newMin > 120) {
            return { ...row, state: "overtime", minutes: 1 };
          }
          return { ...row, minutes: newMin };
        }
        if (row.state === "overtime") {
          return { ...row, minutes: row.minutes + 1 };
        }
        return row;
      });

      const sortPriority: Record<RowState, number> = {
        overtime: 0,
        arriving: 1,
        soon: 2,
        active: 3,
      };
      next.sort((a, b) => {
        const pa = sortPriority[a.state];
        const pb = sortPriority[b.state];
        if (pa !== pb) return pa - pb;
        return Math.abs(a.minutes) - Math.abs(b.minutes);
      });

      return next;
    });

    if (tick % 5 === 0 && arrivalIdx < ARRIVAL_QUEUE.length) {
      setRows((prev) => [...prev, ARRIVAL_QUEUE[arrivalIdx]]);
      setArrivalIdx((i) => i + 1);
    }

    setMetrics((m) => ({
      ...m,
      couverts: m.couverts + (tick % 4 === 0 ? 1 : 0),
      occupancy: Math.min(95, m.occupancy + (tick % 6 === 0 ? 3 : 0)),
      attention: rows.filter((r) => r.state === "overtime").length || 1,
    }));
  }, [tick, arrivalIdx, rows]);

  return (
    <main className="relative min-h-[100dvh] spin-vignette spin-grain px-6 sm:px-10 pt-20 pb-12 overflow-hidden">
      <header className="max-w-4xl mx-auto flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-3">
            Demo — Live dashboard
          </p>
          <h1 className="text-[2.6rem] sm:text-[3rem] leading-[0.98]">
            Het systeem
            <br />
            <span className="spin-em text-[var(--color-accent-purple)]">
              ademt mee.
            </span>
          </h1>
          <p className="mt-5 max-w-md font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-neutral)] leading-relaxed">
            Geen harde refreshes. Reserveringen sorteren zich automatisch op
            urgentie — overtijd boven, dan komt-eraan, dan loopt. Hosts zien
            in 3 seconden waar aandacht nodig is.
          </p>
        </div>
        <span className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-[var(--color-confirm-green)] spin-live-dot" />
            <span className="relative inline-block w-2 h-2 rounded-full bg-[var(--color-confirm-green)]" />
          </span>
          Live · {dateLabel}
        </span>
      </header>

      <section className="max-w-4xl mx-auto mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LiveMetric label="Couverts" value={metrics.couverts} />
        <LiveMetric
          label="Bezetting"
          value={metrics.occupancy}
          suffix="%"
          color="var(--color-accent-orange)"
        />
        <LiveMetric
          label="Wachtlijst"
          value={metrics.waitlist}
          color="var(--color-accent-purple)"
        />
        <LiveMetric
          label="Aandacht"
          value={metrics.attention}
          color="var(--color-accent-orange)"
          pulse={metrics.attention > 0}
        />
      </section>

      <section className="max-w-4xl mx-auto mt-9">
        <div className="flex items-center justify-between mb-3">
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]">
            Actieve reserveringen · sorteert op urgentie
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] spin-tnum">
            t · {tick.toString().padStart(2, "0")}
          </p>
        </div>

        <div className="border border-[var(--color-supporting-dark)]/40">
          <LayoutGroup>
            <ul>
              <AnimatePresence initial={false}>
                {rows.map((row) => (
                  <motion.li
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 34,
                      mass: 0.9,
                    }}
                    className="grid grid-cols-[12px_1fr_120px_140px] items-center gap-4 px-5 py-4 border-b border-[var(--color-supporting-dark)]/30 last:border-0"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: STATE_COLORS[row.state],
                        opacity:
                          row.state === "overtime" || row.state === "arriving"
                            ? 1
                            : 0.7,
                      }}
                    />
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-[family-name:var(--font-display)] text-[16px] truncate">
                        {row.guest}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[var(--color-supporting-neutral)] truncate">
                        {row.table}
                      </span>
                    </div>
                    <motion.span
                      key={`${row.id}-${row.state}-${row.minutes}`}
                      initial={{ opacity: 0.4, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="font-[family-name:var(--font-mono)] text-[12px] tracking-[0.04em] spin-tnum text-right"
                      style={{ color: STATE_COLORS[row.state] }}
                    >
                      {formatStatus(row)}
                    </motion.span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] text-right">
                      {row.state === "overtime"
                        ? "vraag aandacht"
                        : row.state === "arriving"
                        ? "check-in starten"
                        : row.state === "soon"
                        ? "tafel voorbereiden"
                        : "loopt"}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </LayoutGroup>
        </div>

        <BlurFade delay={0.4}>
          <p className="mt-6 max-w-md font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-neutral)] leading-relaxed">
            Wat je ziet: elke 2 seconden tikt het systeem door. "Start over"
            telt af → "Komt eraan" → "Speelt". Overtijd-rijen schuiven naar
            boven. Nieuwe arrivals dropen in zonder pagina-refresh.
          </p>
        </BlurFade>
      </section>

      <SpinMark
        size="ghost"
        className="pointer-events-none select-none absolute -bottom-10 right-0 text-[var(--color-supporting-dark)]/30 z-0"
      />
    </main>
  );
}

function LiveMetric({
  label,
  value,
  suffix,
  color,
  pulse,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  pulse?: boolean;
}) {
  return (
    <div className="border border-[var(--color-supporting-dark)]/40 p-4 relative">
      {pulse && (
        <span
          className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-accent-orange)] spin-live-dot"
          aria-hidden="true"
        />
      )}
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--color-supporting-neutral)]">
        {label}
      </p>
      <p
        className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-[1] spin-tnum"
        style={{ color: color ?? "var(--color-main-light)" }}
      >
        <NumberTicker value={value} suffix={suffix ?? ""} />
      </p>
    </div>
  );
}
