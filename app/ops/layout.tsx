"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: "/ops" | "/ops/floor" | "/ops/reservations" | "/ops/waitlist" | "/ops/inbox" | "/ops/checkin" | "/ops/settings"; label: string; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/ops", label: "Live", exact: true },
  { href: "/ops/floor", label: "Plattegrond" },
  { href: "/ops/reservations", label: "Reserveringen" },
  { href: "/ops/waitlist", label: "Wachtlijst" },
  { href: "/ops/inbox", label: "Inbox" },
  { href: "/ops/checkin", label: "Check-in" },
  { href: "/ops/settings", label: "Instellingen" },
];

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-main-light)] text-[var(--color-main-dark)] flex flex-col">
      <header className="h-12 border-b border-[var(--color-supporting-neutral)]/20 flex items-center justify-between px-6 shrink-0">
        <Link href="/" className="text-sm tracking-[0.2em] uppercase font-display">
          SPIN.
        </Link>
        <span className="text-xs text-[var(--color-supporting-neutral)] uppercase tracking-[0.15em]">
          Avond · do 19 mei
        </span>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-44 shrink-0 border-r border-[var(--color-supporting-neutral)]/20 pt-6 pb-6 flex flex-col gap-0.5">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "px-6 py-2.5 text-sm transition-colors",
                  active
                    ? "text-[var(--color-main-dark)] bg-[var(--color-supporting-neutral)]/10 font-medium"
                    : "text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-dark)]",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
