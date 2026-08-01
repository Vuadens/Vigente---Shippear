import Link from "next/link";
import type { Norma, Plazo } from "@vigente/schema";
import normasEjemplo from "../../../../data/normas.ejemplo.json";
import { Brand } from "../../components/brand";
import { ThemeToggle } from "../../components/theme-toggle";
import { Dato, Seccion, Tarjeta } from "./_ui";

// Landing de pitch (ADR-0007). Estática: sin `use client`, sin fetch, sin BD.
// El contenido sale de README §1, §2, §4 y §11; el ejemplo de obligación sale
// del seed, nunca de copy inventado (regla anti-alucinación, README §6).

export const metadata = {
  title: "Vigente — la normativa que te aplica, con fecha de vencimiento",
  description:
    "Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés. " +
    "Normativa nacional, provincial y municipal traducida a obligaciones concretas con vencimiento.",
};

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
    <main className="landing">
      <header className="masthead">
        <Brand />
        <nav className="nav">
          <Link href="/">Consultar</Link>
          <Link href="/panel">Monitoreo</Link>
          <ThemeToggle />
        </nav>
      </header>

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
    <section className="landing-hero">
      <p className="landing-volanta">Nacional · provincial · municipal</p>
      <h1 className="landing-h1">
        Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.
      </h1>
      <p className="landing-sub">
        Vigente ingiere la normativa de los tres niveles de gobierno, reconstruye qué está
        efectivamente vigente hoy y la traduce a obligaciones concretas con vencimiento para tu
        caso. No devuelve documentos: devuelve qué tenés que hacer y hasta cuándo.
      </p>
      <div className="landing-cta">
        <Link href="/" className="btn">
          Probar la consulta
        </Link>
        <span className="landing-cta-nota">o mirá el monitoreo por perfil</span>
      </div>
    </section>
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
      <ol className="landing-grid cols-3">
        {FALLAS.map((f, i) => (
          <li key={f.titulo}>
            <Tarjeta>
              <p className="landing-num">{i + 1}</p>
              <h3>{f.titulo}</h3>
              <p>{f.detalle}</p>
            </Tarjeta>
          </li>
        ))}
      </ol>
      <p className="landing-remate">
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
      <ol className="landing-grid cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo}>
            <Tarjeta>
              <p className="landing-num">{i + 1}</p>
              <h3>{p.titulo}</h3>
              <p>{p.detalle}</p>
            </Tarjeta>
          </li>
        ))}
      </ol>

      <div className="landing-grid cols-2" style={{ marginTop: "1.25rem" }}>
        <Tarjeta>
          <p className="landing-modo">Modo pull</p>
          <h3>Consulta por intención</h3>
          <p>
            Escribís en lenguaje natural qué estás por hacer — “quiero construir algo en mi casa,
            ¿qué tengo que saber?” — y salen las obligaciones que se activan. La pregunta arma tu
            perfil sola: no hay formulario previo.
          </p>
        </Tarjeta>
        <Tarjeta>
          <p className="landing-modo push">Modo push</p>
          <h3>Alerta por perfil</h3>
          <p>
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

  return (
    <Seccion
      hondo
      volanta="Qué devuelve"
      titulo="Una obligación, no un documento. Con fuente oficial en cada una."
    >
      <div className="landing-anatomia">
        <Tarjeta>
          <div className="landing-meta">
            <span className="landing-jur">{ejemplo.jurisdiccion}</span>
            <span>
              {ejemplo.tipo} {ejemplo.numero}
            </span>
            <span>·</span>
            <span>{ejemplo.geo.descripcion}</span>
          </div>
          <p style={{ marginTop: "0.9rem" }}>{ejemplo.resumen_llano}</p>

          <dl className="landing-dl">
            <div>
              <dt>Qué hacer</dt>
              <dd>{obligacion.que_hacer}</dd>
            </div>
            <div>
              <dt>A quién alcanza</dt>
              <dd>
                <span className="landing-chips">
                  {alcanzados.map((a) => (
                    <span key={a} className="landing-chip-dato">
                      {a}
                    </span>
                  ))}
                </span>
              </dd>
            </div>
            <div>
              <dt>Plazo</dt>
              <dd>{textoPlazo(obligacion.plazo)}</dd>
            </div>
            <div>
              <dt>Si no cumplís</dt>
              <dd>{obligacion.si_no_cumplis}</dd>
            </div>
          </dl>

          <p style={{ marginTop: "1.25rem" }}>
            <a href={ejemplo.url_fuente} target="_blank" rel="noreferrer">
              Ver la norma en la fuente oficial
            </a>
          </p>
        </Tarjeta>

        <div className="landing-nota">
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
    <Seccion
      volanta="Por qué ahora"
      titulo="Tres cosas que hace cinco años no eran ciertas a la vez."
    >
      <div className="landing-grid cols-3">
        {AHORA.map((a) => (
          <Tarjeta key={a.titulo}>
            <h3>{a.titulo}</h3>
            <p>{a.detalle}</p>
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
      <div className="landing-dos-col">
        <div>
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
        <div className="landing-datos">
          <Dato valor="+600.000" etiqueta="empresas activas en Argentina" />
          <Dato valor="99%" etiqueta="de menos de 200 empleados" />
          <Dato valor="~USD 100M" etiqueta="de mercado direccionable local por año, a USD 15/mes" />
        </div>
      </div>
      <p className="landing-pie-nota">
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
      <ul className="landing-fuentes">
        {FUENTES.map((f) => (
          <li key={f.nivel}>
            <p className="landing-fuente-nivel">{f.nivel}</p>
            <p className="landing-fuente-detalle">{f.detalle}</p>
            <a href={f.href} target="_blank" rel="noreferrer">
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
    <footer className="landing-cierre">
      <p className="landing-h1" style={{ marginTop: 0 }}>
        Preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.
      </p>
      <div className="landing-cta">
        <Link href="/" className="btn">
          Probar la consulta
        </Link>
      </div>
      <p className="landing-pie">
        Vigente — normativa nacional, provincial y municipal traducida a obligaciones con
        vencimiento.
      </p>
    </footer>
  );
}
