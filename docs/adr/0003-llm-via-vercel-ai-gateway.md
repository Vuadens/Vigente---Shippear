# 0003 — LLM vía Vercel AI Gateway + AI SDK, con fallback determinístico en la demo

**Estado:** aceptada · 2026-08-01

## Contexto

Hay dos consumidores de LLM: el pipeline (build step, extrae obligaciones de 60 normas) y el modo pull (runtime, extrae el objeto perfil de una pregunta en lenguaje natural). No tenemos `ANTHROPIC_API_KEY`; el sponsor del hackathon es Vercel.

## Decisión

- **Proveedor:** Vercel AI Gateway (`AI_GATEWAY_API_KEY`; en deploys de Vercel la auth OIDC es automática). Modelos Claude vía gateway (ej. `anthropic/claude-sonnet-4.5`). Fallback si el gateway falla: `ANTHROPIC_API_KEY` directa.
- **SDK:** Vercel AI SDK (`ai`), usando `generateObject()` con los schemas Zod de `packages/schema` como structured output. Mismo código en pipeline y runtime.
- **Runtime mínimo:** la única llamada LLM en runtime es texto → perfil, en `apps/web/app/api/intent/route.ts`. El matcher es función pura sin LLM.
- **Fallback determinístico:** las preguntas del guión de la demo tienen su perfil precomputado en un JSON; si el input coincide, no se llama a la API. La pregunta libre del jurado (paso 8 de la demo) usa la API viva; la red de seguridad final es el video grabado.

## Alternativas consideradas

- Todo precomputado: mata el paso 8 de la demo ("el que hace que se lo crean").
- SDK de Anthropic directo: requiere una key que no tenemos; el AI SDK + Gateway usa los créditos del sponsor y el mismo `generateObject` sirve para ambos consumidores.

## Consecuencias

- El pipeline corre local con `AI_GATEWAY_API_KEY` en `.env`.
- En Vercel no hay secrets que configurar a mano si se usa OIDC.
- Cambiar de modelo es un string, no un refactor.
