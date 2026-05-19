export default function FloorPlanDemo() {
  const zones = [
    {
      id: "pool",
      label: "Pool",
      tables: [
        { n: "P1", x: 60, y: 80, state: "active" },
        { n: "P2", x: 180, y: 80, state: "soon" },
        { n: "P3", x: 60, y: 200, state: "overtime" },
        { n: "P4", x: 180, y: 200, state: "available" },
      ],
    },
    {
      id: "dining",
      label: "Dining",
      tables: [
        { n: "D1", x: 360, y: 80, state: "active" },
        { n: "D2", x: 460, y: 80, state: "active" },
        { n: "D3", x: 360, y: 180, state: "available" },
        { n: "D4", x: 460, y: 180, state: "pending" },
      ],
    },
  ];

  const stateColor: Record<string, string> = {
    available: "var(--color-supporting-neutral)",
    active: "var(--color-main-light)",
    soon: "var(--color-accent-purple)",
    overtime: "var(--color-accent-orange)",
    pending: "var(--color-supporting-neutral)",
  };

  return (
    <div className="min-h-screen flex flex-col px-10 pt-20 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-6">
        Demo — Plattegrond
      </p>

      <h1 className="text-4xl">Plattegrond</h1>
      <p className="mt-3 text-sm text-[var(--color-supporting-neutral)] max-w-md">
        Architecturale top-down view. Tafels voelen als echte objecten in de ruimte —
        circulatieroutes gesuggereerd, geen UI-cards.
      </p>

      <div className="mt-10">
        <svg
          viewBox="0 0 600 320"
          className="w-full max-w-2xl border border-[var(--color-supporting-neutral)]/15"
          style={{ background: "rgba(38,28,13,0.6)" }}
        >
          {zones.map((zone) =>
            zone.tables.map(({ n, x, y, state }) => (
              <g key={n}>
                <rect
                  x={x - 28}
                  y={y - 28}
                  width="56"
                  height="56"
                  fill="none"
                  stroke={stateColor[state]}
                  strokeWidth="1"
                  opacity={state === "available" ? 0.3 : 0.7}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={stateColor[state]}
                  fontSize="10"
                  opacity={state === "available" ? 0.4 : 0.8}
                  fontFamily="var(--font-mono)"
                >
                  {n}
                </text>
              </g>
            ))
          )}

          <line x1="280" y1="20" x2="280" y2="300" stroke="var(--color-supporting-neutral)" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 4" />

          <text x="120" y="290" textAnchor="middle" fill="var(--color-supporting-neutral)" fontSize="9" opacity="0.4" fontFamily="var(--font-mono)">
            POOL
          </text>
          <text x="410" y="290" textAnchor="middle" fill="var(--color-supporting-neutral)" fontSize="9" opacity="0.4" fontFamily="var(--font-mono)">
            DINING
          </text>
        </svg>

        <div className="mt-4 flex gap-4 text-xs text-[var(--color-supporting-neutral)]">
          {[
            { label: "Beschikbaar", color: "var(--color-supporting-neutral)", op: "0.4" },
            { label: "Binnenkort", color: "var(--color-accent-purple)", op: "1" },
            { label: "Actief", color: "var(--color-main-light)", op: "0.8" },
            { label: "Overtijd", color: "var(--color-accent-orange)", op: "1" },
          ].map(({ label, color, op }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2" style={{ background: color, opacity: Number(op) }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
