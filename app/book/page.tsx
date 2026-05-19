"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { MOCK_NOW } from "@/lib/time";

type SlotState = "vrij" | "beperkt" | "vol" | "selected";

interface DayCell {
  date: Date;
  isToday: boolean;
  available: number;
}

interface TimeSlot {
  label: string;
  state: SlotState;
}

function buildDays(now: Date): DayCell[] {
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = (day + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      isToday: date.toDateString() === now.toDateString(),
      available: 12 + ((i * 7) % 9),
    };
  });
}

const DAY_INITIALS = ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"];

const TIMESLOTS: TimeSlot[] = [
  { label: "17:00", state: "vrij" },
  { label: "17:30", state: "vrij" },
  { label: "18:00", state: "vrij" },
  { label: "18:30", state: "selected" },
  { label: "19:00", state: "vol" },
  { label: "19:30", state: "vol" },
  { label: "20:00", state: "beperkt" },
  { label: "20:30", state: "vrij" },
  { label: "21:00", state: "vrij" },
];

const stateMeta: Record<SlotState, { label: string; cls: string; numCls: string }> = {
  vrij: {
    label: "Vrij",
    cls: "border-[var(--color-supporting-neutral)]/30 hover:border-[var(--color-main-light)]/70",
    numCls: "text-[var(--color-main-light)]",
  },
  beperkt: {
    label: "Beperkt",
    cls: "border-[var(--color-accent-orange)]/60 hover:border-[var(--color-accent-orange)]",
    numCls: "text-[var(--color-accent-orange)]",
  },
  vol: {
    label: "Vol",
    cls: "border-[var(--color-error-critical)] opacity-40 cursor-not-allowed",
    numCls: "text-[var(--color-supporting-neutral)] line-through",
  },
  selected: {
    label: "Geselecteerd",
    cls: "bg-[var(--color-accent-purple)] border-[var(--color-accent-purple)] text-[var(--color-main-light)] shadow-[0_0_0_3px_rgba(136,116,217,0.15)]",
    numCls: "text-[var(--color-main-light)]",
  },
};

export default function BookDatePage() {
  const days = buildDays(MOCK_NOW);
  const [selectedDayIdx, setSelectedDayIdx] = useState(
    days.findIndex((d) => d.isToday)
  );
  const [selectedTime, setSelectedTime] = useState("18:30");

  const selectedDay = days[selectedDayIdx];

  function isSelected(slot: TimeSlot) {
    return slot.label === selectedTime;
  }

  return (
    <div className="flex-1 flex flex-col px-5 sm:px-7 pt-6 pb-32 max-w-md mx-auto w-full relative">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-4">
        Stap 01 / 06 · Datum &amp; tijd
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[2.6rem] sm:text-[3rem] leading-[0.95]"
      >
        Kies een
        <br />
        <span className="spin-em text-[var(--color-accent-purple)] lowercase">
          datum.
        </span>
      </motion.h1>

      <div className="mt-8">
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const active = i === selectedDayIdx;
            return (
              <button
                key={d.date.toISOString()}
                type="button"
                onClick={() => setSelectedDayIdx(i)}
                className={[
                  "flex flex-col items-center justify-center py-3 border transition-colors",
                  active
                    ? "bg-[var(--color-accent-orange)] border-[var(--color-accent-orange)] text-[var(--color-main-light)]"
                    : "border-[var(--color-supporting-neutral)]/25 text-[var(--color-main-light)]/70 hover:border-[var(--color-main-light)]/50",
                ].join(" ")}
              >
                <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.15em]">
                  {DAY_INITIALS[i]}
                </span>
                <span className="mt-1 font-[family-name:var(--font-display)] text-[16px] spin-tnum">
                  {d.date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]">
          Tijdsloten · {selectedDay.date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-accent-purple)]">
          {TIMESLOTS.filter((s) => s.state !== "vol").length} vrij
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {TIMESLOTS.map((slot) => {
          const meta = isSelected(slot) ? stateMeta.selected : stateMeta[slot.state];
          const disabled = slot.state === "vol";
          return (
            <motion.button
              key={slot.label}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setSelectedTime(slot.label)}
              whileTap={!disabled ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.12 }}
              className={[
                "py-3.5 flex flex-col items-center justify-center border transition-all duration-150",
                meta.cls,
              ].join(" ")}
            >
              <span className={["font-[family-name:var(--font-display)] text-[18px] spin-tnum", meta.numCls].join(" ")}>
                {slot.label}
              </span>
              <span
                className={[
                  "mt-0.5 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.15em] uppercase",
                  isSelected(slot)
                    ? "text-[var(--color-main-light)]/80"
                    : "text-[var(--color-supporting-neutral)]",
                ].join(" ")}
              >
                {meta.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-main-dark)] border-t border-[var(--color-supporting-dark)]/40"
      >
        <div className="max-w-md mx-auto px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]">
              Geselecteerd
            </p>
            <p className="font-[family-name:var(--font-display)] text-[14px] mt-0.5">
              {selectedDay.date.toLocaleDateString("nl-NL", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              · {selectedTime}
            </p>
          </div>
          <Link
            href="/book/guests"
            className="px-5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            Verder →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
