import { parse } from "csv-parse/sync";
import { ROSARIO } from "./fuentes.js";
import { textoCacheado } from "./cache.js";
import { desdePdf, type Extraccion } from "./texto.js";

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
  if (!idNormativa) return null;

  const res = await fetch(ROSARIO.pdfNorma(idNormativa));
  if (!res.ok) return null;
  const pdf = await res.arrayBuffer();
  if (pdf.byteLength < 1024) return null; // respuesta vacía disfrazada de 200

  return desdePdf(pdf);
}
