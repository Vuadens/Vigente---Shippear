import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--fuente-sans" });
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--fuente-display",
});

const DESCRIPCION =
  "Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés. " +
  "Normativa nacional, provincial y municipal traducida a obligaciones concretas con vencimiento.";

export const metadata: Metadata = {
  title: "Vigente — la normativa que te aplica, con fecha de vencimiento",
  description: DESCRIPCION,
  openGraph: {
    title: "Vigente",
    description: DESCRIPCION,
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-papel font-sans text-tinta antialiased">{children}</body>
    </html>
  );
}
