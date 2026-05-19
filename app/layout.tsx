import type { Metadata, Viewport } from "next";
import { fontDisplay, fontMono, fontScript } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPIN. — Reserveer je tafel",
  description:
    "Pool · dining · listening bar · cocktails. Reserveer in seconden, annuleer tot 48 uur van tevoren.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#261C0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${fontDisplay.variable} ${fontMono.variable} ${fontScript.variable}`}>
      <body>{children}</body>
    </html>
  );
}
