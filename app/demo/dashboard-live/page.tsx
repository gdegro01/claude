export default function DashboardLiveDemo() {
  const rows = [
    { name: "Verhoeven", table: "Pool 3", status: "Speelt · 47m", state: "active" },
    { name: "De Vries", table: "Bar 5–6", status: "Overtijd · +22m", state: "overtime" },
    { name: "Bakker", table: "Dining 1", status: "Ingecheckt · 1u 12m", state: "active" },
    { name: "Jansen", table: "Pool 1", status: "Start over · 18m", state: "soon" },
    { name: "Pieters", table: "Dining 2", status: "Verwacht · 21m", state: "pending" },
  ];

  return (
    <div className="min-h-screen flex flex-col px-10 pt-20 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-6">
        Demo — Live dashboard
      </p>

      <h1 className="text-4xl">Live</h1>
      <p className="mt-3 text-sm text-[var(--color-supporting-neutral)] max-w-md">
        Reserveringen reorderen vloeiend. Geen harde refreshes — het systeem voelt
        continu levend. Hosts zien bezetting en aandacht-items binnen 3 seconden.
      </p>

      <div className="mt-10 max-w-2xl">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Actief", value: "8" },
            { label: "Wachtlijst", value: "6" },
            { label: "Aandacht", value: "2" },
          ].map(({ label, value }) => (
            <div key={label} className="border border-[var(--color-supporting-neutral)]/20 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)]">{label}</p>
              <p className="mt-1 font-display text-3xl">{value}</p>
            </div>
          ))}
        </div>

        <div className="border border-[var(--color-supporting-neutral)]/20">
          {rows.map(({ name, table, status, state }) => (
            <div
              key={name}
              className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-supporting-neutral)]/10 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      state === "overtime"
                        ? "var(--color-accent-orange)"
                        : state === "soon"
                        ? "var(--color-accent-purple)"
                        : state === "active"
                        ? "var(--color-main-light)"
                        : "var(--color-supporting-neutral)",
                    opacity: state === "pending" ? 0.4 : 0.8,
                  }}
                />
                <span className="text-sm">{name}</span>
                <span className="text-xs text-[var(--color-supporting-neutral)]">{table}</span>
              </div>
              <span
                className={[
                  "text-xs",
                  state === "overtime"
                    ? "text-[var(--color-accent-orange)]"
                    : state === "soon"
                    ? "text-[var(--color-accent-purple)]"
                    : "text-[var(--color-supporting-neutral)]",
                ].join(" ")}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
