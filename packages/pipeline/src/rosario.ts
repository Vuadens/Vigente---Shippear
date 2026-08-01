import { parse } from "csv-parse/sync";
import { ROSARIO } from "./fuentes.js";
import { textoCacheado } from "./cache.js";
import { desdeHtml, desdePdf, recortar, MAX_CHARS, type Extraccion } from "./texto.js";

export type FilaRosario = {
  TIPO: string;
  NUMERO: string;
  ANIO: string;
  ASUNTO: string;
  FEC_SANCION: string;
  FEC_PROMULGACION: string;
  FEC_PUBLICACION_BOLETIN: string;
  FUE_ACTUALIZADA: string;
  TEXTO_VIGENTE_NORMA: string;
};

export async function cargarOrdenanzas(): Promise<FilaRosario[]> {
  const csv = await textoCacheado(ROSARIO.ordenanzasCsv, "rosario-ordenanzas.csv");
  return parse(csv, { columns: true, skip_empty_lines: true });
}

export function buscarFila(
  filas: FilaRosario[],
  numero: number,
  anio: number,
): FilaRosario | undefined {
  return filas.find((f) => Number(f.NUMERO) === numero && Number(f.ANIO) === anio);
}

export const idRosario = (numero: number, anio: number) => `ord-${numero}-${anio}`;

/** dd/mm/aaaa → aaaa-mm-dd. El CSV de Rosario usa formato local. */
export function fechaIso(fecha: string): string {
  const m = fecha?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/**
 * Texto de la norma. Devuelve null si Rosario no publicó el PDF: hay
 * idNormativa que responden ~48 bytes, y mandarle eso al LLM es pedirle
 * que invente.
 */
export async function textoDeNorma(fila: FilaRosario): Promise<Extraccion | null> {
  const idNormativa = fila.TEXTO_VIGENTE_NORMA?.match(/idNormativa=(\d+)/)?.[1];
  // Algunas normas grandes (ej. 8336, Reglamento de Edificación) no tienen PDF:
  // el link va a un sitio HTML con índice de secciones.
  if (!idNormativa) return desdeSitioConIndice(fila.TEXTO_VIGENTE_NORMA?.trim());

  const res = await fetch(ROSARIO.pdfNorma(idNormativa));
  if (!res.ok) return null;
  const pdf = await res.arrayBuffer();
  if (pdf.byteLength < 1024) return null; // respuesta vacía disfrazada de 200

  return desdePdf(pdf);
}

/**
 * Normas publicadas como sitio HTML (municipal, con página índice): se bajan
 * las secciones linkeadas en orden y se concatenan. recortar() ya acota el
 * total a MAX_CHARS, así que un reglamento gigante entra truncado y avisado.
 */
async function desdeSitioConIndice(url: string | undefined): Promise<Extraccion | null> {
  if (!url || !/rosario\.go[bv]\.ar\/mr\/normativa\//.test(url)) return null;

  // BFS sobre el sitio: el índice linkea secciones que a su vez son sub-índices
  // de capítulos; el articulado real está uno o dos niveles abajo. Se compara
  // por path y no por host (el CSV apunta a ssl.rosario.gov.ar pero el sitio
  // redirige a www.rosario.gob.ar). recortar() acota el total a MAX_CHARS.
  const path = new URL(url).pathname.replace(/\/[^/]*$/, "/");
  const MAX_PAGINAS = 60;
  const cola = [url];
  const vistos = new Set([new URL(url).pathname]);
  const partes: string[] = [];

  while (cola.length > 0 && vistos.size <= MAX_PAGINAS) {
    const pagina = cola.shift()!;
    const html = await fetch(pagina).then((r) => (r.ok ? r.text() : null)).catch(() => null);
    if (!html) continue;
    partes.push(desdeHtml(html).texto);
    if (partes.join(" ").length > MAX_CHARS) break; // presupuesto cubierto

    for (const m of html.matchAll(/href="(https?:\/\/[^"#]+)"/g)) {
      const p = new URL(m[1]).pathname;
      if (p.startsWith(path) && !vistos.has(p)) {
        vistos.add(p);
        cola.push(m[1]);
      }
    }
  }
  if (partes.length === 0) return null;

  const { texto, truncado } = recortar(partes.join("\n"));
  return { modo: "texto", texto, truncado };
}
