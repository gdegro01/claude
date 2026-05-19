import Link from "next/link";

const demos = [
  { slug: "waitlist-claim", title: "Waitlist claim", description: "Notificatie → fullscreen → countdown → claim → dashboard reordert live." },
  { slug: "dashboard", title: "Live dashboard", description: "Vloeiende layout-animaties, natuurlijke reorders, geen harde refreshes." },
  { slug: "floorplan", title: "Plattegrond", description: "Architecturale top-down view — geen UI-cards." },
  { slug: "bar-seating", title: "Bar seating", description: "Horizontale counter met radial occupancy rings." },
];

export default function DemoIndex() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl">Demo-momenten</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)]">
        Losstaande hero-momenten voor de pitch
      </p>
      <ul className="mt-10 grid gap-3 max-w-2xl">
        {demos.map((demo) => (
          <li key={demo.slug}>
            <Link
              href={`/demo/${demo.slug}` as any}
              className="block border border-[var(--color-supporting-neutral)]/30 p-5 hover:border-[var(--color-accent-purple)] transition-colors"
            >
              <div className="text-lg">{demo.title}</div>
              <div className="mt-1 text-sm text-[var(--color-supporting-neutral)]">{demo.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
