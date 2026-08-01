# 0002 — TypeScript en todo el monorepo (pipeline incluido)

**Estado:** aceptada · 2026-08-01

## Contexto

El pipeline de ingesta podría escribirse en Python (pandas, ecosistema de scraping). El resto del stack es TypeScript (Next.js, matcher).

## Decisión

TypeScript para todo, incluido el pipeline.

## Razones

- El contrato de datos vive una sola vez: `packages/schema` en Zod se usa como structured output del SDK de Anthropic, como tipos del matcher y como validación en el front. Con Python habría que mantener un espejo Pydantic sincronizado.
- Un solo toolchain (`pnpm install`) para las 5 personas; sin venvs.
- El volumen (60 normas elegidas a mano) no justifica pandas; `csv-parse` alcanza.

## Consecuencias

- Cualquier ajuste al contrato durante el hackathon se hace en un solo archivo.
- Si alguien del equipo es más rápido en Python, no aplica: el pipeline lo lleva el equipo backend que trabaja en TS.
