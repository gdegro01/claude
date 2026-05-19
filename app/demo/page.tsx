import Link from "next/link";
import { SpinMark } from "@/components/brand/SpinMark";

const demos = [
  {
    slug: "waitlist-claim",
    title: "Waitlist claim",
    description:
      "Notificatie → fullscreen → live countdown → claim → dashboard reordert.",
    accent: "var(--color-accent-orange)",
    index: "01",
    duration: "~25s",
  },
  {
    slug: "dashboard-live",
    title: "Live dashboard",
    description:
      "Vloeiende layout-animaties, overtijd sorteert naar boven, geen harde refreshes.",
    accent: "var(--color-accent-purple)",
    index: "02",
    duration: "~40s",
  },
  {
    slug: "floor-plan",
    title: "Plattegrond",
    description:
      "Architecturale top-down view — ruimtelijk geloofwaardig, geen UI-cards.",
    accent: "var(--color-main-light)",
    index: "03",
    duration: "~15s",
  },
  {
    slug: "bar-seating",
    title: "Bar seating",
    description:
      "Horizontale counter met radial occupancy rings per stoel — airline seat management × listening bar.",
    accent: "var(--color-accent-purple)",
    index: "04",
    duration: "~20s",
  },
];

export default function DemoIndex() {
  return (
    <main className="relative min-h-[100dvh] spin-vignette spin-grain px-6 sm:px-10 pt-20 pb-12 overflow-hidden flex flex-col">
      <header className="max-w-3xl">
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] mb-3">
          Pitch · vier hero-momenten
        </p>
        <h1 className="text-[2.6rem] sm:text-[3rem] leading-[0.98]">
          Demo-
          <br />
          <span className="spin-em text-[var(--color-accent-purple)]">
            momenten.
          </span>
        </h1>
        <p className="mt-5 max-w-md font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-supporting-neutral)] leading-relaxed">
          Vier losstaande scenes voor de pitch. Geen genavigeerde flow —
          spring direct naar het moment dat je wilt laten zien.
        </p>
      </header>

      <ul className="mt-12 grid sm:grid-cols-2 gap-3 max-w-3xl">
        {demos.map(({ slug, title, description, index, accent, duration }) => (
          <li key={slug}>
            <Link
              href={`/demo/${slug}`}
              className="group block border border-[var(--color-supporting-dark)]/40 p-6 hover:border-[var(--color-accent-purple)]/60 hover:bg-[var(--color-supporting-dark)]/15 transition-all relative overflow-hidden"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: accent }}
              />
              <div className="flex items-baseline justify-between">
                <span
                  className="font-[family-name:var(--font-display)] text-[13px] spin-tnum"
                  style={{ color: accent }}
                >
                  {index}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]">
                  {duration}
                </span>
              </div>
              <p className="mt-5 font-[family-name:var(--font-display)] text-[22px] leading-tight">
                {title}
              </p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[var(--color-supporting-neutral)]">
                {description}
              </p>
              <p className="mt-4 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] group-hover:text-[var(--color-main-light)] transition-colors">
                Open scene →
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <SpinMark
        size="ghost"
        className="pointer-events-none select-none absolute -bottom-12 right-0 text-[var(--color-supporting-dark)]/30 z-0"
      />
    </main>
  );
}
