"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";
import { TABLES } from "@/lib/mock/tables";
import { RESERVATIONS, GUESTS } from "@/lib/mock/reservations";
import { MOCK_NOW, formatOccupancy } from "@/lib/time";
import type { Table } from "@/types";

type CellState = "available" | "active" | "overtime" | "soon" | "noshow";

interface TableCell {
  table: Table;
  state: CellState;
  occupancyLabel: string;
  guestName?: string;
}

const STATE_COLOR: Record<
  CellState,
  { fill: string; stroke: string; text: string }
> = {
  available: {
    fill: "rgba(247, 236, 217, 0.04)",
    stroke: "rgba(247, 236, 217, 0.18)",
    text: "rgba(247, 236, 217, 0.55)",
  },
  active: {
    fill: "rgba(247, 236, 217, 0.12)",
    stroke: "rgba(247, 236, 217, 0.85)",
    text: "rgba(247, 236, 217, 0.95)",
  },
  overtime: {
    fill: "rgba(217, 81, 37, 0.18)",
    stroke: "rgba(217, 81, 37, 0.95)",
    text: "rgba(247, 236, 217, 0.95)",
  },
  soon: {
    fill: "rgba(136, 116, 217, 0.18)",
    stroke: "rgba(136, 116, 217, 0.85)",
    text: "rgba(247, 236, 217, 0.95)",
  },
  noshow: {
    fill: "rgba(62, 14, 20, 0.5)",
    stroke: "rgba(62, 14, 20, 1)",
    text: "rgba(247, 236, 217, 0.6)",
  },
};

const guestById = new Map(GUESTS.map((g) => [g.id, g]));

function cellsFromReservations(now: Date): TableCell[] {
  return TABLES.map((table) => {
    const res = RESERVATIONS.find(
      (r) =>
        r.tableId === table.id &&
        (r.status === "confirmed" ||
          r.status === "checked-in" ||
          r.status === "no-show" ||
          r.status === "waitlist-claimed") &&
        r.startTime.getTime() - 30 * 60_000 <= now.getTime() &&
        r.expectedEndTime.getTime() + 60 * 60_000 >= now.getTime()
    );
    if (!res) {
      return { table, state: "available", occupancyLabel: "Vrij" };
    }
    const occ = formatOccupancy(res.startTime, now, res.expectedEndTime);
    const guest = guestById.get(res.guestId);
    let state: CellState = "active";
    if (res.status === "no-show") state = "noshow";
    else if (occ.kind === "overtime") state = "overtime";
    else if (occ.kind === "arriving" || occ.kind === "upcoming") state = "soon";
    return {
      table,
      state,
      occupancyLabel: res.status === "no-show" ? "No-show" : occ.label,
      guestName: guest?.name,
    };
  });
}

const VIEWBOX_W = 1280;
const VIEWBOX_H = 720;

