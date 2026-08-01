# 0005 — El pipeline extrae con Sonnet 5, no con Sonnet 4.5

**Estado:** aceptada · 2026-08-01 · actualiza [ADR-0003](0003-llm-via-vercel-ai-gateway.md)

## Contexto

ADR-0003 fijó `anthropic/claude-sonnet-4.5` como modelo vía Vercel AI Gateway. La generación vigente al momento de escribir el pipeline es Sonnet 5 (`anthropic/claude-sonnet-5`), y la única tarea del pipeline es extracción estructurada — justo donde está la mejora.

## Decisión

`packages/pipeline` usa `anthropic/claude-sonnet-5`. El resto de ADR-0003 (gateway, AI SDK, `generateObject()`, schemas de `@vigente/schema`) queda igual.

## Por qué

- Mejor en extracción estructurada, que es literalmente lo único que hace el pipeline.
- Precio introductorio vigente hasta el 2026-08-31: USD 2/10 por millón de tokens contra 3/15.
- Sigue instrucciones más literalmente que 4.5. Para la regla anti-alucinación (README §6) eso juega a favor: "si el dato no está en el texto, dejá el campo vacío" se cumple al pie de la letra. La contracara es que el prompt tiene que ser preciso y no aspiracional.

## Consecuencias

- `MODELO` es una constante única en `extraer.ts`. Si el gateway no expone el slug, volver a `anthropic/claude-sonnet-4.5` es una línea.
- No verificamos el slug contra el gateway al escribir esto (hace falta `AI_GATEWAY_API_KEY`). Es el primer punto a chequear si el pipeline falla en la primera corrida.
- `apps/web` (modo pull) no está cubierto por este ADR: es otro workspace y otro dueño.
