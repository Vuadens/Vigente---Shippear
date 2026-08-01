# 0001 — Monorepo pnpm con workspaces

**Estado:** aceptada · 2026-08-01

## Contexto

Hackathon de un día, 5 personas, división dura: backend (pipeline de ingesta + matcher) por un lado, frontend Next.js por el otro. El README exige trabajar en paralelo sin pisarse, con el contrato de datos como frontera.

## Decisión

Monorepo pnpm con workspaces:

- `apps/web` — Next.js, deploy en Vercel (root directory = `apps/web`)
- `packages/schema` — contrato de datos congelado (Zod + tipos TS), única fuente de verdad
- `packages/matcher` — función pura perfil → obligaciones
- `packages/pipeline` — ingesta de fuentes + extracción LLM
- `data/normas.json` — output del pipeline, commiteado al repo

## Alternativas consideradas

Una sola app Next.js con `scripts/` y `lib/`: menos setup, pero frontera backend/frontend implícita y todos compartiendo un `package.json` (conflictos de git constantes con 5 personas).

## Consecuencias

- Nadie toca los archivos del otro equipo; los merges son triviales.
- El schema Zod se importa desde los tres consumidores (pipeline, matcher, web) sin duplicación.
- Fricción posible para quien no usó pnpm workspaces → mitigada con instrucciones de setup en el README raíz y CLAUDE.md/AGENTS.md.
