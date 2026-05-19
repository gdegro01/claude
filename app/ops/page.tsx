export default function OpsLanding() {
  return (
    <main className="min-h-screen p-10 bg-[var(--color-main-light)] text-[var(--color-main-dark)]">
      <header>
        <h1 className="text-3xl">Operator</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-supporting-neutral)]">
          Desktop/tablet · rustig · scanbaar · ops-geloofwaardig
        </p>
      </header>
      <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Dashboard</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Plattegrond</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Reserveringen</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Wachtlijst</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Inbox</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">Instellingen</li>
        <li className="border border-[var(--color-supporting-neutral)]/30 p-5">QR Check-in</li>
      </ul>
    </main>
  );
}
