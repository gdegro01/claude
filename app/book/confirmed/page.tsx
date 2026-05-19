import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full border border-[var(--color-accent-purple)] flex items-center justify-center mb-6">
          <span className="text-[var(--color-accent-purple)] font-display text-lg">✓</span>
        </div>

        <h1 className="text-4xl leading-tight">
          Reservering<br />bevestigd
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed max-w-xs">
          Je ontvangt een bevestiging per e-mail. Tot dan — we verwachten je
          woensdag 21 mei om 20:00.
        </p>

        <div className="mt-8 w-full border border-[var(--color-supporting-neutral)]/20 p-4 text-left">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
            Referentie
          </p>
          <p className="font-display text-2xl tracking-wider text-[var(--color-accent-purple)]">
            SP-2405-0042
          </p>
          <p className="mt-1 text-xs text-[var(--color-supporting-neutral)]">
            Bewaar dit nummer voor check-in en wijzigingen.
          </p>
        </div>

        <div className="mt-6 w-full space-y-2">
          <div className="border border-[var(--color-supporting-neutral)]/20 p-4 text-sm text-[var(--color-supporting-neutral)] text-center">
            Voeg toe aan agenda
          </div>
          <div className="border border-[var(--color-supporting-neutral)]/20 p-4 text-sm text-[var(--color-supporting-neutral)] text-center">
            Deel reservering
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="mt-6 block w-full py-4 text-center border border-[var(--color-supporting-neutral)]/30 text-sm uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)]"
      >
        Terug naar begin
      </Link>
    </div>
  );
}
