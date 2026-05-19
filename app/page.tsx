import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-6xl tracking-tight">SPIN.</h1>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)]">
          Reserveringssysteem — prototype
        </p>
      </div>
      <nav className="flex flex-col sm:flex-row gap-4 text-sm">
        <Link
          href="/book"
          className="px-5 py-3 border border-[var(--color-supporting-neutral)] hover:border-[var(--color-accent-purple)] transition-colors"
        >
          Gast-flow →
        </Link>
        <Link
          href="/ops"
          className="px-5 py-3 border border-[var(--color-supporting-neutral)] hover:border-[var(--color-accent-purple)] transition-colors"
        >
          Operator →
        </Link>
        <Link
          href="/demo"
          className="px-5 py-3 border border-[var(--color-supporting-neutral)] hover:border-[var(--color-accent-purple)] transition-colors"
        >
          Demo-momenten →
        </Link>
      </nav>
    </main>
  );
}
