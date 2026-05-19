export default function ReservationsPage() {
  const reservations = [
    { ref: "SP-2405-0038", name: "Verhoeven", guests: 2, activity: "Pool", time: "19:00", status: "Ingecheckt · 1u 04m", state: "active" },
    { ref: "SP-2405-0039", name: "Bakker", guests: 4, activity: "Dining", time: "19:30", status: "Ingecheckt · 34m", state: "active" },
    { ref: "SP-2405-0040", name: "De Vries", guests: 2, activity: "Bar", time: "20:00", status: "Start over · 18m", state: "soon" },
    { ref: "SP-2405-0041", name: "Jansen", guests: 3, activity: "Pool", time: "20:30", status: "Verwacht", state: "pending" },
    { ref: "SP-2405-0042", name: "Smit", guests: 2, activity: "Dining", time: "21:00", status: "Bevestigd", state: "confirmed" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        <h1 className="text-3xl">Reserveringen</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Overzicht van alle reserveringen voor deze avond. Klik voor details,
          communicatiegeschiedenis en operationele acties.
        </p>

        <div className="mt-8 border border-[var(--color-supporting-neutral)]/20">
          <div className="grid grid-cols-[1fr_1.5fr_0.5fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 border-b border-[var(--color-supporting-neutral)]/20 text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)]">
            <span>Ref</span>
            <span>Gast</span>
            <span>Pers.</span>
            <span>Activiteit</span>
            <span>Tijd</span>
            <span>Status</span>
          </div>
          {reservations.map(({ ref, name, guests, activity, time, status, state }) => (
            <div
              key={ref}
              className="grid grid-cols-[1fr_1.5fr_0.5fr_1fr_1fr_1.5fr] gap-4 px-5 py-4 border-b border-[var(--color-supporting-neutral)]/10 last:border-0 text-sm hover:bg-[var(--color-supporting-neutral)]/5 transition-colors cursor-pointer"
            >
              <span className="text-xs text-[var(--color-supporting-neutral)] font-mono">{ref}</span>
              <span>{name}</span>
              <span className="text-[var(--color-supporting-neutral)]">{guests}</span>
              <span className="text-[var(--color-supporting-neutral)]">{activity}</span>
              <span className="font-display">{time}</span>
              <span
                className={[
                  "text-xs",
                  state === "active"
                    ? "text-[var(--color-main-dark)]"
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
