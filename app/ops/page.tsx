"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { BlurFade } from "@/components/motion/BlurFade";
import {
  getDashboardMetrics,
  getUpcomingArrivals,
  getResolvedWaitlist,
  formatClock,
} from "@/lib/queries";
import { MOCK_NOW } from "@/lib/time";

type StatusKey = "confirmed" | "late" | "waitlist" | "no-show" | "claimed";

const statusMeta: Record<StatusKey, { label: string; cls: string }> = {
  confirmed: {
    label: "Bevestigd",
    cls:
      "bg-[var(--color-accent-purple)]/12 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/30",
  },
  late: {
    label: "Te laat",
    cls:
      "bg-[var(--color-accent-orange)]/12 text-[var(--color-accent-orange)] border-[var(--color-accent-orange)]/30",
  },
  waitlist: {
    label: "Wacht",
    cls:
      "bg-[var(--color-supporting-neutral)]/15 text-[var(--color-supporting-neutral)] border-[var(--color-supporting-neutral)]/30",
  },
  "no-show": {
    label: "No-show",
    cls:
      "bg-[var(--color-error-critical)] text-[var(--color-main-light)] border-[var(--color-error-critical)]",
  },
  claimed: {
    label: "Geclaimd",
    cls:
      "bg-[var(--color-accent-purple)]/12 text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/30",
  },
};

function statusFor(occupancyKind: string, resStatus: string): StatusKey {
  if (resStatus === "no-show") return "no-show";
  if (resStatus === "waitlist-claimed") return "claimed";
  if (occupancyKind === "arriving") return "late";
  return "confirmed";
}

