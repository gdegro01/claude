import Link from "next/link";

const PACKAGES = [
  {
    id: "none",
    label: "Geen pakket",
    price: "—",
    meta: "Enkel à-la-carte bestellingen aan tafel",
  },
  {
    id: "welcome",
    label: "Welkomstpakket",
    price: "€ 45",
    meta: "Fles champagne · waterkaraf · amuse",
  },
  {
    id: "premium",
    label: "Premium koelkastpakket",
    price: "€ 95",
    meta: "Fles champagne · fles wijn · craft beers · snacks",
  },
  {
    id: "exclusive",
    label: "Exclusive",
    price: "€ 165",
    meta: "Alles uit premium + cocktail-tasting · curated spirits",
  },
];

export default function ExtrasPage() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-3">
          Stap 3 van 6
        </p>
        <h1 className="text-4xl leading-tight">
          Koelkast&shy;pakket
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed">
          Staat klaar bij aankomst. Kies een pakket of bestel later aan tafel.
        </p>

        <div className="mt-8 space-y-2">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.id}
              className={[
                "flex items-start justify-between p-4 border",
                i === 0
                  ? "border-[var(--color-accent-purple)] text-[var(--color-main-light)]"
                  : "border-[var(--color-supporting-neutral)]/30 text-[var(--color-supporting-neutral)]",
              ].join(" ")}
            >
              <div>
                <div className="text-sm">{pkg.label}</div>
                <div className="mt-1 text-xs opacity-70">{pkg.meta}</div>
              </div>
              <div className="text-sm shrink-0 ml-4 font-display">{pkg.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          href="/book/guests"
          className="flex-1 py-4 text-center border border-[var(--color-supporting-neutral)]/30 text-sm uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)]"
        >
          Terug
        </Link>
        <Link
          href="/book/contact"
          className="flex-[2] py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
        >
          Volgende
        </Link>
      </div>
    </div>
  );
}
