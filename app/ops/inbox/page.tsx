"use client";

import { motion } from "motion/react";
import { BlurFade } from "@/components/motion/BlurFade";
import { GUESTS, RESERVATIONS } from "@/lib/mock/reservations";
import { TABLES } from "@/lib/mock/tables";
import { MOCK_NOW } from "@/lib/time";
import { formatClock } from "@/lib/queries";

interface InboxRow {
  id: string;
  type:
    | "late-arrival"
    | "vip-note"
    | "birthday"
    | "system"
    | "suspicious-booking"
    | "complaint";
  who: string;
  subject: string;
  body: string;
  at: Date;
  unread: boolean;
  reference?: string;
}

const typeMeta: Record<
  InboxRow["type"],
  { label: string; cls: string; accent: string }
> = {
  "late-arrival": {
    label: "Late arrival",
    cls: "text-[var(--color-accent-orange)]",
    accent: "var(--color-accent-orange)",
  },
  "vip-note": {
    label: "VIP",
    cls: "text-[var(--color-accent-purple)]",
    accent: "var(--color-accent-purple)",
  },
  birthday: {
    label: "Verjaardag",
    cls: "text-[var(--color-accent-purple)]",
    accent: "var(--color-accent-purple)",
  },
  system: {
    label: "Systeem",
    cls: "text-[var(--color-supporting-dark)]/75",
    accent: "var(--color-supporting-dark)",
  },
  "suspicious-booking": {
    label: "Geflagged",
    cls: "text-[var(--color-error-critical)]",
    accent: "var(--color-error-critical)",
  },
  complaint: {
    label: "Klacht",
    cls: "text-[var(--color-error-critical)]",
    accent: "var(--color-error-critical)",
  },
};

const guestById = new Map(GUESTS.map((g) => [g.id, g]));
const tableById = new Map(TABLES.map((t) => [t.id, t]));

function buildInbox(): InboxRow[] {
  const lateRes = RESERVATIONS.find(
    (r) => r.id === "res-025"
  );
  const birthdayGuest = GUESTS.find((g) => g.notes?.includes("Verjaardag"));
  const birthdayRes = birthdayGuest
    ? RESERVATIONS.find((r) => r.guestId === birthdayGuest.id)
    : undefined;
  const vipGuest = GUESTS.find((g) => g.isVip);
  const vipRes = vipGuest
    ? RESERVATIONS.find((r) => r.guestId === vipGuest.id)
    : undefined;
  const cancelledRes = RESERVATIONS.find((r) => r.status === "cancelled");
  const noShowRes = RESERVATIONS.find((r) => r.status === "no-show");

  const out: InboxRow[] = [];
  if (lateRes) {
    const guest = guestById.get(lateRes.guestId);
    const table = tableById.get(lateRes.tableId);
    out.push({
      id: lateRes.id,
      type: "late-arrival",
      who: guest?.name ?? "Onbekend",
      subject: `25m te laat — ${table?.label ?? ""}`,
      body: lateRes.internalNotes ?? "Gast heeft niet ingecheckt, geen contact.",
      at: new Date(MOCK_NOW.getTime() - 25 * 60_000),
      unread: true,
      reference: lateRes.reference,
    });
  }
  if (birthdayRes && birthdayGuest) {
    out.push({
      id: birthdayRes.id,
      type: "birthday",
      who: birthdayGuest.name,
      subject: "Verjaardag · tafel versieren",
      body: birthdayGuest.notes ?? "",
      at: new Date(MOCK_NOW.getTime() - 12 * 60_000),
      unread: true,
      reference: birthdayRes.reference,
    });
  }
  if (vipGuest && vipRes) {
    out.push({
      id: `vip-${vipRes.id}`,
      type: "vip-note",
      who: vipGuest.name,
      subject: "VIP-voorkeur",
      body: vipGuest.notes ?? "Altijd onze huiscocktail bij binnenkomst.",
      at: new Date(MOCK_NOW.getTime() - 35 * 60_000),
      unread: false,
      reference: vipRes.reference,
    });
  }
  if (cancelledRes) {
    out.push({
      id: cancelledRes.id,
      type: "system",
      who: "Systeem",
      subject: `Reservering geannuleerd — ${cancelledRes.reference}`,
      body:
        cancelledRes.internalNotes ??
        "Annulering verwerkt, wachtlijst genotificeerd.",
      at: new Date(MOCK_NOW.getTime() - 50 * 60_000),
      unread: false,
      reference: cancelledRes.reference,
    });
  }
  if (noShowRes) {
    const guest = guestById.get(noShowRes.guestId);
    out.push({
      id: `noshow-${noShowRes.id}`,
      type: "suspicious-booking",
      who: guest?.name ?? "Onbekend",
      subject: "Herhaalde no-show — flag toegevoegd",
      body:
        "Derde no-show binnen 6 maanden — automatisch geflagged voor manuele review.",
      at: new Date(MOCK_NOW.getTime() - 75 * 60_000),
      unread: false,
      reference: noShowRes.reference,
    });
  }

  out.sort((a, b) => b.at.getTime() - a.at.getTime());
  return out;
}

function relativeFromNow(at: Date, now: Date): string {
  const seconds = (now.getTime() - at.getTime()) / 1000;
  const m = Math.floor(seconds / 60);
  if (m < 1) return "zojuist";
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  return `${h}u geleden`;
}

export default function InboxPage() {
  const rows = buildInbox();
  const dateLabel = MOCK_NOW.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const unread = rows.filter((r) => r.unread).length;

  return (
    <div className="flex-1 overflow-auto">
      <header className="px-9 pt-8 pb-6 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[var(--color-supporting-dark)]/70">
            Inbox · {dateLabel}
          </p>
          <h1 className="mt-2 text-[2.4rem] leading-[1] text-[var(--color-main-dark)]">
            Aandacht.
          </h1>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-dark)]/85 leading-relaxed">
            Gastberichten, late-arrivals, verjaardagen, geflagde boekingen.
            Geen e-mailsoftware — hospitality-eerste communicatie.
          </p>
        </div>
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
          {unread} ongelezen
        </p>
      </header>

      <section className="px-9 pb-12">
        <BlurFade delay={0.05}>
          <ul className="space-y-2">
            {rows.map((row, i) => {
              const meta = typeMeta[row.type];
              return (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={[
                    "spin-card-light relative p-5 cursor-pointer hover:bg-[var(--color-supporting-dark)]/4 transition-colors",
                    row.unread
                      ? "border-l-[3px]"
                      : "border-l-[3px] border-transparent opacity-95",
                  ].join(" ")}
                  style={
                    row.unread ? { borderLeftColor: meta.accent } : undefined
                  }
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={[
                          "font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase",
                          meta.cls,
                        ].join(" ")}
                      >
                        {meta.label}
                      </span>
                      <span className="font-[family-name:var(--font-display)] text-[16px] text-[var(--color-main-dark)] truncate">
                        {row.who}
                      </span>
                      {row.reference && (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--color-supporting-dark)]/55 spin-tnum">
                          {row.reference}
                        </span>
                      )}
                    </div>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/70 shrink-0 spin-tnum">
                      {relativeFromNow(row.at, MOCK_NOW)} · {formatClock(row.at)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-main-dark)] leading-snug">
                    {row.subject}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-dark)]/75 leading-relaxed">
                    {row.body}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        </BlurFade>
      </section>
    </div>
  );
}
