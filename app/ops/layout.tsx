"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { SpinMark } from "@/components/brand/SpinMark";
import { getResolvedWaitlist, getAttentionItems } from "@/lib/queries";

type NavHref =
  | "/ops"
  | "/ops/floor"
  | "/ops/reservations"
  | "/ops/waitlist"
  | "/ops/inbox"
  | "/ops/checkin"
  | "/ops/settings";

interface NavItem {
  href: NavHref;
  label: string;
  exact?: boolean;
  badgeKey?: "waitlist" | "inbox";
  section: "main" | "manage";
}

const NAV: NavItem[] = [
  { href: "/ops", label: "Dashboard", exact: true, section: "main" },
  { href: "/ops/floor", label: "Plattegrond", section: "main" },
  { href: "/ops/reservations", label: "Reserveringen", section: "main" },
  { href: "/ops/waitlist", label: "Wachtlijst", badgeKey: "waitlist", section: "main" },
  { href: "/ops/inbox", label: "Inbox", badgeKey: "inbox", section: "main" },
  { href: "/ops/settings", label: "Instellingen", section: "manage" },
];

function NavLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      className="relative group block"
    >
      {active && (
        <motion.span
          layoutId="ops-nav-active"
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-accent-orange)]"
          transition={{ type: "spring", stiffness: 400, damping: 36 }}
        />
      )}
      <span
        className={[
          "flex items-center justify-between pl-6 pr-5 py-2.5 transition-colors",
          "font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase",
          active
            ? "text-[var(--color-main-light)] bg-[var(--color-supporting-dark)]/35"
            : "text-[var(--color-main-light)]/55 hover:text-[var(--color-main-light)] hover:bg-[var(--color-supporting-dark)]/15",
        ].join(" ")}
      >
        <span className="flex items-center gap-3">
          <span
            className={[
              "w-1.5 h-1.5 rotate-45 transition-colors",
              active
                ? "bg-[var(--color-accent-orange)]"
                : "bg-[var(--color-main-light)]/25 group-hover:bg-[var(--color-main-light)]/60",
            ].join(" ")}
          />
          {item.label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className={[
              "min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center",
              "font-[family-name:var(--font-mono)] text-[10px] spin-tnum",
              item.badgeKey === "waitlist"
                ? "bg-[var(--color-accent-purple)] text-[var(--color-main-light)]"
                : "bg-[var(--color-accent-orange)] text-[var(--color-main-light)]",
            ].join(" ")}
          >
            {badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const waitlistBadge = getResolvedWaitlist().length;
  const inboxBadge = getAttentionItems().length;

  const mainItems = NAV.filter((n) => n.section === "main");
  const manageItems = NAV.filter((n) => n.section === "manage");

  return (
    <div className="min-h-screen bg-[var(--color-main-light)] text-[var(--color-main-dark)] flex">
      <aside className="w-[244px] shrink-0 bg-[var(--color-main-dark)] text-[var(--color-main-light)] flex flex-col relative spin-grain">
        <div className="px-6 pt-7 pb-9">
          <Link href="/" className="block">
            <SpinMark size="lg" className="text-[var(--color-main-light)]" />
          </Link>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-main-light)]/45">
            Host dashboard
          </p>
        </div>

        <nav className="flex-1 flex flex-col">
          <p className="px-6 pb-2 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.25em] uppercase text-[var(--color-main-light)]/35">
            Navigatie
          </p>
          <div className="flex flex-col">
            {mainItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const badge =
                item.badgeKey === "waitlist"
                  ? waitlistBadge
                  : item.badgeKey === "inbox"
                  ? inboxBadge
                  : undefined;
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  active={active}
                  badge={badge}
                />
              );
            })}
          </div>

          <p className="mt-8 px-6 pb-2 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.25em] uppercase text-[var(--color-main-light)]/35">
            Beheer
          </p>
          <div className="flex flex-col">
            {manageItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname.startsWith(item.href)}
              />
            ))}
          </div>
        </nav>

        <div className="px-5 pb-5">
          <Link
            href="/ops/checkin"
            className="flex items-center justify-between w-full px-4 py-3.5 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] hover:bg-[var(--color-supporting-dark)] transition-colors"
          >
            <span>
              <span className="block font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase font-semibold">
                Check-in
              </span>
              <span className="block font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase opacity-75 mt-0.5">
                Scan QR
              </span>
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
              <rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
              <rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
              <rect x="13" y="13" width="2" height="2" fill="currentColor" />
              <rect x="13" y="16" width="2" height="1" fill="currentColor" />
              <rect x="16" y="13" width="1" height="2" fill="currentColor" />
            </svg>
          </Link>
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-[var(--color-main-light)]/8 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase">
          <p className="text-[var(--color-main-light)]/45">Do 19 mei · 20:14</p>
          <p className="mt-1 text-[var(--color-main-light)]">Avonddienst</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-[3px] bg-[var(--color-accent-orange)] shrink-0" />
        {children}
      </main>
    </div>
  );
}
