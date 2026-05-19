"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { href: "/book", label: "1" },
  { href: "/book/guests", label: "2" },
  { href: "/book/extras", label: "3" },
  { href: "/book/contact", label: "4" },
  { href: "/book/deposit", label: "5" },
  { href: "/book/confirmed", label: "6" },
];

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = STEPS.findIndex((s) => s.href === pathname);

  return (
    <div className="min-h-screen bg-[var(--color-main-dark)] text-[var(--color-main-light)] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
        <Link href="/" className="text-sm tracking-[0.2em] uppercase">
          SPIN.
        </Link>
        <div className="flex gap-1.5">
          {STEPS.map((step, i) => (
            <span
              key={step.href}
              className={[
                "w-1.5 h-1.5 rounded-full transition-colors",
                i < currentStep
                  ? "bg-[var(--color-accent-purple)]"
                  : i === currentStep
                  ? "bg-[var(--color-main-light)]"
                  : "bg-[var(--color-supporting-neutral)]/40",
              ].join(" ")}
            />
          ))}
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
