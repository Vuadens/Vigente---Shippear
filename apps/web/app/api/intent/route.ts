import { generateObject } from "ai";
import { CONDICIONES, PerfilSchema, RUBROS } from "@vigente/schema";

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
    // Sonnet 5, no 4.5: la key del gateway es free tier y 4.5 devuelve
    // "Free tier users do not have access to this model" (ADR-0005).
    model: "anthropic/claude-sonnet-5", // vía Vercel AI Gateway
    schema: PerfilSchema,
    prompt: `Extraé el perfil del sujeto a partir de esta consulta sobre normativa.
Ciudad por defecto: Rosario. No inventes datos que no estén en la consulta.
El campo "rubro" es la ACTIVIDAD ECONÓMICA del usuario, no el tema de la consulta: exactamente uno de ${RUBROS.join(", ")} — o vacío. Un particular que hace una obra en su casa no tiene rubro.
El campo "condiciones" SOLO puede contener etiquetas de esta lista cerrada: ${CONDICIONES.join(", ")}. Ninguna otra: una etiqueta inventada no matchea con nada y el usuario pierde obligaciones. Construir, ampliar, refaccionar o levantar una pared/medianera en una vivienda es "obra_en_vivienda".
Consulta: "${pregunta}"`,
  });

  // Guardarraíl espejo del pipeline: una condición fuera del vocabulario no
  // matchea a nadie, así que se filtra en vez de dejar que apague obligaciones.
  const validas = new Set<string>(CONDICIONES);
  const perfil = {
    ...object,
    condiciones: object.condiciones.filter((c) => validas.has(c)),
  };

  return Response.json({ perfil, fuente: "llm" });
}
