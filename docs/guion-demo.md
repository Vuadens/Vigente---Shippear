# Guion de la demo — Vigente

> Duración objetivo: **~1:35** dentro del pitch (bloque 4). Dos funcionalidades a mostrar: **pull** (pasos 1–7) y **push / alertas** (pasos 8–9).
> Cada paso tiene: **ACCIÓN** (qué se hace en pantalla) · **EN PANTALLA** (qué debe verse) · **SE DICE** (la línea hablada).
> Basado en el recorrido del README §9 y en el **corpus real** de `data/normas.json` (57 normas) y `data/perfiles.json`.
> **Regla:** lo que no está en estos pasos, no se muestra. Si algo no carga, se salta y se sigue — nunca se debuggea en vivo.

---

## Datos que deben estar seedeados antes de empezar

- **Apertura (pull):** la frase del guión *"quiero construir algo en mi casa, ¿qué tengo que saber?"* tiene fallback determinístico en `/api/intent` (no gasta API ni puede fallar) y matchea el **Reglamento de Edificación** (`ord-8336-2008`) + `ord-10720-2024`.
- **Perfil bar:** `Bar La Maquinita` — gastronomía, Av. Pellegrini 1234, `local_a_la_calle`.
- **Caso vigencia:** `ord-10720-2024` (factibilidad de servicios antes del permiso) **deroga** `ord-8952-2012` — la vista muestra el diff "Antes (tachado) → Ahora".
- **Segundo perfil (paso 8):** dirección + rubro nuevos, tipeados en vivo en el builder.
- **Alerta push (paso 9):** la norma-novedad es `ord-10608-2024` (mesas y sillas en la vereda), disparada con el botón **"⚡ Simular normativa entrante"** del panel. Requiere `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en Vercel para que además llegue al teléfono.

---

## Paso 1 — Apertura en modo pull (0:00–0:12 de la demo)

- **ACCIÓN:** Escribir en el input: *"quiero construir algo en mi casa, ¿qué tengo que saber?"* y enviar.
- **EN PANTALLA:** El input de consulta, limpio. Sin menús, sin login.
- **SE DICE:** *"Le pregunto en lenguaje natural, como le preguntarías a un conocido."*

## Paso 2 — Aparece la respuesta (0:12–0:22)

- **ACCIÓN:** Esperar el render: primero la lista, ~3 s después la **respuesta sintetizada** arriba (acción principal en negrita + obligaciones relevantes destacadas; el resto queda plegado).
- **EN PANTALLA:** La tarjeta "Respuesta" con la acción principal (permisos del Reglamento de Edificación), las obligaciones que la sostienen con su consecuencia y el **link a la fuente oficial**.
- **SE DICE:** *"No me devolvió un PDF de treinta páginas ni una lista de cien leyes: me contesta la pregunta. Qué tengo que hacer, qué pasa si no lo hago, y el link a la norma oficial que lo respalda."*

## Paso 3 — Cambio a un perfil real (0:22–0:32)

- **ACCIÓN:** Cambiar de modo. Cargar el perfil de **Bar La Maquinita** (gastronomía, Rosario, local a la calle).
- **EN PANTALLA:** El perfil activo del bar.
- **SE DICE:** *"Ahora el otro modo. Este es un bar de Rosario, con local a la calle. El sistema ya sabe quién es."*

## Paso 4 — Mapa georreferenciado (0:32–0:40)

- **ACCIÓN:** Mostrar el mapa con los pines de la normativa que le toca al bar.
- **EN PANTALLA:** Mapa con pin en Rosario / zona del bar.
- **SE DICE:** *"Acá está la normativa que le aplica, ubicada en el mapa."*
- **NOTA:** si el mapa no está listo, se salta directo al paso 5 sin mencionarlo. El core es la lista, no el mapa. **Estado actual: las normas del corpus tienen `coords: []` (falta `geocodificar.ts`) — sin eso no hay pines: saltear este paso.**

## Paso 5 — Obligaciones por horizonte + accionar (0:40–0:50)

- **ACCIÓN:** Mostrar la tarjeta **"Tu accionar"** (síntesis del perfil) y la timeline agrupada por horizonte temporal.
- **EN PANTALLA:** Arriba, el accionar del bar en una frase; debajo, la lista agrupada (lo urgente primero, lo permanente después), con el permiso de mesas en la vereda (`ord-10608-2024`) visible.
- **SE DICE:** *"El sistema le dice qué atender primero, y abajo todas sus obligaciones ordenadas por urgencia. Esto es lo que ningún boletín oficial te da."*

## Paso 6 — Detalle de una obligación (0:50–1:00)

- **ACCIÓN:** Expandir la obligación del permiso de mesas (`ord-10608-2024`).
- **EN PANTALLA:** Qué cambió · por qué te afecta · qué hacer · consecuencia · link a la fuente. Badge **"Modificada"** donde corresponda.
- **SE DICE:** *"Entro y tengo todo: qué cambió, por qué me afecta a mí, qué hago y qué pasa si no. Con la fuente al lado."*

## Paso 7 — Vigencia (el golpe) (1:00–1:15)

- **ACCIÓN:** Con el perfil de obra (o la consulta del paso 1), expandir una obligación de `ord-10720-2024`: el diff **"Antes (tachado) → Ahora"** contra `ord-8952-2012`.
- **EN PANTALLA:** La obligación vieja tachada (certificación de factibilidad de 2012), la nueva al lado (trámite de factibilidad de 2024).
- **SE DICE:** *"Y acá está la diferencia. Hasta 2024 esto se tramitaba así. Esta ordenanza lo derogó y ahora se hace de otra forma. Un buscador te devolvería las dos normas y te dejaría adivinar. Vigente resuelve **cuál rige hoy**. Por eso no es un buscador."*

## Paso 8 — Perfil en vivo (1:15–1:22)

- **ACCIÓN:** Tipear en vivo otra dirección y otro rubro. La lista cambia. Tocar **"guardar mi perfil"**.
- **EN PANTALLA:** La lista de obligaciones se actualiza al nuevo perfil; al guardar, el perfil queda suscripto en la vista push.
- **SE DICE:** *"Cambio la dirección y el rubro… y la lista cambia sola. Guardo el perfil. Y acá es donde arranca la segunda mitad del producto."*

## Paso 9 — Push: la alerta que llega sola (el golpe final) (1:22–1:35)

- **ACCIÓN:** Con el perfil del bar seleccionado en Monitoreo, tocar **"⚡ Simular normativa entrante"**. En pantalla aparece el banner de la novedad y sube el badge 🔔; **el teléfono, a mano y con volumen, suena: la misma alerta llegó por Telegram**. Levantarlo y mostrarla.
- **EN PANTALLA:** Banner *"🔔 Nueva ordenanza que te afecta — Ord. 10608/2024 (mesas y sillas en la vereda)"* con qué hacer + consecuencia + fuente. En el teléfono, el mensaje del bot con el mismo contenido y el link a la fuente oficial.
- **SE DICE:** *"Fijate: yo no pregunté nada. Se subió una ordenanza nueva que afecta a este bar, Vigente la detectó y avisó solo — en la app y en el teléfono del dueño, que ni siquiera tiene que tenerla abierta. Guardás tu perfil una vez y el sistema te vigila la normativa: te enterás antes de la multa. Preguntale lo que vas a hacer, o dejá que te avise cuando cambie lo que ya hacés."*
- **NOTA (honestidad):** si el jurado pregunta, el botón simula el disparador porque el corpus de la demo es estático; el mensaje y su contenido son reales (bot real, obligación real del corpus, fuente real). En producción el disparador es el batch nocturno.

---

## Plan B (recortes si el tiempo aprieta)

1. Sacar el **mapa** (paso 4). Es lo primero que se sacrifica.
2. Sacar el **detalle** (paso 6): del paso 5 saltar directo al 7.
3. Fusionar **paso 8 en el 9**: guardar el perfil y saltar directo a la alerta.
4. Núcleo irreductible: **paso 1 → 2 → 7 → 9**. Pull, obligaciones, vigencia y **push (la alerta que llega sola)**. Las dos funcionalidades tienen que verse sí o sí.

## Checklist previo a grabar / presentar

- [ ] Perfil de Bar La Maquinita seedeado y cargando.
- [ ] Créditos del AI Gateway con saldo (sin saldo, `/api/intent` y `/api/respuesta` fallan; la frase del guión del paso 1 funciona igual por fallback).
- [ ] Diff "Antes → Ahora" visible: `ord-10720-2024` vs `ord-8952-2012` con el perfil de obra.
- [ ] Tarjeta "Tu accionar" renderizando para el perfil del bar en Monitoreo.
- [ ] Segundo perfil (dirección + rubro) probado: la lista efectivamente cambia.
- [ ] Botón "guardar mi perfil" deja el perfil en la barra de Monitoreo.
- [ ] **Telegram:** `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` cargados en Vercel; botón "⚡ Simular normativa entrante" probado y el mensaje llegando al teléfono del presentador (volumen alto, chat del bot abierto).
- [ ] Recorrido corrido tres veces sin tocar nada más.
