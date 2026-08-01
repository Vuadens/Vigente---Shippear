# Vigente — brief de arranque

Documento de trabajo para el equipo. Todo lo que está acá es alcance del día. Lo que no está, no se construye.

> **Decisiones de implementación:** las decisiones tomadas sobre este brief están en [`docs/adr/`](docs/adr/). Resumen: monorepo pnpm (ADR-0001), TypeScript en todo incluido el pipeline (ADR-0002), LLM vía Vercel AI Gateway + AI SDK con `generateObject` y fallback determinístico en la demo (ADR-0003), Neon Postgres solo para perfiles (ADR-0004). Glosario del dominio en [`CONTEXT.md`](CONTEXT.md); reglas para agentes en [`CLAUDE.md`](CLAUDE.md)/[`AGENTS.md`](AGENTS.md).

## Setup (una vez)

```bash
pnpm install        # raíz del repo; instala los 5 workspaces
cp .env.example .env  # completar AI_GATEWAY_API_KEY (Franco); DATABASE_URL solo Joako
pnpm dev            # levanta apps/web en localhost:3000
```

Estructura: `apps/web` (front, deploy Vercel con root directory `apps/web`) · `packages/schema` (contrato Zod congelado) · `packages/matcher` · `packages/pipeline` · `packages/db` · `data/` (JSON commiteado).

---

## 1. Qué es

Un sistema que toma normativa pública de los tres niveles de gobierno (nacional, provincial, municipal), reconstruye qué está efectivamente vigente, y la traduce a **obligaciones concretas con vencimiento** para una persona o empresa específica.

Funciona en dos modos sobre la misma base:

- **Pull (consulta por intención).** El usuario escribe qué está por hacer — "quiero construir algo en mi casa, ¿qué tengo que saber?" — y el sistema devuelve las obligaciones que se activan.
- **Push (alerta por perfil).** El usuario tiene un perfil cargado y el sistema le avisa cuando cambia algo que lo afecta.

La frase que resume el producto: **preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.**

### El problema

La información está publicada, es gratis y aun así no llega. No es un problema de acceso, es de distribución. Tres fallas encadenadas:

1. Nadie sabe cuál norma le aplica.
2. Nadie sabe qué está vigente después de tantas modificaciones y derogaciones parciales.
3. Nadie sabe para cuándo tiene que cumplir.

La unidad de valor no es la norma: es la obligación con vencimiento.

---

## 2. Decisión de arquitectura (leer antes de codear)

**El pipeline es un build step, no runtime.**

Se bajan los datos una vez, se procesan las normas con el LLM una sola vez, y el resultado se commitea al repo como JSON estático. La app lee ese JSON.

Esto elimina de un saque: latencia en la demo, llamadas a API que fallan en el escenario, costos, rate limits y base de datos.

Si alguien pregunta en el pitch, la respuesta es que el procesamiento es batch nocturno y esto es el output — que además es como funcionaría en producción.

**Corolario:** no hay auth y las normas son JSON estático en el repo. Única excepción (ADR-0004): una tabla `perfiles` en Neon Postgres para el modo push, con fallback a JSON en memoria si falla.

---

## 3. Contrato de datos

Este objeto es el contrato que permite trabajar en paralelo sin pisarse. Se congela antes de escribir la primera línea de lógica.

```json
{
  "id": "ord-10919-2026",
  "jurisdiccion": "municipal",
  "tipo": "Ordenanza",
  "numero": "10919/2026",
  "fecha_publicacion": "2026-07-20",
  "url_fuente": "https://...",
  "resumen_llano": "una frase, sin jerga legal",
  "obligaciones": [
    {
      "que_hacer": "",
      "alcanzados": { "rubros": [], "condiciones": [] },
      "plazo": {
        "tipo": "fecha_fija | dias_desde_publicacion | permanente",
        "valor": ""
      },
      "si_no_cumplis": "",
      "confianza": 0.0
    }
  ],
  "geo": {
    "tipo": "ciudad | zona | tramo | punto",
    "descripcion": "",
    "coords": []
  },
  "relaciones": [
    { "tipo": "modifica | deroga | prorroga", "norma": "ord-9027-2012" }
  ]
}
```

Perfil de usuario (el mismo objeto lo produce el formulario en modo push y el LLM en modo pull):

```json
{
  "tipo_sujeto": "persona_fisica | comercio",
  "rubro": "",
  "ubicacion": { "direccion": "", "coords": [] },
  "condiciones": ["local_a_la_calle", "empleados", "manipula_alimentos"],
  "intencion": ""
}
```

