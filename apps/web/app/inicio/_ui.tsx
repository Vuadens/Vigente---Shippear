import type { ReactNode } from "react";

// Las tres primitivas que se repiten en la landing (ADR-0007). Nada de esto es
// cliente: la página entera es HTML estático.

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
    <section className={hondo ? "bg-papel-hondo" : undefined}>
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {volanta && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tenue">{volanta}</p>
        )}
        {titulo && (
          <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight md:text-4xl">
            {titulo}
          </h2>
        )}
        <div className={titulo || volanta ? "mt-10" : undefined}>{children}</div>
      </div>
    </section>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-borde bg-papel p-6">{children}</div>
  );
}

export function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <p className="font-display text-4xl text-tinta md:text-5xl">{valor}</p>
      <p className="mt-2 text-sm leading-relaxed text-tenue">{etiqueta}</p>
    </div>
  );
}
