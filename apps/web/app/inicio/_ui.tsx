import type { ReactNode } from "react";

// Las tres primitivas que se repiten en la landing (ADR-0007). Estilos en
// globals.css, sección "Landing de pitch": mismo sistema que el resto de la app.

export function Seccion({
  titulo,
  volanta,
  children,
  hondo = false,
}: {
  titulo?: string;
  volanta?: string;
  children: ReactNode;
  hondo?: boolean;
}) {
  return (
    <section className={hondo ? "landing-seccion hondo" : "landing-seccion"}>
      {volanta && <p className="landing-volanta">{volanta}</p>}
      {titulo && <h2 className="landing-h2">{titulo}</h2>}
      <div className={titulo || volanta ? "landing-cuerpo" : undefined}>{children}</div>
    </section>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return <div className="landing-tarjeta">{children}</div>;
}

export function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <p className="landing-dato-valor">{valor}</p>
      <p className="landing-dato-label">{etiqueta}</p>
    </div>
  );
}
