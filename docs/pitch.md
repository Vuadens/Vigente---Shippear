# Pitch — Vigente

> Duración objetivo: **3:00** (≈1:20 de discurso + ≈1:30 de demo + ≈10s de cierre).
> Tono: directo y afilado. Frases cortas. Foco en el dolor y en la plata.
> Regla de oro: **no leer**. Estos son los golpes; el orden importa más que las palabras exactas.

---
es por bloque y un anexo
## Estructura y tiempos

| Bloque | Tiempo | Objetivo |
|---|---|---|
| 1. Gancho | 0:00 – 0:15 | Que sientan el costo de no enterarse |
| 2. Problema | 0:15 – 0:35 | Las 3 fallas encadenadas |
| 3. Solución | 0:35 – 0:55 | La frase ancla + "obligaciones, no documentos" |
| 4. Demo | 0:55 – 2:25 | El producto funcionando (ver `guion-demo.md`) |
| 5. Por qué ahora + mercado | 2:25 – 2:50 | Timing y tamaño |
| 6. Cierre | 2:50 – 3:00 | Una frase que quede |

---

## 1. Gancho — 0:00 a 0:15

> Un bar en Rosario está obligado, al mismo tiempo, por una ordenanza municipal, una ley provincial y una resolución nacional. Las tres son públicas. Las tres son gratis. Y aun así el dueño se entera cuando le llega la multa.

*(Pausa. Dejar que el absurdo asiente.)*

---

## 2. Problema — 0:15 a 0:35

> El problema no es acceso. Todo está publicado. El problema es distribución, y son tres fallas encadenadas:
>
> Uno: nadie sabe **cuál** norma le aplica.
> Dos: nadie sabe **qué sigue vigente** después de años de modificaciones y derogaciones.
> Tres: nadie sabe **para cuándo** tiene que cumplir.
>
> Las empresas grandes lo resuelven con abogados y compliance. El 99% del entramado productivo argentino, no. Se entera tarde.

---

## 3. Solución — 0:35 a 0:55

> Vigente toma normativa de los tres niveles de gobierno, reconstruye qué está efectivamente vigente hoy, y la cruza contra tu perfil.
>
> No te devuelve documentos. Te devuelve **obligaciones**: qué cambió, por qué te afecta, qué tenés que hacer y hasta cuándo.
>
> Y lo hace de dos formas, que son las dos mitades del producto:
>
> **Pull** — le preguntás en lenguaje natural lo que estás por hacer, y te devuelve tus obligaciones al instante.
> **Push** — guardás tu perfil una vez, y Vigente te vigila la normativa. Cuando se sanciona una ordenanza nueva, cambia una ley o vence un plazo que te afecta, te avisa. Solo. Sin que vuelvas a preguntar.
>
> Esa es la diferencia real: el trabajo de estar al día deja de ser tuyo. En una frase: **preguntale lo que estás por hacer, o dejá que te avise cuando cambie lo que ya hacés.**
>
> Se los muestro.

*(Cambiar a la pantalla. Empieza la demo — `guion-demo.md`.)*

---

## 4. Demo — 0:55 a 2:25

> Ver `docs/guion-demo.md`. Los cuatro golpes que no pueden faltar aunque haya que recortar:
> - **Apertura (pull):** "quiero construir algo en mi casa" → obligaciones en 5 segundos.
> - **Vigencia:** una norma derogada por otra posterior, y el sistema resolviendo cuál rige hoy. *Esto prueba que no es un buscador.*
> - **Push (la 2da funcionalidad):** guardar el perfil → cae una alerta de una ordenanza nueva que afecta a ese perfil. *Esto prueba que el producto trabaja solo, aun cuando no le preguntás nada.*
> - **Cierre (perfil en vivo):** tipear dirección y rubro nuevos, la lista cambia. *Esto es lo que hace que se lo crean.*

---

## 5. Por qué ahora + mercado — 2:25 a 2:50

> ¿Por qué ahora? Porque leer y estructurar un texto legal pasó de costar decenas de dólares a fracciones de centavo. Recién ahora es viable servir a la cola larga y no solo a corporaciones. Al mismo tiempo los datos se abrieron, y la volatilidad regulatoria está en un pico: cuanto más rápido cambian las reglas, más caro sale no enterarse.
>
> El mercado: más de 600.000 empresas activas en Argentina, 99% pymes. A 15 dólares por mes son cerca de 100 millones anuales acá. Y el producto se replica a toda la región cambiando **solo la fuente de ingesta** — todos los países tienen boletín oficial y el mismo problema.

---

## 6. Cierre — 2:50 a 3:00

> La ley ya está escrita. Nosotros nos aseguramos de que te enteres **antes** de la multa, no después. Eso es Vigente.

---

## Anexo — respuestas afiladas para el Q&A del jurado

**"¿Esto no es un chatbot / un RAG?"**
> No. El modelo hace una sola cosa: convertir tu pregunta en un perfil. Las obligaciones salen de un corpus curado, con la fuente oficial citada en cada una. Si no tenemos normativa que aplique, lo decimos. **No inventamos** — en un producto legal, alucinar es peor que no responder.

**"¿Cómo resuelven la vigencia?"**
> Cada norma trae sus relaciones —qué modifica, qué deroga, qué prorroga— y las resolvemos dentro del corpus. Por eso el corpus se **cura** norma por norma: 60 bien elegidas, no mil al azar. Una modificatoria que no está en el corpus, no existe para el sistema; y elegimos las normas justamente para que eso no pase en los casos que importan.

**"¿Latencia? ¿Y si se cae la API en la demo?"**
> El procesamiento de normas es un **build step**, batch nocturno. La app lee JSON estático. Lo que ven es el output, que además es como funcionaría en producción. Cero latencia, cero llamadas en vivo.

**"¿Y la base de datos / los usuarios?"**
> Persistimos una sola cosa: el perfil, para el modo alerta. Las normas viven en el repo, las alertas se computan al leer. No hay login ni cuentas: la consulta *es* el onboarding.

**"¿Cómo consiguen los primeros clientes?"**
> El canal son los **contadores**. Cada uno atiende cientos de pymes y hoy absorbe estas consultas gratis y a destiempo. Les damos la herramienta a ellos.
