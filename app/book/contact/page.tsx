import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] mb-3">
          Stap 4 van 6
        </p>
        <h1 className="text-4xl leading-tight">
          Contactgegevens
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed">
          Enkel voor bevestiging en late-arrival berichten. We sturen geen ongewenste communicatie.
        </p>

        <div className="mt-8 space-y-3">
          {[
            { label: "Naam", placeholder: "Voornaam + achternaam" },
            { label: "E-mail", placeholder: "voor de bevestiging" },
            { label: "Telefoon", placeholder: "voor check-in en updates" },
          ].map((f) => (
            <div key={f.label} className="border border-[var(--color-supporting-neutral)]/20 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-2">
                {f.label}
              </p>
              <div className="text-sm text-[var(--color-supporting-neutral)]/50 italic">
                {f.placeholder}
              </div>
            </div>
          ))}

          <div className="border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-2">
              Voorkeuren & opmerkingen
            </p>
            <div className="text-sm text-[var(--color-supporting-neutral)]/50 italic">
              Verjaardag · dieetwensen · overig
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          href="/book/extras"
          className="flex-1 py-4 text-center border border-[var(--color-supporting-neutral)]/30 text-sm uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)]"
        >
          Terug
        </Link>
        <Link
          href="/book/deposit"
          className="flex-[2] py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
        >
          Volgende
        </Link>
      </div>
    </div>
  );
}
