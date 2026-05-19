# Fonts

Zodra de echte font-files er zijn, plaats ze hier:

```
public/fonts/
  Parabolica-Bold.woff2
  Parabolica-SemiBold.woff2
  FragmentMono-Regular.woff2
```

En vervang `lib/fonts.ts` placeholders door echte `next/font/local`-config:

```ts
import localFont from "next/font/local";

export const parabolica = localFont({
  src: [
    { path: "../public/fonts/Parabolica-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Parabolica-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-parabolica",
  display: "swap",
});

export const fragmentMono = localFont({
  src: [
    { path: "../public/fonts/FragmentMono-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-fragment-mono",
  display: "swap",
});
```

En in `app/layout.tsx` op `<html>` `className={`${parabolica.variable} ${fragmentMono.variable}`}`.

Tot die tijd valt de typografie terug op systeem `ui-serif` / `ui-monospace` —
visueel niet juist, maar tokens werken al.

## Licentie
Check licenties voor Parabolica en Fragment Mono voor commerciële/web-embed.
Niet committen als de licentie redistributie verbiedt; gebruik dan `.gitignore` voor `public/fonts/*.woff2`
en deel intern via een separaat kanaal.
