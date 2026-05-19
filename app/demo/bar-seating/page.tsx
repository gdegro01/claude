export default function BarSeatingDemo() {
  const seats = [
    { n: 1, state: "active", duration: "1u 04m", progress: 0.78 },
    { n: 2, state: "active", duration: "47m", progress: 0.56 },
    { n: 3, state: "free", duration: "Vrij", progress: 0 },
    { n: 4, state: "arriving", duration: "Komt eraan", progress: 0 },
    { n: 5, state: "overtime", duration: "+22m", progress: 1 },
    { n: 6, state: "overtime", duration: "+8m", progress: 1 },
    { n: 7, state: "free", duration: "Vrij", progress: 0 },
    { n: 8, state: "active", duration: "12m", progress: 0.14 },
    { n: 9, state: "active", duration: "33m", progress: 0.39 },
    { n: 10, state: "free", duration: "Vrij", progress: 0 },
  ];

  const stateColor = (state: string) => {
    if (state === "overtime") return "var(--color-accent-orange)";
    if (state === "arriving") return "var(--color-accent-purple)";
    if (state === "active") return "var(--color-accent-purple)";
    return "var(--color-supporting-neutral)";
  };

  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div className="min-h-screen flex flex-col px-10 pt-20 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-6">
        Demo — Bar seating
      </p>

      <h1 className="text-4xl">Bar</h1>
      <p className="mt-3 text-sm text-[var(--color-supporting-neutral)] max-w-md">
        Horizontale counter met radial occupancy rings per stoel.
        Sessieduur direct visueel — Japanse cocktailbar meets airline seat management.
      </p>

      <div className="mt-12">
        <div className="border border-[var(--color-supporting-neutral)]/10 p-6 inline-block">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)]/50 mb-6">
            Bar counter
          </p>
          <div className="flex gap-4">
            {seats.map(({ n, state, duration, progress }) => {
              const color = stateColor(state);
              const isFree = state === "free";
              const strokeOffset = circ - progress * circ;

              return (
                <div key={n} className="flex flex-col items-center gap-2">
                  <div className="relative w-12 h-12">
                    <svg width="48" height="48" viewBox="0 0 48 48" className="rotate-[-90deg]">
                      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-supporting-neutral)" strokeWidth="1" opacity="0.15" />
                      {!isFree && progress > 0 && (
                        <circle
                          cx="24" cy="24" r={r}
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeDasharray={circ}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          opacity="0.85"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[10px] font-display"
                        style={{ color: isFree ? "var(--color-supporting-neutral)" : color, opacity: isFree ? 0.4 : 0.9 }}
                      >
                        {n}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[9px] uppercase tracking-[0.05em] text-center max-w-[48px] leading-tight"
                    style={{
                      color: isFree ? "var(--color-supporting-neutral)" : color,
                      opacity: isFree ? 0.35 : 0.75,
                    }}
                  >
                    {duration}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-px bg-[var(--color-supporting-neutral)] opacity-15" />
          <p className="mt-3 text-xs text-[var(--color-supporting-neutral)] opacity-40 uppercase tracking-[0.1em]">
            Bar · 10 zitplaatsen
          </p>
        </div>

        <div className="mt-8 flex gap-5 text-xs text-[var(--color-supporting-neutral)]">
          {[
            { label: "Actief", color: "var(--color-accent-purple)" },
            { label: "Overtijd", color: "var(--color-accent-orange)" },
            { label: "Komt eraan", color: "var(--color-accent-purple)" },
            { label: "Vrij", color: "var(--color-supporting-neutral)" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