export default function FloorPage() {
  const cells = useMemo(() => cellsFromReservations(MOCK_NOW), []);
  const [selected, setSelected] = useState<string | null>(null);

  const counts = useMemo(() => {
    return cells.reduce(
      (acc, c) => {
        acc[c.state] = (acc[c.state] ?? 0) + 1;
        return acc;
      },
      {} as Record<CellState, number>
    );
  }, [cells]);

  const dateLabel = MOCK_NOW.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const selectedCell = selected
    ? cells.find((c) => c.table.id === selected) ?? null
    : null;

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-6 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
            Plattegrond · {dateLabel}
          </p>
          <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
            Vloer.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase">
          {[
            { l: "Beschikbaar", k: "available" as const },
            { l: "Actief", k: "active" as const },
            { l: "Binnenkort", k: "soon" as const },
            { l: "Overtijd", k: "overtime" as const },
            { l: "No-show", k: "noshow" as const },
          ].map((it) => (
            <span
              key={it.k}
              className="flex items-center gap-2 text-[var(--color-supporting-dark)]/75"
            >
              <span
                className="w-2.5 h-2.5"
                style={{
                  background: STATE_COLOR[it.k].fill,
                  border: `1px solid ${STATE_COLOR[it.k].stroke}`,
                }}
              />
              {it.l}
              <span className="text-[var(--color-supporting-dark)]/55 spin-tnum">
                {counts[it.k] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </header>

      <section className="px-9 pb-12">
        <BlurFade delay={0.08}>
          <div className="bg-[var(--color-main-dark)] spin-grain relative overflow-hidden">
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
              className="w-full h-auto block"
              role="img"
              aria-label="Plattegrond van SPIN: pool links, dining midden, listening bar rechts."
            >
              <ZoneLabel x={40} y={40} text="Pool" />
              <ZoneLabel x={460} y={40} text="Dining" />
              <ZoneLabel x={800} y={40} text="Listening bar" />

              <line
                x1={420}
                y1={20}
                x2={420}
                y2={VIEWBOX_H - 20}
                stroke="rgba(247,236,217,0.06)"
                strokeWidth="1"
                strokeDasharray="6 6"
              />
              <line
                x1={780}
                y1={20}
                x2={780}
                y2={VIEWBOX_H - 20}
                stroke="rgba(247,236,217,0.06)"
                strokeWidth="1"
                strokeDasharray="6 6"
              />

              <rect
                x={800}
                y={140}
                width={460}
                height={4}
                fill="rgba(247,236,217,0.18)"
              />
              <text
                x={1030}
                y={170}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="3"
                fill="rgba(247,236,217,0.35)"
              >
                COUNTER
              </text>

              {cells.map((cell) => {
                const colors = STATE_COLOR[cell.state];
                const isBar = cell.table.shape === "bar-seat";
                const isSelected = selected === cell.table.id;
                return (
                  <g
                    key={cell.table.id}
                    onClick={() => setSelected(cell.table.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {isBar ? (
                      <circle
                        cx={cell.table.position.x}
                        cy={cell.table.position.y}
                        r={cell.table.width / 2}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                      />
                    ) : (
                      <rect
                        x={cell.table.position.x - cell.table.width / 2}
                        y={cell.table.position.y - cell.table.height / 2}
                        width={cell.table.width}
                        height={cell.table.height}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                      />
                    )}
                    <text
                      x={cell.table.position.x}
                      y={cell.table.position.y + (isBar ? 4 : 6)}
                      textAnchor="middle"
                      fontFamily="var(--font-display)"
                      fontSize={isBar ? 10 : 16}
                      fill={colors.text}
                    >
                      {cell.table.label}
                    </text>
                    {!isBar && (
                      <text
                        x={cell.table.position.x}
                        y={cell.table.position.y + 26}
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                        fontSize="9"
                        letterSpacing="1.2"
                        fill={colors.text}
                        opacity="0.7"
                      >
                        {cell.occupancyLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <AnimatePresence>
              {selectedCell && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25 }}
                  className="absolute left-5 right-5 bottom-5 sm:right-auto sm:max-w-sm bg-[var(--color-main-light)] text-[var(--color-main-dark)] p-4 shadow-2xl"
                >
                  <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/65">
                    {selectedCell.table.zone} · {selectedCell.table.label} ·{" "}
                    {selectedCell.table.capacity}p
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-[18px]">
                    {selectedCell.guestName ?? selectedCell.occupancyLabel}
                  </p>
                  {selectedCell.guestName && (
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/80">
                      {selectedCell.occupancyLabel}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Sluit"
                    className="absolute top-2 right-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/65 hover:text-[var(--color-main-dark)]"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BlurFade>

        <p className="mt-4 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/70">
          Klik op een tafel voor gastdetails. Donker = vrij · krijtwit = actief · paars = binnenkort · oranje = overtijd.
        </p>
      </section>
    </div>
  );
}

function ZoneLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      fontFamily="var(--font-mono)"
      fontSize="11"
      letterSpacing="3"
      fill="rgba(247,236,217,0.45)"
    >
      {text.toUpperCase()}
    </text>
  );
}
