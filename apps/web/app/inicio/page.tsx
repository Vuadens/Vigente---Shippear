import Link from "next/link";
import type { Norma, Plazo } from "@vigente/schema";
import normasEjemplo from "../../../../data/normas.ejemplo.json";
import { Dato, Seccion, Tarjeta } from "./_ui";

// Landing de pitch (ADR-0007). Estática: sin `use client`, sin fetch, sin BD.
// El contenido sale de README §1, §2, §4 y §11; el ejemplo de obligación sale
// del seed, nunca de copy inventado (regla anti-alucinación, README §6).

const normas = normasEjemplo as Norma[];
const EJEMPLO_ID = "ord-10800-2025";
const ejemplo =
  normas.find((n) => n.id === EJEMPLO_ID && n.obligaciones.length > 0) ??
  normas.find((n) => n.obligaciones.length > 0);

function textoPlazo(plazo: Plazo): string {
  if (plazo.tipo === "dias_desde_publicacion") return `${plazo.valor} días desde la publicación`;
  if (plazo.tipo === "fecha_fija") return `hasta el ${plazo.valor}`;
  return "permanente, mientras dure la actividad";
}

export default function Inicio() {
  return (
    <main>
      <Hero />
      <Problema />
      <ComoFunciona />
      <QueDevuelve />
      <PorQueAhora />
      <Mercado />
      <Fuentes />
      <Cierre />
    </main>
  );
}

function Hero() {
  return (
    <header className="mx-auto max-w-5xl px-6 pb-16 pt-14 md:pb-24 md:pt-20">
      <p className="font-display text-2xl">Vigente</p>
      <h1 className="mt-10 max-w-4xl font-display text-4xl leading-[1.1] md:text-6xl">
        Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-tenue">
        Vigente ingiere la normativa nacional, provincial y municipal, reconstruye qué está
        efectivamente vigente hoy y la traduce a obligaciones concretas con vencimiento para tu
        caso. No devuelve documentos: devuelve qué tenés que hacer y hasta cuándo.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/"
          className="rounded-md bg-tinta px-6 py-3 text-sm font-medium text-papel transition-opacity hover:opacity-85"
        >
          Ver la demo
        </Link>
        <span className="text-sm text-tenue">Nacional · provincial · municipal</span>
      </div>
    </header>
  );
}

const FALLAS = [
  {
    titulo: "Nadie sabe cuál norma le aplica",
    detalle:
      "Una pyme está obligada al mismo tiempo por los tres niveles de gobierno, y ninguno de los tres se habla con el otro.",
  },
  {
    titulo: "Nadie sabe qué sigue vigente",
    detalle:
      "Después de años de modificaciones y derogaciones parciales, el texto publicado y el texto que rige dejaron de ser el mismo.",
  },
  {
    titulo: "Nadie sabe para cuándo",
    detalle:
      "El plazo está adentro del articulado, en prosa. Enterarse tarde cuesta lo mismo que no enterarse.",
  },
];

