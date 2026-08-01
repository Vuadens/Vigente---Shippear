import { generateObject } from "ai";
import { match } from "@vigente/matcher";
import { PerfilSchema, RespuestaSchema, type Norma } from "@vigente/schema";
import normasReales from "../../../../../data/normas.json";

// Síntesis grounded (ADR-0008): la pregunta del usuario + las obligaciones que
// YA matchearon → una respuesta corta. El modelo no puede traer normativa de
// afuera: solo referencia por índice la lista que le pasamos, y todo índice
// fuera de rango se descarta. Las fuentes las muestra el front desde el corpus.

const normas = normasReales as Norma[];

// Techo defensivo para el prompt. Hoy el peor perfil matchea ~150 obligaciones,
// así que en la práctica nunca se recorta; si el corpus crece, el prompt avisa.
const MAX_OBLIGACIONES = 200;

export async function POST(req: Request) {
  const body = await req.json();
  const parse = PerfilSchema.safeParse(body?.perfil);
  const pregunta = typeof body?.pregunta === "string" ? body.pregunta.trim() : "";
  if (!parse.success || !pregunta) {
    return Response.json({ error: "falta pregunta o perfil inválido" }, { status: 400 });
  }

  // Mismo match determinístico que /api/match: los índices se corresponden
  // uno a uno con los items que el front ya tiene en pantalla.
  const matcheadas = match(parse.data, normas);
  if (matcheadas.length === 0) return Response.json({ respuesta: null });

  const recortadas = matcheadas.slice(0, MAX_OBLIGACIONES);
  const lista = recortadas
    .map(
      (m, i) =>
        `${i}. [${m.norma.tipo} ${m.norma.numero}, ${m.norma.jurisdiccion}] ${m.obligacion.que_hacer}` +
        (m.vence ? ` (vence ${m.vence})` : "") +
        (m.obligacion.si_no_cumplis ? ` — si no cumplís: ${m.obligacion.si_no_cumplis}` : ""),
    )
    .join("\n");
  const recorte =
    matcheadas.length > recortadas.length
      ? `\n(Hay ${matcheadas.length - recortadas.length} obligaciones más que no entraron en esta lista.)`
      : "";

  const { object } = await generateObject({
    model: "anthropic/claude-sonnet-5", // vía Vercel AI Gateway (ADR-0005)
    schema: RespuestaSchema,
    prompt: `Sos el asistente de Vigente. Un usuario preguntó algo y el sistema ya cruzó su perfil contra la normativa cargada. Tu trabajo es CONTESTAR LA PREGUNTA en lenguaje llano, no listar leyes.

REGLAS ESTRICTAS:
1. Solo podés afirmar cosas que salgan de las obligaciones numeradas de abajo. Nada de conocimiento propio sobre impuestos, AFIP, trámites ni normativa que no esté en la lista.
2. Si ninguna obligación de la lista responde lo que pregunta, decilo sin vueltas: "la normativa que tengo cargada no cubre X", accion_principal vacía y relevantes vacío. NO rellenes con obligaciones genéricas que no vienen al caso.
3. "relevantes" son SOLO las obligaciones que responden la pregunta (máximo 5), con su índice exacto. No incluyas obligaciones tangenciales.
4. "accion_principal": una sola frase imperativa con lo primero que tiene que hacer. Vacía si no hay nada que hacer.
5. Hablale de vos, directo, sin jerga. No menciones números de índice en el texto de "respuesta".

Pregunta del usuario: "${pregunta}"
Perfil detectado: ${JSON.stringify(parse.data)}

Obligaciones que le aplican a su perfil (numeradas):
${lista}${recorte}`,
  });

  // Guardarraíl: índices inventados o repetidos no pasan al front.
  const vistos = new Set<number>();
  const relevantes = object.relevantes
    .filter((r) => Number.isInteger(r.indice) && r.indice >= 0 && r.indice < recortadas.length)
    .filter((r) => !vistos.has(r.indice) && vistos.add(r.indice))
    .slice(0, 5);

  return Response.json({ respuesta: { ...object, relevantes } });
}
