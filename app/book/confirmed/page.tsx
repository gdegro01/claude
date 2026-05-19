"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SpinMark } from "@/components/brand/SpinMark";

const SUMMARY = [
  { label: "Datum", value: "Vr 23 mei 2026" },
  { label: "Aantal", value: "4 pers" },
  { label: "Aankomst", value: "19:00" },
  { label: "Extra's", value: "Signature ++" },
];

const RECEIPT_LINES: [string, string][] = [
  ["Aanbetaling 4p", "€60,00"],
  ["Koelkast Signature", "€115,00"],
  ["BTW 21%", "€36,75"],
];

export default function ConfirmedPage() {
  return (
    <div className="min-h-[calc(100dvh-3rem)] flex flex-col bg-[var(--color-main-dark)] text-[var(--color-main-light)] -mx-5 sm:-mx-7 -mt-4 pt-0 spin-grain relative overflow-hidden">
      <div className="h-[3px] bg-[var(--color-accent-orange)] shrink-0" />

      <header className="flex items-center justify-between px-6 sm:px-9 pt-6 pb-7">
        <SpinMark size="xl" />
        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 22 }}
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase px-3 py-2 border border-[var(--color-confirm-green)]/70 text-[var(--color-confirm-green)] flex items-center gap-2"
        >
          Betaald
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <motion.path
              d="M2 6.5l2.5 2.5L10 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
            />
          </svg>
        </motion.span>
      </header>

      <section className="px-6 sm:px-9 pb-8 grid grid-cols-1 sm:grid-cols-[1.05fr_1fr] gap-x-10 gap-y-7">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]"
          >
            Reservering bevestigd
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-3 text-[3.2rem] sm:text-[3.6rem] leading-[0.9]"
          >
            Tot
            <br />
            <span className="spin-em text-[var(--color-accent-purple)] lowercase">
              vrijdag.
            </span>
          </motion.h1>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="grid grid-cols-2 gap-x-8 gap-y-6 self-end"
        >
          {SUMMARY.map((s) => (
            <div key={s.label}>
              <dt className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]">
                {s.label}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-display)] text-[1.4rem] sm:text-[1.6rem] leading-tight">
                {s.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </section>

      <section className="px-6 sm:px-9 pb-12 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6 items-start">
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1.2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="bg-[var(--color-main-light)] text-[var(--color-main-dark)] relative shadow-2xl"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 14px), 96% 100%, 92% calc(100% - 14px), 88% 100%, 84% calc(100% - 14px), 80% 100%, 76% calc(100% - 14px), 72% 100%, 68% calc(100% - 14px), 64% 100%, 60% calc(100% - 14px), 56% 100%, 52% calc(100% - 14px), 48% 100%, 44% calc(100% - 14px), 40% 100%, 36% calc(100% - 14px), 32% 100%, 28% calc(100% - 14px), 24% 100%, 20% calc(100% - 14px), 16% 100%, 12% calc(100% - 14px), 8% 100%, 4% calc(100% - 14px), 0 100%)",
          }}
        >
          <div className="px-7 pt-7 pb-12 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed">
            <p className="text-center tracking-[0.05em] mb-1">
              **********BON
            </p>
            <p className="text-center tracking-[0.05em] font-bold text-[15px] mb-6">
              RECEIPT******
            </p>

            <div className="space-y-1 mb-4">
              <p>Date : 23/05/26 &nbsp;&nbsp; Time : 19:00</p>
              <p>Cashier : Kamila Spencer</p>
            </div>

            <div className="border-y border-dashed border-[var(--color-supporting-dark)]/45 py-3 my-3 space-y-1.5">
              {RECEIPT_LINES.map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="spin-tnum">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-[15px] mb-5">
              <span>TOTAL</span>
              <span className="spin-tnum">€211,75</span>
            </div>

            <div className="space-y-1 mb-6 text-[12px]">
              <p className="flex justify-between">
                <span>Bank card</span>
                <span className="spin-tnum">**** **** **** 1234</span>
              </p>
              <p className="flex justify-between">
                <span>Approval</span>
                <span className="spin-tnum">#42018</span>
              </p>
            </div>

            <p
              className="text-center mb-5 text-[var(--color-accent-purple)] text-[2.1rem] leading-none"
              style={{ fontFamily: "var(--font-script-stack)" }}
            >
              Thank you!
            </p>

            <div className="flex justify-center mb-3" aria-hidden="true">
              <Barcode />
            </div>

            <p className="text-center text-[10px] tracking-[0.04em] leading-relaxed text-[var(--color-supporting-dark)]/85">
              SPIN. Amsterdam · Rigakade 10
              <br />
              1013 BC Amsterdam &nbsp; KvK 80745989
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.55, type: "spring", stiffness: 220, damping: 22 }}
          className="flex flex-col items-center"
        >
          <div className="bg-[var(--color-main-light)] p-3.5 shadow-2xl">
            <FauxQR />
          </div>
          <span className="mt-3 inline-block bg-[var(--color-main-light)] text-[var(--color-main-dark)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.05em] relative">
            Scan bij binnenkomst
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--color-main-light)] rotate-45"
              aria-hidden="true"
            />
          </span>
        </motion.div>
      </section>

      <footer className="mt-auto px-6 sm:px-9 pb-9 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          className="py-3.5 border border-[var(--color-supporting-dark)]/45 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-main-light)]/85 hover:border-[var(--color-main-light)]/70 transition-colors"
        >
          ↓ Agenda
        </button>
        <button
          type="button"
          className="py-3.5 border border-[var(--color-supporting-dark)]/45 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-main-light)]/85 hover:border-[var(--color-main-light)]/70 transition-colors"
        >
          ⤴ Delen
        </button>
        <Link
          href="/"
          className="py-3.5 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] transition-colors"
        >
          Terug naar begin
        </Link>
      </footer>
    </div>
  );
}

