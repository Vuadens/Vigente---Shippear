# 0008 — Síntesis grounded en `/api/respuesta` (amplía ADR-0003)

**Estado:** aceptada · 2026-08-01

## Contexto

Probando la demo con una consulta real ("soy monotributista, cobré 2000 USD por PayPal, ¿tengo que declararlos?") el sistema devolvió **132 obligaciones** y ninguna respuesta. El matcher filtra bien, pero una lista no contesta la pregunta: al usuario no le interesa leer la ley, le interesa saber si tiene que hacer algo. Lo mismo en Monitoreo: lo principal debe ser el accionar, no el inventario.

ADR-0003 fijaba una única llamada LLM en runtime (`/api/intent`). Esa restricción protegía dos cosas: costo/latencia y la regla anti-alucinación (README §6). La síntesis se puede agregar sin romper la segunda.

## Decisión

- Nueva ruta **`/api/respuesta`** (segunda y última llamada LLM runtime): recibe `{ pregunta, perfil }`, recomputa `match()` en el server y le pide a `anthropic/claude-sonnet-5` (`generateObject` + `RespuestaSchema` de `@vigente/schema`) una respuesta corta.
- **Grounding estricto:** el prompt solo contiene las obligaciones matcheadas, numeradas. El modelo contesta usando únicamente esa lista, referencia las relevantes **por índice**, y si nada responde la pregunta debe decirlo ("la normativa que tengo cargada no cubre X"). Índices fuera de rango se descartan en el server. Los links a fuentes los renderiza el front desde el corpus — el modelo nunca produce una cita.
- Los índices se corresponden 1:1 con los items de `/api/match` porque ambos usan el mismo `match()` determinístico.
- **Consultar:** la respuesta va arriba (acción principal + texto + obligaciones relevantes); la lista completa queda plegada en un `<details>`. La lista aparece primero y la síntesis llega después, sin bloquear.
- **Monitoreo:** al seleccionar un perfil guardado se pide la misma síntesis con `perfil.intencion` (o una pregunta genérica de cumplimiento) y se muestra como "Tu accionar". No se sintetiza en cada tecleo del builder — solo perfiles guardados.
- `RespuestaSchema` se agrega a `@vigente/schema` de forma aditiva (mismo criterio que `RUBROS`).

## Alternativas consideradas

- **Sintetizar dentro de `/api/intent`:** mezcla dos pasos con contratos distintos y obliga a mover el match al lado del LLM. Peor para el fallback de guión, que hoy no toca la API.
- **Síntesis en el cliente con los items ya fetcheados:** expone el prompt y duplica la lógica de compactación; el server ya tiene el corpus.
- **No sintetizar (estado anterior):** deja la demo sin respuesta a la pregunta del usuario, que es el producto.

## Consecuencias

- Runtime pasa de una a **dos** llamadas LLM (`/api/intent`, `/api/respuesta`). CLAUDE.md/AGENTS.md regla 2 actualizada.
- Sin `AI_GATEWAY_API_KEY` la síntesis falla: el front lo tolera (la lista se muestra igual, el `<details>` queda abierto).
- La latencia percibida de la respuesta es la del modelo (~2–5 s); la lista no espera.
