import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { Relacion } from "@vigente/schema";
import { INFOLEG } from "./fuentes.js";
import { zipCacheado, textoCacheado } from "./cache.js";
import { desdeHtml } from "./texto.js";

export type FilaInfoleg = {
  id_norma: string;
  tipo_norma: string;
  numero_norma: string;
  organismo_origen: string;
  fecha_sancion: string;
  fecha_boletin: string;
  titulo_resumido: string;
  texto_resumido: string;
  texto_original: string;
  texto_actualizado: string;
};

const ABREVIATURAS: Record<string, string> = {
  ley: "ley",
  decreto: "dec",
  resolución: "res",
  resolucion: "res",
  disposición: "disp",
  disposicion: "disp",
  "decisión administrativa": "da",
  "decision administrativa": "da",
  "decreto/ley": "decley",
};

/** Id estable en el formato del contrato (README §3): `ley-20744-1974`. */
export function idNacional(tipo: string, numero: string, fecha: string): string {
  const abrev = ABREVIATURAS[tipo?.toLowerCase().trim()] ?? "norma";
  const anio = fecha?.slice(0, 4) || "s-f";
  return `${abrev}-${(numero || "sn").replace(/\D/g, "") || "sn"}-${anio}`;
}

/** Recorre la base grande (254 MB) en streaming y devuelve solo las filas pedidas. */
export async function buscarNormas(ids: Set<string>): Promise<Map<string, FilaInfoleg>> {
  const ruta = await zipCacheado(INFOLEG.baseZip, "infoleg-nacional.csv");
  const encontradas = new Map<string, FilaInfoleg>();

  const lector = createReadStream(ruta).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_quotes: true, bom: true }),
  );
  for await (const fila of lector as AsyncIterable<FilaInfoleg>) {
    if (ids.has(fila.id_norma) && !encontradas.has(fila.id_norma)) {
      encontradas.set(fila.id_norma, fila);
      if (encontradas.size === ids.size) break;
    }
  }
  return encontradas;
}

/**
 * Aristas SALIENTES ("esta norma modifica a aquella") desde la base
 * complementaria oficial. Determinístico: el LLM no toca las relaciones
 * nacionales (ADR-0006).
 *
 * Verificado sobre 400 filas: en esta base la metadata (tipo_norma, nro_norma,
 * fecha_boletin) describe a `id_norma_modificada` — o sea el destino de la
 * arista — así que el id del destino se arma sin volver a la base grande.
 */
export async function relacionesSalientes(
  ids: Set<string>,
): Promise<Map<string, Relacion[]>> {
  const ruta = await zipCacheado(INFOLEG.modificatoriasZip, "infoleg-modificatorias.csv");
  const porNorma = new Map<string, Relacion[]>();

  const lector = createReadStream(ruta).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_quotes: true, bom: true }),
  );
  for await (const fila of lector as AsyncIterable<Record<string, string>>) {
    const origen = fila.id_norma_modificatoria;
    if (!ids.has(origen)) continue;
    const destino = idNacional(fila.tipo_norma, fila.nro_norma, fila.fecha_boletin);
    const lista = porNorma.get(origen) ?? [];
    if (!lista.some((r) => r.norma === destino)) {
      lista.push({ tipo: "modifica", norma: destino });
    }
    porNorma.set(origen, lista);
  }
  return porNorma;
}

/**
 * Texto de la norma. Prefiere el CONSOLIDADO (`texto_actualizado`): ya incorpora
 * todas las modificaciones, así que afirmar que está vigente es honesto aunque
 * las modificatorias no estén en el corpus. Ese es el criterio de selección de
 * las nacionales (ADR-0006 / seleccion.ts).
 */
export async function textoDeNorma(
  fila: FilaInfoleg,
): Promise<{ texto: string; truncado: boolean; consolidado: boolean } | null> {
  const consolidado = fila.texto_actualizado?.startsWith("http");
  const url = consolidado ? fila.texto_actualizado : fila.texto_original;
  if (!url?.startsWith("http")) return null;

  // InfoLEG responde 403 sin User-Agent de navegador, y sirve en latin-1.
  const html = await textoCacheado(
    url.replace(/^http:/, "https:"),
    `infoleg-${fila.id_norma}.html`,
    { init: { headers: { "User-Agent": INFOLEG.USER_AGENT } }, encoding: "latin1" },
  );
  const { texto, truncado } = desdeHtml(html);
  return texto.length < 400 ? null : { texto, truncado, consolidado };
}
