import type { Norma, Obligacion, Perfil } from "@vigente/schema";

// Función pura (perfil, normas) → obligaciones ordenadas por vencimiento.
// Sin LLM, sin I/O. Dueño: Valentino.

export type EstadoNorma = "vigente" | "modificada" | "derogada";

export interface ObligacionMatcheada {
  norma: Norma;
  obligacion: Obligacion;
  /** fecha límite ISO, o null si es permanente */
  vence: string | null;
  estado: EstadoNorma;
  /** ids de normas vigentes que la modifican/prorrogan */
  afectada_por: string[];
  /** obligación anterior que esta reemplaza (demo paso 7: "qué cambió") */
  reemplaza_a?: { norma: Norma; obligacion: Obligacion };
}

export interface EstadoVigencia {
  estado: EstadoNorma;
  /** ids de normas que la afectan (modifica/deroga/prorroga) */
  afectada_por: string[];
}

/** Grafo mínimo de vigencia: derogada > modificada > vigente. Prórroga no cambia el estado. */
export function vigencia(norma: Norma, todas: Norma[]): EstadoVigencia {
  const afectada_por: string[] = [];
  let estado: EstadoNorma = "vigente";
  for (const n of todas) {
    for (const r of n.relaciones) {
      if (r.norma !== norma.id) continue;
      afectada_por.push(n.id);
      if (r.tipo === "deroga") estado = "derogada";
      else if (r.tipo === "modifica" && estado !== "derogada") estado = "modificada";
    }
  }
  return { estado, afectada_por };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const CIUDAD_DEFAULT = "rosario";

function ciudadDelPerfil(perfil: Perfil): string {
  // La ciudad se deriva de la dirección normalizada; sin dirección, Rosario.
  const dir = norm(perfil.ubicacion.direccion);
  return dir === "" ? CIUDAD_DEFAULT : dir;
}

/** Regla geo (CONTEXT.md): matching por etiquetas, nunca por coordenadas. */
function aplicaGeo(norma: Norma, perfil: Perfil): boolean {
  switch (norma.geo.tipo) {
    case "ciudad": {
      // Nacional/provincial con alcance territorial amplio aplican siempre.
      if (norma.jurisdiccion !== "municipal") return true;
      const ciudad = norm(norma.geo.descripcion);
      return ciudadDelPerfil(perfil).includes(ciudad) || ciudad === "";
    }
    case "zona": {
      // Solo si el perfil declara la zona (en condiciones o en la dirección).
      const zona = norm(norma.geo.descripcion);
      return (
        perfil.condiciones.some((c) => norm(c).includes(zona)) ||
        (zona !== "" && norm(perfil.ubicacion.direccion).includes(zona))
      );
    }
    // punto/tramo solo van al mapa, nunca al matching.
    default:
      return false;
  }
}

function aplicaAlcance(o: Obligacion, perfil: Perfil): boolean {
  const rubro = norm(perfil.rubro);
  const porRubro =
    o.alcanzados.rubros.length === 0 || o.alcanzados.rubros.some((r) => norm(r) === rubro);
  const condiciones = perfil.condiciones.map(norm);
  const porCondicion =
    o.alcanzados.condiciones.length === 0 ||
    o.alcanzados.condiciones.some((c) => condiciones.includes(norm(c)));
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
  const porId = new Map(normas.map((n) => [n.id, n]));
  const resultado: ObligacionMatcheada[] = [];
  // Normas modificadas cuyas obligaciones fueron reemplazadas por una posterior
  // que alcanza al mismo perfil: se excluyen y la nueva expone reemplaza_a.
  const reemplazadas = new Map<string, Norma>(); // id vieja → norma nueva

  for (const norma of normas) {
    const v = vigencia(norma, normas);
    if (v.estado === "derogada") continue;
    if (!aplicaGeo(norma, perfil)) continue;
    if (!norma.obligaciones.some((o) => aplicaAlcance(o, perfil))) continue;
    for (const r of norma.relaciones) {
      if (r.tipo !== "modifica") continue;
      const vieja = porId.get(r.norma);
      if (vieja && vieja.fecha_publicacion < norma.fecha_publicacion) {
        reemplazadas.set(vieja.id, norma);
      }
    }
  }

  for (const norma of normas) {
    const v = vigencia(norma, normas);
    if (v.estado === "derogada") continue;
    if (reemplazadas.has(norma.id)) continue;
    if (!aplicaGeo(norma, perfil)) continue;
    for (const obligacion of norma.obligaciones) {
      if (!aplicaAlcance(obligacion, perfil)) continue;
      const nuevaSobre = [...reemplazadas.entries()].find(([, n]) => n.id === norma.id);
      const vieja = nuevaSobre ? porId.get(nuevaSobre[0]) : undefined;
      const obligacionVieja = vieja?.obligaciones.find((o) => aplicaAlcance(o, perfil));
      resultado.push({
        norma,
        obligacion,
        vence: fechaVencimiento(norma, obligacion),
        estado: v.estado,
        afectada_por: v.afectada_por,
        ...(vieja && obligacionVieja
          ? { reemplaza_a: { norma: vieja, obligacion: obligacionVieja } }
          : {}),
      });
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