export default function OpsDashboard() {
  const metrics = getDashboardMetrics(MOCK_NOW);
  const arrivals = getUpcomingArrivals(MOCK_NOW, 240).slice(0, 6);
  const waitlist = getResolvedWaitlist();
  const priority = waitlist.slice(0, 3);
  const more = Math.max(0, waitlist.length - priority.length);

  const dateLabel = MOCK_NOW.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-7 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
            Vandaag · {dateLabel}
          </p>
          <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
            Overzicht.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/85">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[var(--color-confirm-green)] spin-live-dot" />
              <span className="relative inline-block w-2 h-2 rounded-full bg-[var(--color-confirm-green)]" />
            </span>
            Live · {formatClock(MOCK_NOW)}
          </span>
          <button
            type="button"
            className="px-4 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true">+</span>
            Reservering
          </button>
        </div>
      </header>

      <section className="px-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BlurFade delay={0}>
          <MetricCard
            label="Couverts"
            accent="var(--color-main-dark)"
            value={<NumberTicker value={metrics.coverts.value} />}
            sub={`van ${metrics.coverts.max} max`}
          />
        </BlurFade>
        <BlurFade delay={0.05}>
          <MetricCard
            label="Bezetting"
            accent="var(--color-accent-orange)"
            valueColor="var(--color-accent-orange)"
            value={
              <NumberTicker
                value={Math.round(metrics.occupancy.ratio * 100)}
                suffix="%"
              />
            }
            sub={`${metrics.occupancy.tablesActive}/${metrics.occupancy.tablesTotal} tafels`}
          />
        </BlurFade>
        <BlurFade delay={0.1}>
          <MetricCard
            label="Wachtlijst"
            accent="var(--color-accent-purple)"
            valueColor="var(--color-accent-purple)"
            value={<NumberTicker value={metrics.waitlist.count} />}
            sub={`${metrics.waitlist.activeStatuses} actief`}
          />
        </BlurFade>
        <BlurFade delay={0.15}>
          <MetricCard
            label="Aanbetalingen"
            accent="var(--color-confirm-green)"
            valueColor="var(--color-confirm-green)"
            value={<NumberTicker value={metrics.deposits.totalEuros} prefix="€" />}
            sub="vandaag"
          />
        </BlurFade>
      </section>

      <section className="px-9 mt-9">
        <BlurFade delay={0.18}>
          <div className="spin-card-light overflow-hidden">
            <div className="bg-[var(--color-error-critical)] text-[var(--color-main-light)] px-5 py-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase">
              Aankomende aankomsten · {dateLabel}
            </div>
            <div className="hidden md:grid grid-cols-[88px_minmax(0,1.5fr)_60px_minmax(0,1fr)_120px_minmax(0,1fr)_90px] items-center gap-3 px-5 py-3 bg-[var(--color-main-light)] border-b border-[var(--color-supporting-dark)]/8 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
              <span>Tijd</span>
              <span>Gast</span>
              <span>Pers.</span>
              <span>Activiteit</span>
              <span>Status</span>
              <span>Ref</span>
              <span className="text-right">Actie</span>
            </div>
            <ul>
              {arrivals.map((row, i) => {
                const status = statusFor(
                  row.occupancy.kind,
                  row.reservation.status
                );
                const meta = statusMeta[status];
                const isLate = status === "late";
                const isNoShow = status === "no-show";
                return (
                  <motion.li
                    key={row.reservation.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="grid grid-cols-[88px_minmax(0,1.5fr)_60px_minmax(0,1fr)_120px_minmax(0,1fr)_90px] items-center gap-3 px-5 py-3.5 border-b border-[var(--color-supporting-dark)]/6 last:border-0 hover:bg-[var(--color-supporting-dark)]/4 transition-colors"
                  >
                    <span
                      className={[
                        "font-[family-name:var(--font-mono)] text-[12px] spin-tnum",
                        isLate
                          ? "text-[var(--color-accent-orange)] font-semibold"
                          : "text-[var(--color-main-dark)]",
                      ].join(" ")}
                    >
                      {formatClock(row.reservation.startTime)}
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-[15px] text-[var(--color-main-dark)] truncate flex items-center gap-2">
                      {isNoShow && (
                        <span
                          aria-hidden="true"
                          className="inline-block w-2 h-2 rounded-full bg-[var(--color-error-critical)]"
                        />
                      )}
                      {row.guest.name}
                      {row.guest.isVip && (
                        <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border border-[var(--color-accent-purple)]/40 text-[var(--color-accent-purple)]">
                          VIP
                        </span>
                      )}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] spin-tnum text-[var(--color-main-dark)]/85">
                      {row.reservation.partySize}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-main-dark)]/85 truncate">
                      {row.activity.name}
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
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/75 spin-tnum">
                      {row.reservation.reference}
                    </span>
                    <Link
                      href="/ops/reservations"
                      className="text-right font-[family-name:var(--font-mono)] text-[11px] tracking-[0.15em] uppercase text-[var(--color-accent-orange)] hover:underline underline-offset-2"
                    >
                      Detail →
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </BlurFade>
      </section>

      <section className="px-9 mt-6 pb-12">
        <BlurFade delay={0.24}>
          <div className="overflow-hidden">
            <div className="bg-[var(--color-accent-purple)] text-[var(--color-main-light)] px-5 py-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase">
              Wachtlijst · prioriteit krijgt voorrang bij annulering
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] bg-[var(--color-main-light)] border border-[var(--color-supporting-dark)]/10 border-t-0">
              {priority.map((w, i) => (
                <div
                  key={w.item.id}
                  className={[
                    "p-5 border-b sm:border-b-0 sm:border-r border-[var(--color-supporting-dark)]/10",
                    i === 0
                      ? "bg-[var(--color-accent-purple)]/8"
                      : "bg-transparent",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase",
                      i === 0
                        ? "text-[var(--color-accent-purple)]"
                        : "text-[var(--color-supporting-dark)]/65",
                    ].join(" ")}
                  >
                    #{i + 1} · {i === 0 ? "prioriteit" : `positie ${i + 1}`}
                  </p>
                  <p className="mt-1.5 font-[family-name:var(--font-display)] text-[18px] text-[var(--color-main-dark)] truncate">
                    {w.guest.name.split(" ").slice(-1)[0]}
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/70">
                    {w.activity?.name ?? w.item.activityType} · {w.item.requestedPartySize}p
                  </p>
                </div>
              ))}
              <div className="p-5 flex flex-col justify-between gap-3 min-w-[180px] bg-[var(--color-supporting-dark)]/4">
                <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
                  + {more} meer wachten
                </p>
                <Link
                  href="/ops/waitlist"
                  className="px-3.5 py-3 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors text-center"
                >
                  Trigger vrijgave
                </Link>
              </div>
            </div>
          </div>
        </BlurFade>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: string;
  valueColor?: string;
}) {
  return (
    <div className="spin-card-light p-5 spin-card-accent" style={{ color: accent }}>
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/75">
        {label}
      </p>
      <p
        className="mt-3 font-[family-name:var(--font-display)] text-[2.4rem] leading-[1] spin-tnum"
        style={{ color: valueColor ?? "var(--color-main-dark)" }}
      >
        {value}
      </p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/70">
        {sub}
      </p>
    </div>
  );
}
