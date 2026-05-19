export default function CheckinPage() {
  return (
    <div className="p-8">
      <div className="max-w-xl">
        <h1 className="text-3xl">Check-in</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Scan de QR-code uit de bevestigingsmail voor directe check-in.
          Reservering wordt live in het dashboard bijgewerkt.
        </p>

        <div className="mt-10 flex flex-col items-center">
          <div className="w-56 h-56 border-2 border-[var(--color-supporting-neutral)]/30 flex items-center justify-center">
            <div className="w-40 h-40 border border-[var(--color-supporting-neutral)]/20 flex items-center justify-center">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-supporting-neutral)] text-center">
                QR-scanner<br />placeholder
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-[var(--color-supporting-neutral)] uppercase tracking-[0.15em]">
            Of zoek op naam of referentie
          </p>

          <div className="mt-4 w-full border border-[var(--color-supporting-neutral)]/30 p-4">
            <p className="text-sm text-[var(--color-supporting-neutral)]/50 italic">
              Naam of SP-referentienummer
            </p>
          </div>

          <div className="mt-8 w-full border border-[var(--color-supporting-neutral)]/20 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-supporting-neutral)] mb-3">
              Verwacht · komende 30 minuten
            </p>
            {[
              { ref: "SP-2405-0041", name: "Jansen", time: "20:30", guests: 3 },
              { ref: "SP-2405-0042", name: "Smit", time: "21:00", guests: 2 },
            ].map(({ ref, name, time, guests }) => (
              <div key={ref} className="flex items-center justify-between py-2.5 border-b border-[var(--color-supporting-neutral)]/10 last:border-0">
                <div>
                  <span className="text-sm">{name}</span>
                  <span className="ml-2 text-xs text-[var(--color-supporting-neutral)]">{guests} pers.</span>
                </div>
                <span className="font-display text-sm">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
