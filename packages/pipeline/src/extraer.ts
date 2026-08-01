import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { generateObject } from "ai";
import { NormaSchema, RUBROS, type Norma, type Relacion } from "@vigente/schema";
import { ROSARIO_SELECCION, NACIONAL_SELECCION } from "./seleccion.js";
import * as rosario from "./rosario.js";
import * as infoleg from "./infoleg.js";
import type { Extraccion } from "./texto.js";

// Camino crítico (dueño: Franco). Toma el corpus curado de seleccion.ts, lo
// manda al LLM con el schema como structured output y escribe data/normas.json.
// Guarda resultados parciales: si falla en la 43 no se pierden las 42.

const SALIDA = new URL("../../../data/normas.json", import.meta.url).pathname;

// Vía Vercel AI Gateway (ADR-0003, actualizado por ADR-0005). Constante única:
// si el gateway no expone el slug, volver a "anthropic/claude-sonnet-4.5" es
// cambiar esta línea.
const MODELO = "anthropic/claude-sonnet-5";

// Cuántas normas se procesan en paralelo. El cuello es la latencia del modelo,
// no el rate limit; 4 mantiene el log legible y el orden de escritura estable.
const CONCURRENCIA = 4;

// Vocabulario de condiciones que los perfiles realmente declaran (data/perfiles.json
// y el modo pull). NO está en @vigente/schema porque el contrato está congelado:
// es el hermano de RUBROS que todavía no existe, y esa deuda hay que cerrarla con
// el equipo. Mientras tanto, el pipeline se limita a estas.
const CONDICIONES_PERFIL = [
  "local_a_la_calle",
  "empleados",
  "manipula_alimentos",
  "obra_en_vivienda",
] as const;

// Toda ordenanza del corpus es de Rosario. El matcher hace
// `direccionDelPerfil.includes(geo.descripcion)`, así que la descripción tiene que
// ser la etiqueta pelada: "Ciudad de Rosario" no es substring de
// "Av. Pellegrini 1234, Rosario" y la norma se vuelve invisible.
const CIUDAD_MUNICIPAL = "Rosario";

