export default function SettingsPage() {
  const sections = [
    {
      title: "Beschikbaarheid",
      items: ["Openingstijden", "Capaciteit per zone", "Blokkeringsdata"],
    },
    {
      title: "Aanbetaling",
      items: ["Bedrag per persoon", "Annuleringsbeleid", "Betaalprovider"],
    },
    {
      title: "Wachtlijst",
      items: ["Claimtijd (standaard 5 min)", "Notificatiemethode", "Prioriteitsregels"],
    },
    {
      title: "Communicatie",
      items: ["Bevestigingsmail", "Herinneringstiming", "Late-arrival drempel"],
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl">Instellingen</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Venue-configuratie · beschikbaarheid · aanbetaling · notificaties.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map(({ title, items }) => (
            <div key={title} className="border border-[var(--color-supporting-neutral)]/20 p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-4">
                {title}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-supporting-neutral)]/10 last:border-0"
                  >
                    <span className="text-sm">{item}</span>
                    <span className="text-xs text-[var(--color-supporting-neutral)]">Bewerken →</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
