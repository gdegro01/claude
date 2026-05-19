import Link from "next/link";

const demos = [
  {
    slug: "waitlist-claim",
    title: "Waitlist claim",
    description: "Notificatie → fullscreen → countdown → claim → dashboard reordert live.",
    index: "01",
  },
  {
    slug: "dashboard-live",
    title: "Live dashboard",
    description: "Vloeiende layout-animaties, natuurlijke reorders, geen harde refreshes.",
    index: "02",
  },
  {
    slug: "floor-plan",
    title: "Plattegrond",
    description: "Architecturale top-down view — ruimtelijk geloofwaardig, geen UI-cards.",
    index: "03",
  },
  {
    slug: "bar-seating",
    title: "Bar seating",
    description: "Horizontale counter met radial occupancy rings per stoel.",
    index: "04",
  },
];

export default function DemoIndex() {
  return (
    <main className="min-h-screen flex flex-col px-10 pt-20 pb-10">
      <div>
        <h1 className="text-3xl">Demo-momenten</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)]">
          Losstaande hero-momenten voor de pitch
        </p>
      </div>

      <ul className="mt-12 grid sm:grid-cols-2 gap-3 max-w-2xl">
        {demos.map(({ slug, title, description, index }) => (
          <li key={slug}>
            <Link
              href={`/demo/${slug}`}
              className="group block border border-[var(--color-supporting-neutral)]/20 p-6 hover:border-[var(--color-accent-purple)]/60 transition-colors"
            >
              <span className="text-xs text-[var(--color-supporting-neutral)] font-display">{index}</span>
              <div className="mt-3 text-lg group-hover:text-[var(--color-main-light)] transition-colors">{title}</div>
              <div className="mt-2 text-sm text-[var(--color-supporting-neutral)]">{description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