const INSTRUCCIONES = `Sos un extractor de normativa argentina. Convertís el texto de una norma al schema, sin interpretarlo.

REGLAS (en orden de prioridad):
1. No inventes. Todo lo que escribas tiene que estar en el texto que te doy. Si un dato no está, dejá el campo vacío ("") o la lista vacía ([]).
2. "obligaciones" son cosas concretas que DEBE HACER EL SUJETO REGULADO — una persona o una empresa alcanzada por la norma. Con consecuencia por no hacerlas.
   NO son obligaciones: lo que la norma le manda al propio Estado (dictar el decreto reglamentario, remitir un informe al Concejo, crear un registro, designar un funcionario, campañas de difusión). Eso lo hace el Estado, no el usuario, y no va en la lista.
   Si la norma solo crea un programa, declara un día conmemorativo o expresa una intención, devolvé obligaciones: [].
3. "que_hacer" se escribe para alguien sin formación legal: una acción concreta en una frase. Nada de "dese cumplimiento a lo normado en el art. 3".
4. "confianza" mide QUÉ TAN FIEL es tu extracción al texto que leíste — no si la obligación te parece jurídicamente sólida. Texto claro y explícito: alto. Texto borroso, mal escaneado o ambiguo sobre a quién obliga: bajo.
5. "alcanzados.rubros" SOLO puede contener valores de esta lista cerrada: ${RUBROS.join(", ")}. Ningún otro valor, ni sinónimos, ni plurales, ni subcategorías: un bar es "gastronomia", una obra es "construccion". Si la norma alcanza a todos, dejá la lista vacía ([]) — vacío significa "todos", no "no sé".
6. "plazo" se CALCULA, no se narra. Solo hay tres casos:
   - "dias_desde_publicacion": SOLO si el plazo se cuenta desde la publicación de ESTA norma. Es el caso de las obligaciones de adecuación ("los locales existentes tienen 90 días desde la sanción para adecuarse"). Es raro.
   - "fecha_fija": el texto da una fecha de calendario concreta.
   - "permanente": TODO lo demás. Incluye las obligaciones que se cuentan desde un hecho que las dispara: "dentro de los 10 días de mudarte", "dentro de los 30 días de constituida la sociedad", "dentro de los 5 días de recibido el reclamo". Esas son "permanente", y el "dentro de X días de Y" va escrito en "que_hacer".
   Regla práctica: si el plazo no arranca el día en que se publicó esta norma, es "permanente". Marcarlo mal produce vencimientos absurdos (una obligación de una ley de 1932 vencería en 1933) y arruina el orden de la lista.
7. "alcanzados.condiciones" es un campo de MATCHEO contra el perfil del usuario, no un resumen de la letra chica. Solo puede contener etiquetas de esta lista: ${CONDICIONES_PERFIL.join(", ")}.
   Si la condición real de la norma no es ninguna de esas (un mínimo de metros cuadrados, ser frentista, romper la vereda, tener cierta superficie), dejá "condiciones": [] y contá esa condición DENTRO de "que_hacer". Ejemplo correcto: que_hacer = "Acreditar la factibilidad de energía si la obra supera los 500 m2", condiciones = [].
   Una etiqueta inventada no le matchea a nadie: la obligación desaparece del sistema. Vale más mostrarla con la salvedad escrita que no mostrarla.
8. "geo.tipo" define si la norma llega o no al usuario:
   - "ciudad": rige en toda la ciudad o el país. Es el caso por defecto de casi toda ordenanza y de TODA ley nacional.
   - "zona": rige en un área nombrada (un barrio, un distrito, una zona portuaria).
   - "tramo" / "punto": rige sobre una calle, un lote o una dirección puntual, y NADA MÁS.
   Elegí "tramo" o "punto" solo si la norma se agota en ese lugar. Si impone una obligación a un rubro en general y además menciona un lugar, es "ciudad" o "zona".
9. "geo.descripcion" es una ETIQUETA, no una descripción. Con tipo "ciudad" va solo el nombre de la ciudad: "Rosario". No "Ciudad de Rosario", no "Ejido urbano de Rosario", no una enumeración de barrios. Con tipo "zona", el nombre del barrio o distrito, a secas.
10. "geo.coords" va SIEMPRE vacío: []. No inventes coordenadas bajo ninguna circunstancia.`;

type Trabajo = {
  id: string;
  etiqueta: string;
  construir: () => Promise<Norma | null>;
};

function cargarParciales(): Norma[] {
  if (!existsSync(SALIDA)) return [];
  try {
    return JSON.parse(readFileSync(SALIDA, "utf8")) as Norma[];
  } catch {
    console.warn("⚠ data/normas.json ilegible; se arranca de cero");
    return [];
  }
}

