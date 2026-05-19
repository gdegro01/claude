export default function WaitlistPage() {
  const positions = [
    { pos: 1, name: "Pieters", guests: 2, activity: "Pool", since: "18:34", priority: false },
    { pos: 2, name: "Van Dam", guests: 4, activity: "Dining", since: "18:51", priority: true },
    { pos: 3, name: "Hofman", guests: 2, activity: "Bar", since: "19:02", priority: false },
    { pos: 4, name: "Koster", guests: 3, activity: "Pool", since: "19:15", priority: false },
    { pos: 5, name: "Mulder", guests: 2, activity: "Dining", since: "19:28", priority: false },
  ];

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl">Wachtlijst</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Wachtlijstposities voor deze avond. Bij annulering worden gasten
          automatisch genotificeerd — zij hebben 5 minuten om te claimen.
        </p>

        <div className="mt-8 space-y-2">
          {positions.map(({ pos, name, guests, activity, since, priority }) => (
            <div
              key={pos}
              className={[
                "flex items-center justify-between p-4 border",
                priority
                  ? "border-[var(--color-accent-purple)]/60"
                  : "border-[var(--color-supporting-neutral)]/20",
              ].join(" ")}
            >
              <div className="flex items-center gap-4">
                <span
                  className={[
                    "font-display text-lg w-6 text-center",
                    priority ? "text-[var(--color-accent-purple)]" : "text-[var(--color-supporting-neutral)]",
                  ].join(" ")}
                >
                  {pos}
                </span>
                <div>
                  <p className="text-sm">{name}</p>
                  <p className="text-xs text-[var(--color-supporting-neutral)] mt-0.5">
                    {guests} pers. · {activity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-supporting-neutral)]">Gewacht sinds</p>
                <p className="text-sm font-display mt-0.5">{since}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
