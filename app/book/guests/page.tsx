import Link from "next/link";

const ACTIVITIES = [
  { id: "pool", label: "Pool", meta: "Biljarttafel · cocktails" },
  { id: "dining", label: "Dining", meta: "Diner · à la carte" },
  { id: "bar", label: "Listening bar", meta: "Bar-seats · cocktails · vinyl" },
];

export default function GuestsPage() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-3">
          Stap 2 van 6
        </p>
        <h1 className="text-4xl leading-tight">
          Met hoeveel<br />kom je?
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed">
          Selecteer het aantal gasten en de gewenste activiteit voor het reserveringsoverzicht.
        </p>

        <div className="mt-8 space-y-3">
          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Aantal gasten
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className={[
                    "w-10 h-10 flex items-center justify-center text-sm border",
                    n === 2
                      ? "border-[var(--color-accent-purple)] text-[var(--color-accent-purple)]"
                      : "border-[var(--color-supporting-neutral)]/30 text-[var(--color-supporting-neutral)]",
                  ].join(" ")}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Activiteit
            </p>
            <div className="space-y-2">
              {ACTIVITIES.map((a, i) => (
                <div
                  key={a.id}
                  className={[
                    "flex items-center justify-between p-3 border",
                    i === 0
                      ? "border-[var(--color-accent-purple)] text-[var(--color-main-light)]"
                      : "border-[var(--color-supporting-neutral)]/30 text-[var(--color-supporting-neutral)]",
                  ].join(" ")}
                >
                  <span className="text-sm">{a.label}</span>
                  <span className="text-xs">{a.meta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          href="/book"
          className="flex-1 py-4 text-center border border-[var(--color-supporting-neutral)]/30 text-sm uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)]"
        >
          Terug
        </Link>
        <Link
          href="/book/extras"
          className="flex-[2] py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
        >
          Volgende
        </Link>
      </div>
    </div>
  );
}