---

## 4. Fuentes de datos

| Nivel | Fuente | Estado |
|---|---|---|
| Municipal | `datosabiertos.rosario.gob.ar` — CSV de normativas | Estructurado, con link al texto completo, actualizado a julio 2026 |
| Nacional | `datos.jus.gob.ar` — base InfoLEG (zip/CSV) | Todo lo publicado en la primera sección del BORA desde mayo 1997, más bases separadas de modificatorias y modificadas |
| Provincial | `datos.gob.ar` — base de normativa provincial | Verificar cobertura de Santa Fe antes de comprometerlo |

La base de modificatorias/modificadas de InfoLEG da parte de las aristas del grafo de vigencia ya resueltas. Aprovecharla.

**Alcance del día:** 40 normas municipales + 20 nacionales, elegidas a mano por relevancia. No mil normas. Sesenta bien elegidas.

---

## 5. Reparto

| Quién | Rol | Entregable | Dónde vive |
|---|---|---|---|
| **Franco Franzini** | Data / pipeline (**camino crítico**) | Script que toma las 60 normas, las manda al LLM con el schema como structured output y escribe `data/normas.json`. Guarda resultados parciales: si falla en la norma 43 no se pierden las 42 anteriores. | `packages/pipeline` |
| **Valentino Dentesano** | Matching + vigencia | Función pura: perfil → lista de obligaciones ordenadas por vencimiento. Más el grafo mínimo de relaciones para marcar qué normas fueron modificadas. Trabaja contra `data/normas.ejemplo.json` mientras el pipeline no existe. | `packages/matcher` |
| **Batista Renaudo + Juanma** | Frontend | Next.js en Vercel, deployado y andando **antes** de escribir lógica. Vistas: input de consulta, lista de obligaciones con cuenta regresiva, detalle de norma, mapa con pines. También la API route de intención (modo pull) y la integración final. | `apps/web` |
| **Joako** | Pitch + BD + geo + video | Escribe el pitch desde el principio, no al final. Provisiona Neon Postgres desde Vercel Marketplace y expone `getPerfiles()`/`guardarPerfil()` con fallback a JSON (ADR-0004). En paralelo resuelve la geocodificación (solo direcciones puntuales, corte a la hora 4). Graba el video de la demo a la 6:30. | `docs/` + `packages/db` + `packages/pipeline` (geo) |

Si alguien se atrasa: el mapa es lo primero que se sacrifica; queda la lista de obligaciones, que es el core igual.

---

## 6. Modo pull — cómo se implementa

No es un chatbot con RAG sobre todo el corpus. Eso es una tarde entera y falla en el escenario. Es esto:

1. La pregunta en lenguaje natural entra al LLM con una única tarea: extraer el objeto perfil.
2. Ese perfil entra **al mismo matcher que ya existe**. Cero código nuevo en el core.
3. La respuesta se arma sobre las obligaciones que devuelve el matcher, con las fuentes citadas.

Son ~60 líneas de extracción de intención más un input de texto. Por eso es viable a esta altura.

**Detalle importante:** la consulta da el perfil gratis. La pregunta *es* el onboarding.

### Regla anti-alucinación

La respuesta se construye **solo** sobre las obligaciones del JSON, con link a la fuente oficial en cada una. Si el matcher no devuelve nada, la respuesta correcta es "no encontré normativa que aplique a esto en mi base". No inventar.

En un producto legal, inventar es peor que no responder. Un jurado que pregunte algo raro y vea que el sistema admite el límite lo va a valorar más que uno que responda cualquier cosa con confianza.

---

## 7. Cronograma y cortes duros

| Hora | Hito |
|---|---|
| 0:00 – 0:30 | Contrato de datos congelado + spike de datos en paralelo |
| 0:30 – 2:00 | Pipeline escribiendo el primer JSON válido. Frontend deployado vacío. |
| 2:00 – 5:00 | Matching, modo pull, vistas |
| 5:00 | **Congelamiento de alcance.** Lo que no está empezado, no se empieza. |
| 5:00 – 6:00 | Integración y datos seedeados |
| 6:00 – 6:30 | Deploy en prod. Recorrido completo corrido tres veces. |
| 6:30 – 7:00 | **Grabar el video de la demo.** |
| 7:00 – 8:00 | Ensayo del pitch, cronometrado, mínimo cuatro veces. |

