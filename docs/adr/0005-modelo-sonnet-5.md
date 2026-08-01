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

- **Verificado contra el gateway el 2026-08-01:** `anthropic/claude-sonnet-5` responde y devuelve el objeto bien formado (~3 s, 776 tokens en una prueba mínima).
- **No hay fallback a 4.5.** `anthropic/claude-sonnet-4.5` devuelve *"Free tier users do not have access to this model"* con la misma key. O sea que la vuelta atrás que este ADR daba por sentada **no existe**: Sonnet 5 está disponible en free tier y 4.5 no. Si Sonnet 5 dejara de servir, hay que buscar otro modelo del gateway, no volver al anterior.
- El gateway **no sirve ningún request hasta que la cuenta de Vercel tenga una tarjeta cargada**, ni siquiera contra los créditos gratis. El error es explícito (`AI Gateway requires a valid credit card on file`) y no tiene nada que ver con el código.
- `MODELO` sigue siendo una constante única en `extraer.ts`.
- `apps/web` (modo pull) no está cubierto por este ADR: es otro workspace y otro dueño.
