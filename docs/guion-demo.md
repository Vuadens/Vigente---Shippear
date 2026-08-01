# Guion de la demo — Vigente

> Duración objetivo: **~1:35** dentro del pitch (bloque 4). Dos funcionalidades a mostrar: **pull** (pasos 1–7) y **push / alertas** (pasos 8–9).
> Cada paso tiene: **ACCIÓN** (qué se hace en pantalla) · **EN PANTALLA** (qué debe verse) · **SE DICE** (la línea hablada).
> Basado en el recorrido del README §9 y en los datos reales de `data/normas.ejemplo.json` y `data/perfiles.json`.
> **Regla:** lo que no está en estos pasos, no se muestra. Si algo no carga, se salta y se sigue — nunca se debuggea en vivo.

---

## Datos que deben estar seedeados antes de empezar

- **Norma apertura:** `ord-10500-2024` — permiso de edificación (aplica a `obra_en_vivienda`).
- **Perfil bar:** `Bar La Maquinita` — gastronomía, Av. Pellegrini 1234, `local_a_la_calle`.
- **Caso vigencia:** `ord-10800-2025` (permiso de mesas en la vereda) **deroga** `ord-9027-2012` (vieja declaración jurada).
- **Segundo perfil (paso 8):** dirección + rubro nuevos, tipeados en vivo.
- **Alerta push (paso 9):** `ord-10800-2025` cargada como notificación pendiente contra el perfil del bar, para que la vista de alertas la muestre al guardar.

---

## Paso 1 — Apertura en modo pull (0:00–0:12 de la demo)

- **ACCIÓN:** Escribir en el input: *"quiero construir algo en mi casa, ¿qué tengo que saber?"* y enviar.
- **EN PANTALLA:** El input de consulta, limpio. Sin menús, sin login.
- **SE DICE:** *"Le pregunto en lenguaje natural, como le preguntarías a un conocido."*

## Paso 2 — Aparecen las obligaciones (0:12–0:22)

- **ACCIÓN:** Esperar el render de la lista de obligaciones.
- **EN PANTALLA:** La obligación "Presentar el permiso de edificación antes de iniciar la obra", con su consecuencia (paralización + multa) y el **link a la fuente oficial**.
- **SE DICE:** *"En cinco segundos me dice qué tengo que hacer, qué pasa si no lo hago, y me deja el link a la norma oficial. No me devolvió un PDF de treinta páginas: me devolvió la obligación."*

## Paso 3 — Cambio a un perfil real (0:22–0:32)

- **ACCIÓN:** Cambiar de modo. Cargar el perfil de **Bar La Maquinita** (gastronomía, Rosario, local a la calle).
- **EN PANTALLA:** El perfil activo del bar.
- **SE DICE:** *"Ahora el otro modo. Este es un bar de Rosario, con local a la calle. El sistema ya sabe quién es."*

## Paso 4 — Mapa georreferenciado (0:32–0:40)

- **ACCIÓN:** Mostrar el mapa con los pines de la normativa que le toca al bar.
- **EN PANTALLA:** Mapa con pin en Rosario / zona del bar.
- **SE DICE:** *"Acá está la normativa que le aplica, ubicada en el mapa."*
- **NOTA:** si el mapa no está listo, se salta directo al paso 5 sin mencionarlo. El core es la lista, no el mapa.

## Paso 5 — Obligaciones por vencimiento (0:40–0:50)

- **ACCIÓN:** Mostrar la lista ordenada, la más urgente arriba.
- **EN PANTALLA:** Lista con cuenta regresiva; arriba, el permiso de mesas en la vereda (`ord-10800-2025`, plazo 30 días desde publicación).
- **SE DICE:** *"Sus obligaciones, ordenadas por vencimiento. La más urgente primero. Esto es lo que ningún boletín oficial te da."*

## Paso 6 — Detalle de una obligación (0:50–1:00)

