import localFont from "next/font/local";
import { Allura } from "next/font/google";

export const fontDisplay = localFont({
  src: [
    {
      path: "../public/fonts/Parabolica-HairlineOblique.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/Parabolica-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Parabolica-BoldOblique.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/Parabolica-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/Parabolica-BlackOblique.otf",
      weight: "900",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-parabolica",
});

export const fontMono = localFont({
  src: [
    {
      path: "../public/fonts/FragmentMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-fragment-mono",
});

export const fontScript = Allura({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-script",
  weight: "400",
});