function Problema() {
  return (
    <Seccion
      hondo
      volanta="El problema"
      titulo="La información está publicada, es gratis y aun así no llega. No es un problema de acceso: es de distribución."
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {FALLAS.map((f, i) => (
          <li key={f.titulo}>
            <Tarjeta>
              <p className="font-display text-3xl text-tenue">{i + 1}</p>
              <h3 className="mt-3 font-semibold">{f.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tenue">{f.detalle}</p>
            </Tarjeta>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-2xl font-display text-2xl leading-snug md:text-3xl">
        La unidad de valor no es la norma: es la obligación con vencimiento.
      </p>
    </Seccion>
  );
}

const PASOS = [
  {
    titulo: "Ingesta",
    detalle:
      "Se toman las normas publicadas por los tres niveles de gobierno desde sus portales de datos abiertos.",
  },
  {
    titulo: "Vigencia",
    detalle:
      "Se reconstruye el grafo de relaciones —modifica, deroga, prorroga— para saber qué rige hoy y qué quedó atrás.",
  },
  {
    titulo: "Cruce",
    detalle:
      "Cada obligación se cruza contra un perfil: rubro, ubicación, condiciones. Sale lo que te toca, ordenado por vencimiento.",
  },
];

function ComoFunciona() {
  return (
    <Seccion volanta="Cómo funciona" titulo="Tres pasos, y después dos modos sobre la misma base.">
      <ol className="grid gap-6 md:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tenue">
              Paso {i + 1}
            </p>
            <h3 className="mt-2 font-display text-2xl">{p.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-tenue">{p.detalle}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Tarjeta>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vigente">
            Modo pull
          </p>
          <h3 className="mt-3 font-display text-2xl">Consulta por intención</h3>
          <p className="mt-3 leading-relaxed text-tenue">
            Escribís en lenguaje natural qué estás por hacer —{" "}
            <em className="not-italic text-tinta">
              &ldquo;quiero construir algo en mi casa, ¿qué tengo que saber?&rdquo;
            </em>{" "}
            — y salen las obligaciones que se activan. La pregunta arma tu perfil sola: no hay
            formulario previo.
          </p>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vence">Modo push</p>
          <h3 className="mt-3 font-display text-2xl">Alerta por perfil</h3>
          <p className="mt-3 leading-relaxed text-tenue">
            Guardás el perfil una vez y el sistema te muestra lo nuevo o lo que cambió y te alcanza.
            La misma base, la misma lógica: cambia quién pregunta primero.
          </p>
        </Tarjeta>
      </div>
    </Seccion>
  );
}

function QueDevuelve() {
  if (!ejemplo) return null;
  const obligacion = ejemplo.obligaciones[0];

  // Rubros y condiciones son vocabulario cerrado del contrato: se muestran como
  // etiquetas, tal cual vienen, sin reescribirlos para que "queden lindos".
  const alcanzados = [...obligacion.alcanzados.rubros, ...obligacion.alcanzados.condiciones];

  const campos = [
    { etiqueta: "Qué hacer", valor: obligacion.que_hacer },
    {
      etiqueta: "A quién alcanza",
      valor: (
        <span className="flex flex-wrap gap-2">
          {alcanzados.map((a) => (
            <span key={a} className="rounded bg-papel-hondo px-2 py-1 font-mono text-xs">
              {a}
            </span>
          ))}
        </span>
      ),
    },
    { etiqueta: "Plazo", valor: textoPlazo(obligacion.plazo) },
    { etiqueta: "Si no cumplís", valor: obligacion.si_no_cumplis },
  ];

  return (
    <Seccion
      hondo
      volanta="Qué devuelve"
      titulo="Una obligación, no un documento. Con fuente oficial en cada una."
    >
      <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
        <Tarjeta>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tenue">
            <span className="rounded border border-borde px-2 py-0.5 text-xs uppercase tracking-wide">
              {ejemplo.jurisdiccion}
            </span>
            <span>
              {ejemplo.tipo} {ejemplo.numero}
            </span>
            <span>·</span>
            <span>{ejemplo.geo.descripcion}</span>
          </div>
          <p className="mt-4 leading-relaxed">{ejemplo.resumen_llano}</p>

          <dl className="mt-6 space-y-4 border-t border-borde pt-6">
            {campos.map((c) => (
              <div key={c.etiqueta} className="md:grid md:grid-cols-[9rem_1fr] md:gap-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-tenue">
                  {c.etiqueta}
                </dt>
                <dd className="mt-1 md:mt-0">{c.valor}</dd>
              </div>
            ))}
          </dl>

          <a
            href={ejemplo.url_fuente}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block text-sm underline underline-offset-4"
          >
            Ver la norma en la fuente oficial
          </a>
        </Tarjeta>

        <div className="max-w-sm space-y-6 text-sm leading-relaxed text-tenue">
          <p>
            Este ejemplo no es una maqueta: es una obligación real de la base, con su link a la
            fuente. Toda respuesta se construye sobre normativa que existe.
          </p>
          <p>
            Si no hay nada que aplique, la respuesta es que no hay nada que aplique. En un producto
            legal, inventar es peor que no responder.
          </p>
        </div>
      </div>
    </Seccion>
  );
}

const AHORA = [
  {
    titulo: "Leer un texto legal se abarató",
    detalle:
      "Estructurar una norma pasó de costar decenas de dólares a fracciones de centavo. Recién ahora es viable servir a la cola larga, y no sólo a corporaciones.",
  },
  {
    titulo: "Los datos se abrieron",
    detalle:
      "La base nacional está completa desde 1997, y las provinciales y municipales ya se publican en formatos procesables.",
  },
  {
    titulo: "Las reglas cambian más rápido",
    detalle:
      "La volatilidad regulatoria está en un pico. Cuanto más rápido cambian las reglas, más caro sale no enterarse.",
  },
];

function PorQueAhora() {
  return (
    <Seccion volanta="Por qué ahora" titulo="Tres cosas que hace cinco años no eran ciertas a la vez.">
      <div className="grid gap-6 md:grid-cols-3">
        {AHORA.map((a) => (
          <Tarjeta key={a.titulo}>
            <h3 className="font-semibold">{a.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-tenue">{a.detalle}</p>
          </Tarjeta>
        ))}
      </div>
    </Seccion>
  );
}

function Mercado() {
  return (
    <Seccion
      hondo
      volanta="A quién le sirve primero"
      titulo="Las empresas grandes lo resuelven con abogados y compliance. El resto se entera cuando le llega la multa."
    >
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="space-y-4 leading-relaxed text-tenue">
          <p>
            Arrancamos por los perfiles de mayor exposición regulatoria —comercios con local a la
            calle— porque es donde el costo de no enterarse es más alto y más medible.
          </p>
          <p>
            El canal de entrada son los contadores: atienden cientos de pymes cada uno y hoy
            absorben estas consultas gratis y a destiempo.
          </p>
          <p>
            El producto se replica a toda la región cambiando sólo la fuente de ingesta: todos los
            países tienen boletín oficial y el mismo problema.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <Dato valor="+600.000" etiqueta="empresas activas en Argentina" />
          <Dato valor="99%" etiqueta="de menos de 200 empleados" />
          <Dato valor="~USD 100M" etiqueta="de mercado direccionable local por año, a USD 15/mes" />
        </div>
      </div>
      <p className="mt-10 text-xs leading-relaxed text-tenue">
        Estimación propia del equipo sobre datos públicos de empresas activas. No es un dato
        censado.
      </p>
    </Seccion>
  );
}

const FUENTES = [
  {
    nivel: "Municipal",
    detalle: "Datos abiertos de Rosario — normativas en CSV, con link al texto completo.",
    href: "https://datosabiertos.rosario.gob.ar",
    dominio: "datosabiertos.rosario.gob.ar",
  },
  {
    nivel: "Nacional",
    detalle:
      "Base InfoLEG del Ministerio de Justicia — todo lo publicado en el Boletín Oficial desde 1997, más las bases de modificatorias y modificadas.",
    href: "https://datos.jus.gob.ar",
    dominio: "datos.jus.gob.ar",
  },
  {
    nivel: "Provincial",
    detalle: "Portal nacional de datos abiertos — normativa provincial.",
    href: "https://datos.gob.ar",
    dominio: "datos.gob.ar",
  },
];

function Fuentes() {
  return (
    <Seccion volanta="De dónde sale" titulo="Fuentes oficiales, verificables una por una.">
      <ul className="divide-y divide-borde border-y border-borde">
        {FUENTES.map((f) => (
          <li key={f.nivel} className="py-6 md:grid md:grid-cols-[8rem_1fr_auto] md:gap-6">
            <p className="font-semibold">{f.nivel}</p>
            <p className="mt-1 text-sm leading-relaxed text-tenue md:mt-0">{f.detalle}</p>
            <a
              href={f.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline underline-offset-4 md:mt-0"
            >
              {f.dominio}
            </a>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function Cierre() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <p className="max-w-3xl font-display text-3xl leading-tight md:text-5xl">
        Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="rounded-md bg-tinta px-6 py-3 text-sm font-medium text-papel transition-opacity hover:opacity-85"
        >
          Ver la demo
        </Link>
      </div>
      <p className="mt-16 border-t border-borde pt-6 text-sm text-tenue">
        Vigente — normativa nacional, provincial y municipal traducida a obligaciones con
        vencimiento.
      </p>
    </footer>
  );
}
