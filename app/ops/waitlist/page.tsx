"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";
import { CountdownRing } from "@/components/motion/CountdownRing";
import { getResolvedWaitlist, secondsUntil, formatClock } from "@/lib/queries";
import { MOCK_NOW } from "@/lib/time";
import type { ResolvedWaitlistItem } from "@/lib/queries";

const statusLabel: Record<string, { label: string; cls: string }> = {
  "claim-open": {
    label: "Claim open",
    cls: "bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)] border-[var(--color-accent-orange)]/35",
  },
  notified: {
    label: "Genotificeerd",
    cls: "bg-[var(--color-accent-purple)]/15 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/30",
  },
  waiting: {
    label: "Wacht",
    cls: "bg-[var(--color-supporting-neutral)]/15 text-[var(--color-supporting-dark)]/70 border-[var(--color-supporting-neutral)]/30",
  },
};

function waitedFor(addedAt: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - addedAt.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}u` : `${h}u ${m}m`;
}

export default function WaitlistPage() {
  const initial = useMemo(() => getResolvedWaitlist(), []);
  const [items, setItems] = useState<ResolvedWaitlistItem[]>(initial);
  const [released, setReleased] = useState<string | null>(null);

  const claimOpen = items.find((i) => i.item.status === "claim-open");
  const claimSecondsLeft = claimOpen?.item.claimWindowEndsAt
    ? secondsUntil(claimOpen.item.claimWindowEndsAt, MOCK_NOW)
    : 0;

  function triggerRelease() {
    if (items.length === 0) return;
    const first = items[0];
    setReleased(first.item.id);
    setTimeout(() => {
      setItems((prev) =>
        prev
          .filter((i) => i.item.id !== first.item.id)
          .map((i, idx) => ({
            ...i,
            item: { ...i.item, priority: idx + 1 },
          }))
      );
      setReleased(null);
    }, 700);
  }

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
            Wachtlijst · {dateLabel}
          </p>
          <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
            Wachtlijst.
          </h1>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-dark)]/85 leading-relaxed">
            Bij annulering of no-show worden gasten automatisch genotificeerd.
            Ze hebben 5 minuten om te claimen, anders zakt het door naar de
            volgende positie.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerRelease}
          className="px-5 py-3.5 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
        >
          Simuleer vrijgave →
        </button>
      </header>

      {claimOpen && (
        <BlurFade delay={0.1}>
          <section className="mx-9 mb-7 bg-[var(--color-main-dark)] text-[var(--color-main-light)] relative overflow-hidden spin-grain">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--color-accent-orange)]" />
            <div className="grid sm:grid-cols-[1fr_auto] items-center gap-8 px-7 py-7">
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-accent-orange)]">
                  Claim-window open · positie #{claimOpen.item.priority}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-[1.9rem] leading-[1.05]">
                  {claimOpen.guest.name}
                </h2>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-main-light)]/75">
                  {claimOpen.activity?.name ?? claimOpen.item.activityType} ·{" "}
                  {claimOpen.item.requestedPartySize} pers · voorkeur{" "}
                  {claimOpen.item.preferredTimeFrom}–
                  {claimOpen.item.preferredTimeTo}
                </p>
                <p className="mt-5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-main-light)]/55">
                  Tafel D2 vrijgekomen na no-show SP-006
                </p>
              </div>
              <CountdownRing
                totalSeconds={Math.max(claimSecondsLeft, 30)}
                size={180}
                warnAt={60}
              />
            </div>
          </section>
        </BlurFade>
      )}

      <section className="px-9 pb-12">
        <BlurFade delay={0.16}>
          <div className="grid grid-cols-[64px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_120px_100px] items-center gap-3 px-5 py-3 bg-[var(--color-supporting-dark)]/8 border-b border-[var(--color-supporting-dark)]/15 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
            <span>#</span>
            <span>Gast</span>
            <span>Voorkeur</span>
            <span>Gewacht</span>
            <span>Status</span>
            <span className="text-right">Notify</span>
          </div>

          <ul className="border-b border-[var(--color-supporting-dark)]/8">
            <AnimatePresence initial={false}>
              {items.map((row, idx) => {
                const status = statusLabel[row.item.status] ?? statusLabel.waiting;
                const isReleased = released === row.item.id;
                const isOpen = row.item.status === "claim-open";
                const isPriority = idx === 0;
                return (
                  <motion.li
                    key={row.item.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{
                      opacity: isReleased ? 0 : 1,
                      y: 0,
                      scale: isReleased ? 0.98 : 1,
                      backgroundColor: isReleased
                        ? "rgba(217, 81, 37, 0.08)"
                        : "rgba(0,0,0,0)",
                    }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      type: "spring",
                      stiffness: 360,
                      damping: 34,
                    }}
                    className={[
                      "grid grid-cols-[64px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_120px_100px] items-center gap-3 px-5 py-4 border-b border-[var(--color-supporting-dark)]/6 last:border-0 transition-colors",
                      isPriority && !isReleased
                        ? "bg-[var(--color-accent-purple)]/4"
                        : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex items-center justify-center w-9 h-9 font-[family-name:var(--font-display)] text-[16px] spin-tnum",
                        isPriority
                          ? "bg-[var(--color-accent-purple)] text-[var(--color-main-light)]"
                          : isOpen
                          ? "bg-[var(--color-accent-orange)] text-[var(--color-main-light)]"
                          : "bg-[var(--color-supporting-dark)]/10 text-[var(--color-supporting-dark)]/80",
                      ].join(" ")}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-display)] text-[16px] text-[var(--color-main-dark)] truncate flex items-center gap-2">
                        {row.guest.name}
                        {row.guest.isVip && (
                          <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border border-[var(--color-accent-purple)]/45 text-[var(--color-accent-purple)]">
                            VIP
                          </span>
                        )}
                      </p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/65 mt-0.5">
                        {row.activity?.name ?? row.item.activityType} ·{" "}
                        {row.item.requestedPartySize}p
                      </p>
                    </div>

                    <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/85 spin-tnum">
                      {row.item.preferredTimeFrom}–{row.item.preferredTimeTo}
                    </p>

                    <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/85 spin-tnum">
                      {waitedFor(row.item.addedAt, MOCK_NOW)}
                    </p>

                    <span>
                      <span
                        className={[
                          "inline-flex font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase px-2 py-1 border",
                          status.cls,
                        ].join(" ")}
                      >
                        {status.label}
                      </span>
                    </span>

                    <p className="text-right font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/75 spin-tnum">
                      {row.item.notifiedAt
                        ? formatClock(row.item.notifiedAt)
                        : "—"}
                    </p>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </BlurFade>
      </section>
    </div>
  );
}
