import Link from "next/link";

export default function BookLanding() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-3">
          Stap 1 van 6
        </p>
        <h1 className="text-4xl leading-tight">
          Wanneer<br />kom je?
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed">
          Kies een datum en tijdslot. Beschikbaarheid varieert per avond —<br />
          populaire slots vullen snel.
        </p>

        <div className="mt-8 space-y-3">
          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Dag-selector
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["ma 19", "di 20", "wo 21", "do 22", "vr 23", "za 24", "zo 25"].map((d, i) => (
                <div
                  key={d}
                  className={[
                    "shrink-0 w-12 h-14 flex flex-col items-center justify-center text-xs border",
                    i === 2
                      ? "border-[var(--color-accent-purple)] text-[var(--color-accent-purple)]"
                      : "border-[var(--color-supporting-neutral)]/30 text-[var(--color-supporting-neutral)]",
                  ].join(" ")}
                >
                  {d.split(" ").map((p, j) => (
                    <span key={j}>{p}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Tijdslot
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { t: "17:00", s: "beschikbaar" },
                { t: "18:00", s: "beperkt" },
                { t: "19:00", s: "vol" },
                { t: "20:00", s: "beschikbaar" },
                { t: "21:00", s: "beschikbaar" },
                { t: "22:00", s: "beperkt" },
              ].map(({ t, s }) => (
                <div
                  key={t}
                  className={[
                    "py-3 text-center text-xs border",
                    s === "beperkt"
                      ? "border-[var(--color-accent-purple)]/60 text-[var(--color-accent-purple)]"
                      : s === "vol"
                      ? "border-[var(--color-error-critical)] text-[var(--color-supporting-neutral)] opacity-50"
                      : "border-[var(--color-supporting-neutral)]/30",
                  ].join(" ")}
                >
                  <div className="font-display">{t}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--color-supporting-neutral)]">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/book/guests"
        className="mt-6 block w-full py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
      >
        Volgende
      </Link>
    </div>
  );
}