- **ACCIÓN:** Clickear la obligación del permiso de mesas.
- **EN PANTALLA:** Qué cambió · por qué te afecta · qué hacer · para cuándo · link a la fuente.
- **SE DICE:** *"Entro y tengo todo: qué cambió, por qué me afecta a mí, qué hago y hasta cuándo. Con la fuente al lado."*

## Paso 7 — Vigencia (el golpe) (1:00–1:15)

- **ACCIÓN:** Mostrar que `ord-10800-2025` **derogó** a `ord-9027-2012`.
- **EN PANTALLA:** La norma vieja marcada como derogada; la nueva señalada como vigente.
- **SE DICE:** *"Y acá está la diferencia. Hasta el año pasado bastaba una declaración jurada. Esta ordenanza de 2025 la derogó y ahora exige un permiso. Un buscador te devolvería las dos y te dejaría adivinar. Vigente resuelve **cuál rige hoy**. Por eso no es un buscador."*

## Paso 8 — Perfil en vivo (1:15–1:22)

- **ACCIÓN:** Tipear en vivo otra dirección y otro rubro. La lista cambia. Tocar **"guardar mi perfil"**.
- **EN PANTALLA:** La lista de obligaciones se actualiza al nuevo perfil; al guardar, el perfil queda suscripto en la vista push.
- **SE DICE:** *"Cambio la dirección y el rubro… y la lista cambia sola. Guardo el perfil. Y acá es donde arranca la segunda mitad del producto."*

## Paso 9 — Push: la alerta que llega sola (el golpe final) (1:22–1:35)

- **ACCIÓN:** Ir a la vista de alertas del perfil guardado. Mostrar una alerta nueva ya esperando: la sanción de `ord-10800-2025` (permiso de mesas en la vereda) notificada al perfil del bar. Idealmente, simular que **entra** una alerta en vivo (badge/contador que sube).
- **EN PANTALLA:** Feed de alertas del perfil. Alerta destacada: *"Nueva ordenanza que te afecta — Permiso de mesas en la vereda (Ord. 10800/2025). Plazo: 30 días."* Con qué cambió + qué hacer + link a la fuente.
- **SE DICE:** *"Fijate: yo no pregunté nada. Se subió una ordenanza nueva que afecta a este bar, y Vigente lo detectó y avisó solo. Esa es la segunda funcionalidad: guardás tu perfil una vez, y desde ahí el sistema te vigila la normativa. Cuando cambia una ley o se sube una ordenanza que te toca, te enterás acá — antes de la multa. Preguntale lo que vas a hacer, o dejá que te avise cuando cambie lo que ya hacés."*

---

## Plan B (recortes si el tiempo aprieta)

1. Sacar el **mapa** (paso 4). Es lo primero que se sacrifica.
2. Sacar el **detalle** (paso 6): del paso 5 saltar directo al 7.
3. Fusionar **paso 8 en el 9**: guardar el perfil y saltar directo a la alerta.
4. Núcleo irreductible: **paso 1 → 2 → 7 → 9**. Pull, obligaciones, vigencia y **push (la alerta que llega sola)**. Las dos funcionalidades tienen que verse sí o sí.

## Checklist previo a grabar / presentar

- [ ] Perfil de Bar La Maquinita seedeado y cargando.
- [ ] `ord-10800-2025` visible como vigente y `ord-9027-2012` como derogada.
- [ ] Cuenta regresiva mostrando la obligación de mesas arriba.
- [ ] Segundo perfil (dirección + rubro) probado: la lista efectivamente cambia.
- [ ] Botón "guardar mi perfil" lleva a la vista push (alertas).
- [ ] **Alerta push visible:** al abrir la vista de alertas del perfil guardado, la notificación de `ord-10800-2025` aparece ya esperando (ideal: entra en vivo con badge/contador).
- [ ] Recorrido corrido tres veces sin tocar nada más.
