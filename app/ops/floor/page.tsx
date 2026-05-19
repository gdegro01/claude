export default function FloorPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl">
        <h1 className="text-3xl">Plattegrond</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Architecturale top-down view van de ruimte. Pool · dining · listening bar —
          tafels voelen als echte objecten, niet als UI-cards.
        </p>

        <div className="mt-8 border border-[var(--color-supporting-neutral)]/20 aspect-[4/3] flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)]">
              Plattegrond-visualisatie
            </p>
            <p className="mt-2 text-xs text-[var(--color-supporting-neutral)]/60">
              Pool · dining · bar — ruimtelijk geloofwaardig
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 text-xs text-[var(--color-supporting-neutral)]">
          {[
            { label: "Beschikbaar", color: "var(--color-supporting-neutral)" },
            { label: "Gereserveerd", color: "var(--color-accent-purple)" },
            { label: "Actief", color: "var(--color-main-dark)" },
            { label: "Overtijd", color: "var(--color-accent-orange)" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, opacity: 0.7 }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
