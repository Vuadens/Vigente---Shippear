import type { Norma, Obligacion, Perfil } from "@vigente/schema";

// Función pura (perfil, normas) → obligaciones ordenadas por vencimiento.
// Sin LLM, sin I/O. Dueño: Valentino. Implementación naive inicial para
// desbloquear al front; refinar acá, la firma no cambia.

export interface ObligacionMatcheada {
  norma: Norma;
  obligacion: Obligacion;
  /** fecha límite ISO, o null si es permanente */
  vence: string | null;
}

export interface EstadoVigencia {
  vigente: boolean;
  /** id de la norma que la modifica/deroga, si existe */
  afectada_por: string[];
}

/** Grafo mínimo de vigencia: una norma referenciada por "deroga" no está vigente. */
export function vigencia(norma: Norma, todas: Norma[]): EstadoVigencia {
  const afectada_por = todas
    .filter((n) => n.relaciones.some((r) => r.norma === norma.id))
    .map((n) => n.id);
  const derogada = todas.some((n) =>
    n.relaciones.some((r) => r.norma === norma.id && r.tipo === "deroga")
  );
  return { vigente: !derogada, afectada_por };
}

function aplicaGeo(norma: Norma): boolean {
  // Regla del CONTEXT.md: ciudad y zona entran al matching; punto/tramo solo mapa.
  return norma.geo.tipo === "ciudad" || norma.geo.tipo === "zona";
}

function aplicaAlcance(o: Obligacion, perfil: Perfil): boolean {
  const porRubro =
    o.alcanzados.rubros.length === 0 || o.alcanzados.rubros.includes(perfil.rubro);
  const porCondicion =
    o.alcanzados.condiciones.length === 0 ||
    o.alcanzados.condiciones.some((c) => perfil.condiciones.includes(c));
  return porRubro && porCondicion;
}

function fechaVencimiento(norma: Norma, o: Obligacion): string | null {
  if (o.plazo.tipo === "fecha_fija") return o.plazo.valor;
  if (o.plazo.tipo === "dias_desde_publicacion") {
    const d = new Date(norma.fecha_publicacion);
    d.setDate(d.getDate() + Number(o.plazo.valor));
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export function match(perfil: Perfil, normas: Norma[]): ObligacionMatcheada[] {
  const resultado: ObligacionMatcheada[] = [];
  for (const norma of normas) {
    if (!vigencia(norma, normas).vigente) continue;
    if (!aplicaGeo(norma)) continue;
    for (const obligacion of norma.obligaciones) {
      if (!aplicaAlcance(obligacion, perfil)) continue;
      resultado.push({ norma, obligacion, vence: fechaVencimiento(norma, obligacion) });
    }
  }
  // Más urgente primero; permanentes al final.
  return resultado.sort((a, b) => {
    if (a.vence === null) return 1;
    if (b.vence === null) return -1;
    return a.vence.localeCompare(b.vence);
  });
}

/** Modo push: obligaciones matcheadas cuya norma se publicó después de `desde` (ISO). */
export function alertas(perfil: Perfil, normas: Norma[], desde: string): ObligacionMatcheada[] {
  return match(perfil, normas).filter((m) => m.norma.fecha_publicacion >= desde);
}
