import { z } from "zod";

// ============================================================
// CONTRATO CONGELADO (README §3). No se modifica sin avisar a
// todo el equipo: pipeline, matcher, db y web dependen de esto.
// ============================================================

export const PlazoSchema = z.object({
  tipo: z.enum(["fecha_fija", "dias_desde_publicacion", "permanente"]),
  valor: z
    .string()
    .describe("fecha ISO si fecha_fija, número de días si dias_desde_publicacion, vacío si permanente"),
});

export const ObligacionSchema = z.object({
  que_hacer: z.string().describe("acción concreta, en una frase, sin jerga legal"),
  alcanzados: z.object({
    rubros: z.array(z.string()).describe("rubros alcanzados, vacío = todos"),
    condiciones: z.array(z.string()).describe("ej: local_a_la_calle, empleados, manipula_alimentos"),
  }),
  plazo: PlazoSchema,
  si_no_cumplis: z.string().describe("consecuencia concreta: multa, clausura, etc."),
  confianza: z.number().min(0).max(1),
});

export const GeoSchema = z.object({
  tipo: z.enum(["ciudad", "zona", "tramo", "punto"]),
  descripcion: z.string(),
  coords: z.array(z.number()).describe("[lat, lon]; vacío si no se geocodificó"),
});

export const RelacionSchema = z.object({
  tipo: z.enum(["modifica", "deroga", "prorroga"]),
  norma: z.string().describe("id de la norma afectada, ej: ord-9027-2012"),
});

export const NormaSchema = z.object({
  id: z.string().describe("ej: ord-10919-2026"),
  jurisdiccion: z.enum(["municipal", "provincial", "nacional"]),
  tipo: z.string().describe("Ordenanza, Decreto, Ley, Resolución..."),
  numero: z.string().describe("ej: 10919/2026"),
  fecha_publicacion: z.string().describe("ISO yyyy-mm-dd"),
  url_fuente: z.string(),
  resumen_llano: z.string().describe("una frase, sin jerga legal"),
  obligaciones: z.array(ObligacionSchema),
  geo: GeoSchema,
  relaciones: z.array(RelacionSchema),
});

// Vocabulario canónico de rubros. El front lo usa como selector, /api/intent
// lo pasa al prompt y el matcher compara exacto contra estos valores.
// Aditivo al contrato: no cambia ninguna forma existente.
export const RUBROS = [
  "gastronomia",
  "comercio",
  "construccion",
  "transporte",
  "industria",
  "servicios",
] as const;

// Vocabulario canónico de condiciones del perfil — el hermano de RUBROS.
// El pipeline solo emite estas etiquetas en alcanzados.condiciones y
// /api/intent solo puede extraer estas; cualquier otra no matchea a nadie.
// Aditivo al contrato: no cambia ninguna forma existente.
export const CONDICIONES = [
  "local_a_la_calle",
  "empleados",
  "manipula_alimentos",
  "obra_en_vivienda",
] as const;

export const PerfilSchema = z.object({
  tipo_sujeto: z.enum(["persona_fisica", "comercio"]),
  rubro: z.string().describe("ej: gastronomia; vacío si no aplica"),
  ubicacion: z.object({
    direccion: z.string(),
    coords: z.array(z.number()),
  }),
  condiciones: z.array(z.string()),
  intencion: z.string().describe("qué está por hacer, ej: construir en mi casa"),
});

// Respuesta sintetizada de /api/respuesta (ADR-0008). El modelo solo puede
// referenciar obligaciones por índice de la lista numerada que recibe: el
// texto se muestra, pero fuentes y normas salen siempre del corpus.
// Aditivo al contrato: no cambia ninguna forma existente.
export const RespuestaSchema = z.object({
  respuesta: z
    .string()
    .describe("2 a 4 frases en lenguaje llano que contestan la pregunta usando SOLO las obligaciones numeradas"),
  accion_principal: z
    .string()
    .describe("la próxima acción concreta del usuario en una frase imperativa; vacío si ninguna obligación responde la pregunta"),
  relevantes: z
    .array(
      z.object({
        indice: z.number().describe("índice de la obligación en la lista numerada"),
        motivo: z.string().describe("por qué sostiene la respuesta, una frase"),
      }),
    )
    .describe("las obligaciones que sostienen la respuesta, máximo 5; vacío si ninguna aplica"),
});

export type Plazo = z.infer<typeof PlazoSchema>;
export type Obligacion = z.infer<typeof ObligacionSchema>;
export type Geo = z.infer<typeof GeoSchema>;
export type Relacion = z.infer<typeof RelacionSchema>;
export type Norma = z.infer<typeof NormaSchema>;
export type Perfil = z.infer<typeof PerfilSchema>;
export type Respuesta = z.infer<typeof RespuestaSchema>;
