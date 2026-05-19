import Link from "next/link";

export default function DepositPage() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-3">
          Stap 5 van 6
        </p>
        <h1 className="text-4xl leading-tight">
          Aanbetaling
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed">
          Een aanbetaling van € 25 per persoon reserveert je tafel definitief.
          Bij annulering tot 24 uur van tevoren volledig teruggestort.
        </p>

        <div className="mt-8 space-y-3">
          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Reserveringsoverzicht
            </p>
            <div className="space-y-2 text-sm">
              {[
                ["Datum", "wo 21 mei · 20:00"],
                ["Gasten", "2 personen"],
                ["Activiteit", "Pool"],
                ["Pakket", "Welkomstpakket · € 45"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[var(--color-supporting-neutral)]">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-[var(--color-supporting-neutral)]/20 flex justify-between">
                <span className="text-[var(--color-supporting-neutral)]">Aanbetaling</span>
                <span className="font-display text-[var(--color-accent-orange)]">€ 50</span>
              </div>
            </div>
          </div>

          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-2">
              Betaalmethode
            </p>
            <div className="text-sm text-[var(--color-supporting-neutral)]/50 italic">
              iDEAL · creditcard · Apple Pay
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          href="/book/contact"
          className="flex-1 py-4 text-center border border-[var(--color-supporting-neutral)]/30 text-sm uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)]"
        >
          Terug
        </Link>
        <Link
          href="/book/confirmed"
          className="flex-[2] py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
        >
          Betaal & bevestig
        </Link>
      </div>
    </div>
  );
}
