import { extractText, getDocumentProxy } from "unpdf";

// Cuánto texto le mandamos al LLM por norma. La Ley de Contrato de Trabajo
// consolidada son ~183k caracteres (~50k tokens); el tope acota latencia.
// Las leyes largas se truncan y queda avisado en el log: se pierden los títulos
// finales, no el núcleo de obligaciones, que va al principio. `confianza` mide
// fidelidad a lo que el modelo leyó (CONTEXT.md), así que truncar no la
// invalida — pero conviene saber que pasó.
export const MAX_CHARS = 120_000;

/** Debajo de esto asumimos que el PDF no tiene capa OCR y mandamos el binario. */
const MIN_CHARS_UTILES = 400;

export type Extraccion =
  | { modo: "texto"; texto: string; truncado: boolean }
  | { modo: "pdf"; pdf: ArrayBuffer };

export function recortar(texto: string): { texto: string; truncado: boolean } {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length <= MAX_CHARS
    ? { texto: limpio, truncado: false }
    : { texto: limpio.slice(0, MAX_CHARS), truncado: true };
}

/**
 * Texto de un PDF. Los PDFs de Rosario son escaneos *con* capa OCR, así que
 * casi siempre sale texto (sucio: "Gráñco" por "Gráfico" — el LLM lo absorbe).
 * Si no sale nada, devolvemos el binario para que lo lea por visión: cuesta
 * ~7x más en tokens, por eso es el fallback y no el camino principal.
 */
export async function desdePdf(pdf: ArrayBuffer): Promise<Extraccion> {
  try {
    const doc = await getDocumentProxy(new Uint8Array(pdf));
    const { text } = await extractText(doc, { mergePages: true });
    const { texto, truncado } = recortar(Array.isArray(text) ? text.join("\n") : text);
    if (texto.length >= MIN_CHARS_UTILES) return { modo: "texto", texto, truncado };
  } catch {
    // PDF corrupto o cifrado: que lo mire el modelo.
  }
  return { modo: "pdf", pdf };
}

/** Texto visible de una página HTML (InfoLEG sirve las normas como HTML). */
export function desdeHtml(html: string): { texto: string; truncado: boolean } {
  const sinRuido = html
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return recortar(decodificarEntidades(sinRuido));
}

function decodificarEntidades(s: string): string {
  const nombradas: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  };
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (todo, cod: string) => {
    if (cod[0] === "#") {
      const n = cod[1]?.toLowerCase() === "x"
        ? parseInt(cod.slice(2), 16)
        : parseInt(cod.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : todo;
    }
    return nombradas[cod.toLowerCase()] ?? todo;
  });
}
