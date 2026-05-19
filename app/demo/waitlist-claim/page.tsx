export default function WaitlistClaimDemo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent-purple)] mb-6">
        Demo — Waitlist claim
      </p>

      <h1 className="text-5xl leading-tight max-w-sm">
        Er is een tafel<br />vrijgekomen
      </h1>
      <p className="mt-5 text-sm text-[var(--color-supporting-neutral)] max-w-xs leading-relaxed">
        Notificatie verschijnt — gast opent — fullscreen claim-screen met countdown —
        gast claimt — dashboard reordert live.
      </p>

      <div className="mt-14 relative">
        <svg width="160" height="160" viewBox="0 0 160 160" className="rotate-[-90deg]">
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="var(--color-supporting-neutral)"
            strokeWidth="1.5"
            opacity="0.15"
          />
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="var(--color-accent-purple)"
            strokeWidth="1.5"
            strokeDasharray="439.8"
            strokeDashoffset="109.9"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl">4:47</span>
          <span className="text-xs text-[var(--color-supporting-neutral)] mt-1 uppercase tracking-[0.1em]">resterend</span>
        </div>
      </div>

      <div className="mt-12 w-full max-w-xs">
        <div className="bg-[var(--color-accent-orange)] py-4 text-center text-sm uppercase tracking-[0.15em]">
          Claim tafel
        </div>
        <p className="mt-3 text-xs text-[var(--color-supporting-neutral)] text-center">
          Tafel voor 4 · vr 23 mei · 19:00
        </p>
      </div>
    </div>
  );
}
