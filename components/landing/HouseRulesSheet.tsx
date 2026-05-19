"use client";

import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/Sheet";

interface HouseRulesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RULES = [
  {
    n: "01",
    title: "Aanbetaling vereist",
    body: "€15 per persoon bij boeking. Wordt verrekend met je rekening.",
  },
  {
    n: "02",
    title: "Annuleer tot 48u van tevoren",
    body: "Gratis annuleren tot 48 uur voor aanvang. Daarna vervalt de aanbetaling.",
  },
  {
    n: "03",
    title: "No-show beleid",
    body: "Bij niet verschijnen zonder annulering vervalt de volledige aanbetaling.",
  },
];

export function HouseRulesSheet({ open, onOpenChange }: HouseRulesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="!bg-[var(--color-main-light)] !text-[var(--color-main-dark)] !rounded-t-2xl px-6 pt-7 pb-9 max-w-md mx-auto"
      >
        <div className="flex items-center justify-between mb-7">
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-supporting-dark)]/70">
            Huisregels
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-supporting-dark)]/70 hover:text-[var(--color-main-dark)]"
          >
            × sluit
          </button>
        </div>

        <h2 className="text-[2.2rem] leading-[0.95] mb-7">
          Hoe het
          <br />
          werkt.
        </h2>

        <ul className="space-y-5 mb-8">
          {RULES.map(({ n, title, body }) => (
            <li key={n} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 grid place-items-center bg-[var(--color-main-dark)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em]">
                {n}
              </span>
              <div className="flex-1">
                <p className="font-[family-name:var(--font-mono)] text-sm font-semibold tracking-tight">
                  {title}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[13px] mt-1 leading-relaxed text-[var(--color-supporting-dark)]/85">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/book"
          onClick={() => onOpenChange(false)}
          className="block w-full text-center py-4 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[13px] tracking-[0.2em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
        >
          Start reservering
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="block w-full text-center mt-3 py-2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-supporting-dark)]/80 hover:text-[var(--color-main-dark)] underline-offset-4 underline"
        >
          Meer info
        </button>
      </SheetContent>
    </Sheet>
  );
}
