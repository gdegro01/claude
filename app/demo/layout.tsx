import Link from "next/link";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-main-dark)] text-[var(--color-main-light)] flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 pt-5">
        <Link href="/demo" className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] transition-colors">
          ← Demo
        </Link>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)] transition-colors">
          SPIN.
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
