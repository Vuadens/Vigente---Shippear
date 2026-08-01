import { generateObject } from "ai";
import { PerfilSchema, RUBROS } from "@vigente/schema";

// Modo pull (ADR-0003): texto → Perfil. Única llamada LLM en runtime.
// Fallback determinístico: las preguntas del guión no tocan la API.

const GUION: Record<string, unknown> = {
  "quiero construir algo en mi casa, ¿qué tengo que saber?": {
    tipo_sujeto: "persona_fisica",
    rubro: "",
    ubicacion: { direccion: "", coords: [] },
    condiciones: ["obra_en_vivienda"],
    intencion: "construir en mi casa",
  },
};

export async function POST(req: Request) {
  const { pregunta } = await req.json();

  const precomputado = GUION[pregunta?.trim().toLowerCase()];
  if (precomputado) return Response.json({ perfil: precomputado, fuente: "guion" });

  const { object } = await generateObject({
    model: "anthropic/claude-sonnet-4.5", // vía Vercel AI Gateway
    schema: PerfilSchema,
    prompt: `Extraé el perfil del sujeto a partir de esta consulta sobre normativa.
Ciudad por defecto: Rosario. No inventes datos que no estén en la consulta.
El campo "rubro" debe ser exactamente uno de: ${RUBROS.join(", ")} — o vacío si no aplica. Si devolvés otro valor, el matcher no encuentra normativa en vivo.
Consulta: "${pregunta}"`,
  });

  return Response.json({ perfil: object, fuente: "llm" });
}