function Barcode() {
  const bars = [
    3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2, 3, 1, 1, 2, 1,
    4, 2, 1, 2, 1, 3, 2, 1, 4, 1, 2,
  ];
  return (
    <svg width="170" height="44" viewBox="0 0 170 44" aria-hidden="true">
      {(() => {
        let x = 0;
        return bars.map((w, i) => {
          const rect = (
            <rect
              key={i}
              x={x}
              y={0}
              width={w}
              height={44}
              fill={i % 2 === 0 ? "currentColor" : "transparent"}
            />
          );
          x += w + 1;
          return rect;
        });
      })()}
    </svg>
  );
}

function FauxQR() {
  const cells = 17;
  const size = 200;
  const cell = size / cells;
  const grid = Array.from({ length: cells * cells }, (_, i) => {
    const r = Math.floor(i / cells);
    const c = i % cells;
    const seed = (r * 31 + c * 17 + 7) % 100;
    const corner =
      (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
    if (corner) return false;
    return seed < 50;
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="QR code voorbeeld"
      role="img"
    >
      <rect width={size} height={size} fill="var(--color-main-light)" />
      {grid.map((on, i) => {
        if (!on) return null;
        const r = Math.floor(i / cells);
        const c = i % cells;
        return (
          <rect
            key={i}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            fill="var(--color-main-dark)"
          />
        );
      })}
      <FinderPattern x={0} y={0} cell={cell} />
      <FinderPattern x={(cells - 7) * cell} y={0} cell={cell} />
      <FinderPattern x={0} y={(cells - 7) * cell} cell={cell} />
    </svg>
  );
}

function FinderPattern({ x, y, cell }: { x: number; y: number; cell: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={cell * 7} height={cell * 7} fill="var(--color-main-dark)" />
      <rect
        x={cell}
        y={cell}
        width={cell * 5}
        height={cell * 5}
        fill="var(--color-main-light)"
      />
      <rect
        x={cell * 2}
        y={cell * 2}
        width={cell * 3}
        height={cell * 3}
        fill="var(--color-main-dark)"
      />
    </g>
  );
}
