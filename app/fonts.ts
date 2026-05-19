import { Fraunces, Fragment_Mono } from "next/font/google";

export const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-parabolica",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

export const fontMono = Fragment_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fragment-mono",
  weight: "400",
});
