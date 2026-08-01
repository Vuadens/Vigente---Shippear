import type { ReactNode } from "react";

export const metadata = { title: "Vigente" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui", margin: "2rem auto", maxWidth: 720 }}>
        {children}
      </body>
    </html>
  );
}
