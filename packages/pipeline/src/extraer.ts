import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { generateObject } from "ai";
import { NormaSchema, type Norma } from "@vigente/schema";
import { ROSARIO } from "./fuentes.js";

// Camino crítico (dueño: Franco). Toma las normas seleccionadas, las manda al
// LLM con el schema como structured output y escribe data/normas.json.
// Guarda resultados parciales: si falla en la 43 no se pierden las 42.

const SALIDA = new URL("../../../data/normas.json", import.meta.url).pathname;
const MODELO = "anthropic/claude-sonnet-4.5"; // vía Vercel AI Gateway (ADR-0003)

// TODO(Franco): reemplazar por las ~40 municipales + ~20 nacionales elegidas a mano.
// Para Rosario alcanza el par (NUMERO, ANIO) — el script busca la fila en el CSV.
const SELECCION_ROSARIO: Array<{ numero: number; anio: number }> = [
  { numero: 10919, anio: 2026 },
];

function cargarParciales(): Norma[] {
  return existsSync(SALIDA) ? JSON.parse(readFileSync(SALIDA, "utf8")) : [];
}

async function extraerNorma(fila: Record<string, string>): Promise<Norma> {
  const idNormativa = fila.TEXTO_VIGENTE_NORMA.match(/idNormativa=(\d+)/)?.[1];
  const pdf = idNormativa
    ? await fetch(ROSARIO.pdfNorma(idNormativa)).then((r) => r.arrayBuffer())
    : null;

  const { object } = await generateObject({
    model: MODELO,
    schema: NormaSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extraé la norma al schema. Metadata del CSV oficial: ${JSON.stringify(fila)}.
Jurisdicción: municipal (Rosario). El id es "ord-${fila.NUMERO}-${fila.ANIO}".
url_fuente: ${fila.TEXTO_VIGENTE_NORMA}
Si el texto no impone obligaciones a nadie, devolvé obligaciones: [].
No inventes: si un dato no está en el texto, dejá el campo vacío y bajá la confianza.`,
          },
          ...(pdf
            ? [{ type: "file" as const, data: pdf, mediaType: "application/pdf" as const }]
            : []),
        ],
      },
    ],
  });
  return object;
}

async function main() {
  const csv = await fetch(ROSARIO.ordenanzasCsv).then((r) => r.text());
  const filas: Record<string, string>[] = parse(csv, { columns: true });

  const normas = cargarParciales();
  const yaProcesadas = new Set(normas.map((n) => n.id));

  for (const { numero, anio } of SELECCION_ROSARIO) {
    const id = `ord-${numero}-${anio}`;
    if (yaProcesadas.has(id)) continue;
    const fila = filas.find((f) => Number(f.NUMERO) === numero && Number(f.ANIO) === anio);
    if (!fila) {
      console.error(`✗ ${id}: no está en el CSV`);
      continue;
    }
    try {
      normas.push(await extraerNorma(fila));
      writeFileSync(SALIDA, JSON.stringify(normas, null, 2)); // parcial tras cada norma
      console.log(`✓ ${id} (${normas.length} acumuladas)`);
    } catch (e) {
      console.error(`✗ ${id}:`, e);
    }
  }
}

main();
