import { match } from "@vigente/matcher";
import { PerfilSchema, type Norma } from "@vigente/schema";
import normasEjemplo from "../../../../../data/normas.ejemplo.json";

// Capa de front (dueños: Batista + Juanma). NO implementa dominio: solo consume
// match() + vigencia() del matcher y enriquece el resultado para las vistas.
// Cuando exista data/normas.json, cambiar el import de arriba.

const normas = normasEjemplo as Norma[];

// Índice id -> etiqueta legible para explicar relaciones en el detalle.
const etiqueta = new Map(normas.map((n) => [n.id, `${n.tipo} ${n.numero}`]));

export async function POST(req: Request) {
  const body = await req.json();
  const parse = PerfilSchema.safeParse(body?.perfil);
  if (!parse.success) {
    return Response.json({ error: "perfil inválido" }, { status: 400 });
  }
  const perfil = parse.data;

  const matcheadas = match(perfil, normas);

  const items = matcheadas.map((m) => {
    // Relaciones salientes de esta norma (qué modifica / deroga / prorroga).
    const cambia = m.norma.relaciones.map((r) => ({
      tipo: r.tipo,
      norma: r.norma,
      label: etiqueta.get(r.norma) ?? r.norma,
    }));

    // Por qué te afecta: rubro y/o condiciones del perfil que matchearon.
    const porque: string[] = [];
    const { rubros, condiciones } = m.obligacion.alcanzados;
    if (rubros.length && rubros.includes(perfil.rubro)) {
      porque.push(`tu rubro es ${perfil.rubro}`);
    }
    for (const c of condiciones) {
      if (perfil.condiciones.includes(c)) porque.push(c.replace(/_/g, " "));
    }
    if (!porque.length) porque.push("aplica a todos los sujetos de tu jurisdicción");

    return {
      norma: {
        id: m.norma.id,
        jurisdiccion: m.norma.jurisdiccion,
        tipo: m.norma.tipo,
        numero: m.norma.numero,
        fecha_publicacion: m.norma.fecha_publicacion,
        url_fuente: m.norma.url_fuente,
        resumen_llano: m.norma.resumen_llano,
      },
      obligacion: {
        que_hacer: m.obligacion.que_hacer,
        si_no_cumplis: m.obligacion.si_no_cumplis,
        plazo: m.obligacion.plazo,
        confianza: m.obligacion.confianza,
      },
      vence: m.vence,
      // estado y afectada_por vienen calculados por el matcher (no recomputamos).
      estado: m.estado,
      geo: {
        tipo: m.norma.geo.tipo,
        descripcion: m.norma.geo.descripcion,
        coords: m.norma.geo.coords,
      },
      afectada_por: m.afectada_por.map((id) => ({
        id,
        label: etiqueta.get(id) ?? id,
      })),
      // Demo paso 7: la obligación anterior que ésta reemplaza (si la hay).
      // El matcher ya la resuelve; el front solo la muestra "antes → ahora".
      reemplaza_a: m.reemplaza_a
        ? {
            norma: {
              id: m.reemplaza_a.norma.id,
              tipo: m.reemplaza_a.norma.tipo,
              numero: m.reemplaza_a.norma.numero,
              fecha_publicacion: m.reemplaza_a.norma.fecha_publicacion,
            },
            obligacion: {
              que_hacer: m.reemplaza_a.obligacion.que_hacer,
              si_no_cumplis: m.reemplaza_a.obligacion.si_no_cumplis,
            },
          }
        : undefined,
      cambia,
      porque,
    };
  });

  return Response.json({ perfil, total: items.length, items });
}