**Corte a la hora 2:** si el pipeline no escribió un JSON válido, se simplifica el schema en el momento — se saca `geo`, se saca `relaciones`, quedan obligaciones y plazos.

**El video de la demo no es opcional.** Las demos en vivo se caen.

---

## 8. Qué NO se construye

Login. Panel de administración. Formulario dedicado de carga de perfiles (el perfil entra por la consulta del modo pull + botón "guardar mi perfil"; los de la demo van seedeados). Responsive. Manejo de errores. Búsqueda. Filtros. Onboarding. Landing page. Tablas más allá de `perfiles` (ADR-0004): ni normas ni alertas se persisten en BD.

Cada una es media hora que se le saca al único camino que ve el jurado.

---

## 9. Recorrido de la demo

Se escribe antes de codear. Lo que no está en estos pasos, no existe.

1. Se escribe en el input: *"quiero construir algo en mi casa, ¿qué tengo que saber?"*
2. Salen las obligaciones concretas con sus fuentes oficiales.
3. Se cambia de modo: perfil de un bar de Rosario cargado.
4. Mapa con la normativa georreferenciada que le toca.
5. Lista de obligaciones ordenadas por vencimiento, la más urgente arriba.
6. Se clickea una: qué cambió, por qué te afecta, qué hacer, para cuándo, link a la fuente.
7. Se muestra una norma modificada por otra posterior y cómo el sistema resuelve cuál está vigente.
8. Se tipea en vivo otra dirección y otro rubro. La lista cambia. Se toca "guardar mi perfil" y el perfil queda suscripto en la vista push.

El paso 1 se entiende en cinco segundos sin explicación previa: es la apertura.
El paso 7 demuestra que no es un buscador.
El paso 8 es el que hace que se lo crean.

---

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| El CSV no abre como se espera | Spike de datos en los primeros 20 minutos, antes que nada |
| La extracción devuelve basura | Schema simplificado + 60 normas elegidas a mano, no aleatorias |
| La geocodificación se come el día | Solo direcciones puntuales. Los tramos son v2. Corte a la hora 4. |
| El sistema alucina normativa | Respuesta construida solo sobre el JSON, con fuente en cada obligación |
| La demo se cae en vivo | Video grabado a la hora 6:30 |

---

## 11. Respuestas del formulario

**Qué problema resuelven.** Una pyme está obligada al mismo tiempo por normativa nacional, provincial y municipal, y ninguna de las tres se habla con la otra. Todo se publica, pero nadie sabe cuál le aplica, qué sigue vigente después de tantas modificaciones, ni para cuándo tiene que cumplir. Las empresas grandes lo resuelven con abogados y compliance; el 99% del entramado productivo argentino se entera cuando le llega la multa.

**Qué están construyendo.** Un sistema que ingiere normativa de los tres niveles, reconstruye qué está efectivamente vigente hoy, y la cruza contra el perfil de cada persona o empresa. En vez de documentos devuelve obligaciones concretas: qué cambió, por qué te afecta, qué tenés que hacer y hasta cuándo. Funciona en dos modos: consulta por intención en lenguaje natural, y alerta por perfil.

**Usuario inicial.** Cualquier persona o empresa alcanzada por normativa que no tenga cómo seguirla: desde un ciudadano que quiere saber qué le cambió en su barrio hasta una pyme sin abogado. Arrancamos por los perfiles de mayor exposición regulatoria —comercios con local a la calle— porque es donde el costo de no enterarse es más alto y más medible, y el canal de entrada son los contadores, que atienden cientos de pymes cada uno y hoy absorben estas consultas gratis y a destiempo.

**Mercado.** Más de 600.000 empresas activas en Argentina, 99% de menos de 200 empleados: unos USD 100M anuales de mercado direccionable local a USD 15/mes. Los rubros de alta exposición son el mercado inicial, y el producto se replica a toda la región cambiando solo la fuente de ingesta, porque todos los países tienen boletín oficial y el mismo problema.

**Por qué ahora.** El costo de leer y estructurar un texto legal se derrumbó de decenas de dólares a fracciones de centavo, lo que recién ahora hace viable servir a la cola larga y no solo a corporaciones. Al mismo tiempo los datos se abrieron (base nacional completa desde 1997, provinciales y municipales en formatos procesables) y la volatilidad regulatoria argentina está en un pico: cuanto más rápido cambian las reglas, más caro sale no enterarse.