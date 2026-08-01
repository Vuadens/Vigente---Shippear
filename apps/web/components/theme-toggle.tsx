"use client";

import { useEffect, useState } from "react";

// Alterna light/dark y persiste la preferencia. El tema inicial ya lo aplica
// el script inline del layout, así que acá solo sincronizamos el estado visual.
export function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const actual = document.documentElement.getAttribute("data-theme");
    setTema(actual === "dark" ? "dark" : "light");
  }, []);

  function alternar() {
    const next = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("vigente-theme", next);
    } catch {
      // localStorage puede fallar en modo privado; el toggle igual funciona.
    }
    setTema(next);
  }

  const esOscuro = tema === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternar}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={esOscuro ? "Modo claro" : "Modo oscuro"}
    >
      {esOscuro ? (
        // Sol
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Luna
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
