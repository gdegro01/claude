export default function InboxPage() {
  const messages = [
    { type: "late-arrival", name: "De Vries", meta: "3 min geleden", text: "Laat weten 20 min later te arriveren. Tafel 18:00.", unread: true },
    { type: "birthday", name: "Bakker", meta: "12 min geleden", text: "Verjaardagsverzoek: verrassing voor 4 personen dining.", unread: true },
    { type: "system", name: "Systeem", meta: "24 min geleden", text: "Reservering SP-2405-0036 geannuleerd. Wachtlijst genotificeerd.", unread: false },
    { type: "guest", name: "Jansen", meta: "1u geleden", text: "Vraag over parkeren bij het venue.", unread: false },
    { type: "warning", name: "Systeem", meta: "2u geleden", text: "Dubbele reserveringspoging vanuit hetzelfde account — geflagged.", unread: false },
  ];

  const typeColor: Record<string, string> = {
    "late-arrival": "var(--color-accent-orange)",
    "birthday": "var(--color-accent-purple)",
    "system": "var(--color-supporting-neutral)",
    "guest": "var(--color-main-dark)",
    "warning": "var(--color-error-critical)",
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl">Inbox</h1>
        <p className="mt-2 text-sm text-[var(--color-supporting-neutral)]">
          Gastberichten · late-arrival meldingen · operationele notities.
          Geen e-mailsoftware — hospitality communicatie.
        </p>

        <div className="mt-8 space-y-1">
          {messages.map(({ type, name, meta, text, unread }) => (
            <div
              key={`${name}-${meta}`}
              className={[
                "flex gap-4 p-4 border border-[var(--color-supporting-neutral)]/20 hover:bg-[var(--color-supporting-neutral)]/5 transition-colors cursor-pointer",
                unread ? "border-l-2" : "",
              ].join(" ")}
              style={unread ? { borderLeftColor: typeColor[type] } : undefined}
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: typeColor[type], opacity: unread ? 1 : 0.3 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-[var(--color-supporting-neutral)] shrink-0">{meta}</span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--color-supporting-neutral)] truncate">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
