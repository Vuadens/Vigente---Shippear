import type { ReactNode } from "react";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata = {
  title: "Vigente — qué normativa te aplica hoy",
  description:
    "Ingiere normativa municipal, provincial y nacional y la traduce a obligaciones concretas con vencimiento para tu perfil.",
};

export const viewport = {
  themeColor: "#0b6b66",
};

// Aplica el tema guardado antes de pintar para evitar el flash claro/oscuro.
const themeScript = `(function(){try{var t=localStorage.getItem("vigente-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
