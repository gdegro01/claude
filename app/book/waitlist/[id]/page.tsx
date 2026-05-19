import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: "demo" }, { id: "1" }, { id: "2" }];
}

export default async function WaitlistClaimPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent-purple)] mb-6">
          Plek beschikbaar
        </p>

        <h1 className="text-4xl leading-tight">
          Er is een tafel<br />vrijgekomen
        </h1>
        <p className="mt-4 text-sm text-[var(--color-supporting-neutral)] leading-relaxed max-w-xs">
          Tafel voor 4 personen · vrijdag 23 mei · 19:00.
          Claim binnen de tijd om je reservering vast te leggen.
        </p>

        <div className="mt-10 relative">
          <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--color-supporting-neutral)"
              strokeWidth="2"
              opacity="0.2"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--color-accent-purple)"
              strokeWidth="2"
              strokeDasharray="326.7"
              strokeDashoffset="81.7"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl">4:12</span>
            <span className="text-xs text-[var(--color-supporting-neutral)] mt-1">resterend</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-[var(--color-supporting-neutral)] opacity-60">
          Wachtlijst-positie {id}
        </p>

        <Link
          href="/book/confirmed"
          className="mt-10 w-full py-4 text-center bg-[var(--color-accent-orange)] text-[var(--color-main-light)] text-sm uppercase tracking-[0.15em]"
        >
          Claim tafel
        </Link>
      </div>
    </div>
  );
}