function guardar(normas: Norma[]) {
  const dir = SALIDA.slice(0, SALIDA.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const ordenadas = [...normas].sort((a, b) =>
    b.fecha_publicacion.localeCompare(a.fecha_publicacion),
  );
  writeFileSync(SALIDA, `${JSON.stringify(ordenadas, null, 2)}\n`);
}

/** Llama al LLM. `relacionesFijas` pisa lo que devuelva el modelo (ADR-0006). */
async function extraer(
  contexto: string,
  fuente: Extraccion,
  relacionesFijas?: Relacion[],
): Promise<Norma> {
  const contenido =
    fuente.modo === "texto"
      ? [{ type: "text" as const, text: `${contexto}\n\n--- TEXTO DE LA NORMA ---\n${fuente.texto}` }]
      : [
          { type: "text" as const, text: `${contexto}\n\nEl texto va adjunto como PDF.` },
          { type: "file" as const, data: fuente.pdf, mediaType: "application/pdf" as const },
        ];

  const { object } = await generateObject({
    model: MODELO,
    schema: NormaSchema,
    system: INSTRUCCIONES,
    messages: [{ role: "user", content: contenido }],
  });

  // Dos cosas no son negociables por prompt, así que se fuerzan acá:
  //  - coords: una coordenada inventada es alucinación pura y termina como un
  //    pin en el mapa. La única fuente legítima es Georef, en geocodificar.ts.
  //  - relaciones nacionales: vienen del CSV oficial de InfoLEG.
  const municipal = object.jurisdiccion === "municipal";
  const validas = new Set<string>(CONDICIONES_PERFIL);
  const descartadas: string[] = [];

  const norma: Norma = {
    ...object,
    obligaciones: object.obligaciones.map((o) => {
      const buenas = o.alcanzados.condiciones.filter((c) => validas.has(c));
      descartadas.push(...o.alcanzados.condiciones.filter((c) => !validas.has(c)));
      // Una condición fuera del vocabulario no le matchea a NADIE, así que la
      // obligación entera desaparece. Vaciar la lista la hace visible para todo
      // el rubro, y la salvedad concreta vive en "que_hacer" (regla 6 del prompt).
      return { ...o, alcanzados: { ...o.alcanzados, condiciones: buenas } };
    }),
    geo: {
      ...object.geo,
      // El matcher hace includes() sobre la dirección del perfil: la descripción
      // tiene que ser la etiqueta, no prosa. Todo el corpus municipal es Rosario.
      descripcion:
        municipal && object.geo.tipo === "ciudad" ? CIUDAD_MUNICIPAL : object.geo.descripcion,
      coords: [],
    },
    relaciones: relacionesFijas ?? object.relaciones,
  };

  if (descartadas.length) {
    // Revisar en la curación que "que_hacer" conserve la salvedad que se cayó de acá.
    console.warn(`    ⚠ ${norma.id}: condiciones descartadas → ${[...new Set(descartadas)].join(", ")}`);
  }
  avisarSiNoVaAMatchear(norma);
  return norma;
}

/**
 * Dos formas de que una norma quede bien extraída pero INVISIBLE para el
 * matcher. No se corrigen solas a propósito: arreglarlas por código cambia el
 * alcance de la obligación en silencio, que es peor. Se curan a mano.
 */
function avisarSiNoVaAMatchear(n: Norma) {
  const validos = new Set<string>(RUBROS);
  const invasores = [
    ...new Set(n.obligaciones.flatMap((o) => o.alcanzados.rubros.filter((r) => !validos.has(r)))),
  ];
  if (invasores.length) {
    // El matcher compara exacto contra RUBROS: un rubro inventado nunca matchea.
    // No lo borramos: dejar la lista vacía significaría "alcanza a todos" y
    // pasaríamos de no mostrar la obligación a mostrársela a cualquiera.
    console.warn(`    ⚠ ${n.id}: rubros fuera del vocabulario → ${invasores.join(", ")}`);
  }
  if (n.jurisdiccion === "municipal" && (n.geo.tipo === "punto" || n.geo.tipo === "tramo")) {
    console.warn(`    ⚠ ${n.id}: geo.tipo="${n.geo.tipo}" — solo va al mapa, no matchea a nadie`);
  }
  // Un plazo "desde la publicación" en una norma vieja da un vencimiento en el
  // pasado, y la demo ordena por vencimiento: esas encabezan la lista. Casi
  // siempre significa que el plazo en realidad corre desde un hecho, no desde
  // la publicación, y correspondía "permanente" (regla 6 del prompt).
  const hoy = new Date().toISOString().slice(0, 10);
  for (const o of n.obligaciones) {
    if (o.plazo.tipo !== "dias_desde_publicacion") continue;
    const d = new Date(n.fecha_publicacion);
    d.setDate(d.getDate() + Number(o.plazo.valor));
    const vence = d.toISOString().slice(0, 10);
    if (vence < hoy) {
      console.warn(`    ⚠ ${n.id}: vencimiento en el pasado (${vence}) — ¿el plazo corre desde un hecho? → "${o.que_hacer.slice(0, 50)}"`);
    }
  }
}

async function trabajosRosario(): Promise<Trabajo[]> {
  const filas = await rosario.cargarOrdenanzas();
  const vistos = new Set<string>();

  return ROSARIO_SELECCION.flatMap(({ numero, anio, porque }) => {
    const id = rosario.idRosario(numero, anio);
    if (vistos.has(id)) return [];
    vistos.add(id);

    return [{
      id,
      etiqueta: `${id} · ${porque}`,
      async construir() {
        const fila = rosario.buscarFila(filas, numero, anio);
        if (!fila) throw new Error("no está en el CSV de Rosario");
        const fuente = await rosario.textoDeNorma(fila);
        if (!fuente) throw new Error("Rosario no publicó el texto (PDF vacío)");
        if (fuente.modo === "pdf") console.log(`    (sin capa OCR → se manda el PDF)`);
        else if (fuente.truncado) console.log(`    (texto truncado al tope)`);

        const contexto = [
          `Jurisdicción: municipal (Rosario, Santa Fe).`,
          `id exacto a usar: "${id}"`,
          `tipo: "${fila.TIPO}" · numero: "${numero}/${anio}"`,
          `fecha_publicacion: "${rosario.fechaIso(fila.FEC_PUBLICACION_BOLETIN)}"`,
          `url_fuente: "${fila.TEXTO_VIGENTE_NORMA}"`,
          `Asunto según el índice oficial: "${fila.ASUNTO}"`,
          ``,
          `En "relaciones" incluí SOLO las normas que el texto menciona LITERALMENTE`,
          `como modificadas, derogadas o prorrogadas por ésta. Formato del id:`,
          `"ord-<numero>-<año>" (ej: la "Ordenanza N° 8.952" es "ord-8952-2012" si`,
          `el texto da el año; si no lo da, no la incluyas). Si no menciona ninguna,`,
          `devolvé [].`,
        ].join("\n");

        return extraer(contexto, fuente);
      },
    }];
  });
}

async function trabajosNacionales(): Promise<Trabajo[]> {
  const ids = new Set(NACIONAL_SELECCION.map((n) => n.idNorma));
  console.log(`  leyendo la base de InfoLEG (${ids.size} normas)...`);
  const filas = await infoleg.buscarNormas(ids);
  const relaciones = await infoleg.relacionesSalientes(ids);

  return NACIONAL_SELECCION.map(({ idNorma, porque }) => {
    const fila = filas.get(idNorma);
    const id = fila
      ? infoleg.idNacional(fila.tipo_norma, fila.numero_norma, fila.fecha_sancion)
      : `infoleg-${idNorma}`;

    return {
      id,
      etiqueta: `${id} · ${porque}`,
      async construir() {
        if (!fila) throw new Error(`id_norma ${idNorma} no está en la base de InfoLEG`);
        const fuente = await infoleg.textoDeNorma(fila);
        if (!fuente) throw new Error("InfoLEG no devolvió texto utilizable");
        if (fuente.truncado) console.log(`    (texto truncado al tope)`);
        if (!fuente.consolidado) console.log(`    ⚠ sin texto consolidado`);

        const contexto = [
          `Jurisdicción: nacional (Argentina).`,
          `id exacto a usar: "${id}"`,
          `tipo: "${fila.tipo_norma}" · numero: "${fila.numero_norma}"`,
          `fecha_publicacion: "${(fila.fecha_boletin || fila.fecha_sancion).slice(0, 10)}"`,
          `url_fuente: "${fila.texto_actualizado || fila.texto_original}"`,
          `Título oficial: "${fila.titulo_resumido}"`,
          fuente.consolidado
            ? `Este es el TEXTO CONSOLIDADO vigente: ya incorpora todas las modificaciones posteriores.`
            : `Este es el texto original; puede haber sido modificado después.`,
          ``,
          `NO completes "relaciones": devolvé []. Las relaciones de las normas`,
          `nacionales las aporta la base oficial de InfoLEG, no vos.`,
        ].join("\n");

        return extraer(contexto, { modo: "texto", texto: fuente.texto, truncado: fuente.truncado }, relaciones.get(idNorma) ?? []);
      },
    };
  });
}

/** Corre los trabajos de a tandas, guardando después de cada norma. */
async function correr(trabajos: Trabajo[], normas: Norma[], hechas: Set<string>) {
  const pendientes = trabajos.filter((t) => !hechas.has(t.id));
  console.log(`  ${pendientes.length} pendientes (${trabajos.length - pendientes.length} ya estaban)\n`);

  for (let i = 0; i < pendientes.length; i += CONCURRENCIA) {
    const tanda = pendientes.slice(i, i + CONCURRENCIA);
    const resultados = await Promise.allSettled(
      tanda.map(async (t) => {
        console.log(`  → ${t.etiqueta}`);
        return { t, norma: await t.construir() };
      }),
    );

    for (const r of resultados) {
      if (r.status === "rejected") {
        console.error(`  ✗ ${r.reason instanceof Error ? r.reason.message : r.reason}`);
        continue;
      }
      const { t, norma } = r.value;
      if (!norma) continue;
      normas.push(norma);
      hechas.add(t.id);
      const obs = norma.obligaciones.length;
      console.log(`  ✓ ${t.id} — ${obs} obligacion${obs === 1 ? "" : "es"} (${normas.length} en total)`);
    }
    guardar(normas); // parcial tras cada tanda
  }
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("Falta AI_GATEWAY_API_KEY. Copiá .env.example a .env y completala");
    console.error("(Vercel dashboard → AI Gateway). Ver ADR-0003.");
    process.exit(1);
  }

  const normas = cargarParciales();
  const hechas = new Set(normas.map((n) => n.id));
  if (normas.length) console.log(`Retomando: ya hay ${normas.length} normas en data/normas.json\n`);

  console.log("── MUNICIPAL (Rosario) ──");
  await correr(await trabajosRosario(), normas, hechas);

  console.log("\n── NACIONAL (InfoLEG) ──");
  await correr(await trabajosNacionales(), normas, hechas);

  guardar(normas);

  const conObligaciones = normas.filter((n) => n.obligaciones.length > 0);
  const totalObl = normas.reduce((a, n) => a + n.obligaciones.length, 0);
  const dudosas = normas.flatMap((n) =>
    n.obligaciones.filter((o) => o.confianza < 0.7).map((o) => ({ id: n.id, o })),
  );

  console.log(`\n── LISTO ──`);
  console.log(`${normas.length} normas · ${conObligaciones.length} con obligaciones · ${totalObl} obligaciones`);
  console.log(`→ data/normas.json`);

  if (dudosas.length) {
    // ADR-0006: no se filtra en runtime, se cura a mano. Esta es la lista de revisión.
    console.log(`\n⚠ ${dudosas.length} obligaciones con confianza < 0.7 — revisar contra la fuente:`);
    for (const { id, o } of dudosas) {
      console.log(`   ${id} (${o.confianza.toFixed(2)}) ${o.que_hacer.slice(0, 70)}`);
    }
  }

  // Normas que quedaron bien extraídas pero que el matcher no va a devolver nunca.
  const validos = new Set<string>(RUBROS);
  const invisibles = normas.filter(
    (n) =>
      (n.jurisdiccion === "municipal" && (n.geo.tipo === "punto" || n.geo.tipo === "tramo")) ||
      n.obligaciones.some((o) => o.alcanzados.rubros.some((r) => !validos.has(r))),
  );
  if (invisibles.length) {
    console.log(`\n⚠ ${invisibles.length} normas que el matcher NO va a devolver (ver avisos arriba):`);
    for (const n of invisibles) console.log(`   ${n.id} · geo=${n.geo.tipo}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
