export default function OpsDashboard() {
  return (
    <div className="p-8">
      <div className="max-w-5xl">
        <h1 className="text-3xl">Live</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Actuele bezetting · wachtlijstdruk · aandacht-items.
          Hosts zien binnen 3 seconden wie te laat is en welke tafels actief zijn.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: "Bezetting", value: "8 / 12", sub: "tafels actief" },
            { label: "Wachtlijst", value: "6", sub: "posities" },
            { label: "Aandacht", value: "2", sub: "items" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="border border-[var(--color-supporting-neutral)]/20 p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)]">
                {label}
              </p>
              <p className="mt-2 font-display text-3xl">{value}</p>
              <p className="mt-1 text-xs text-[var(--color-supporting-neutral)]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-[var(--color-supporting-neutral)]/20 p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-4">
            Actieve reserveringen
          </p>
          <div className="space-y-3">
            {[
              { name: "Verhoeven", table: "Pool 3", status: "Speelt · 47m", state: "active" },
              { name: "Bakker", table: "Dining 1", status: "Ingecheckt · 1u 12m", state: "active" },
              { name: "De Vries", table: "Bar 5–6", status: "Overtijd · +22m", state: "overtime" },
              { name: "Jansen", table: "Pool 1", status: "Start over · 18m", state: "soon" },
            ].map(({ name, table, status, state }) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-[var(--color-supporting-neutral)]/10 last:border-0">
                <div>
                  <span className="text-sm">{name}</span>
                  <span className="ml-3 text-xs text-[var(--color-supporting-neutral)]">{table}</span>
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
    </div>
  );
}
