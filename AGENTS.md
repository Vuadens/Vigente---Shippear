# Vigente — reglas para agentes

Hackathon de un día. Leé `README.md` (brief + cronograma), `CONTEXT.md` (glosario) y `docs/adr/` (decisiones) antes de tocar código. **Lo que no está en el README, no se construye.**

## Estructura y dueños

| Workspace | Qué es | Dueño |
|---|---|---|
| `packages/schema` | Contrato Zod **congelado** (README §3) | todos — no se cambia sin avisar al equipo |
| `packages/pipeline` | Ingesta + extracción LLM → `data/normas.json` | Franco |
| `packages/matcher` | Función pura perfil → obligaciones. Sin LLM, sin I/O | Valentino |
| `packages/db` | Neon Postgres, solo tabla `perfiles`, con fallback a JSON | Joako |
| `apps/web` | Next.js (Vercel, root dir `apps/web`). `/` = recorrido de la demo · `/inicio` = landing de pitch (ADR-0007) | Batista + Juanma |
| `data/` | `normas.json` (output pipeline), `normas.ejemplo.json`, `perfiles.json` | — |

**No pises workspaces ajenos.** La frontera entre equipos es `@vigente/schema` + `data/*.json`.

## Comandos

```bash
pnpm install          # una vez, en la raíz
pnpm dev              # levanta apps/web
pnpm pipeline         # corre la extracción (necesita AI_GATEWAY_API_KEY en .env)
pnpm typecheck        # typecheck de todos los workspaces
```

## Reglas duras

1. **Anti-alucinación (README §6):** toda respuesta al usuario se construye SOLO sobre obligaciones de `data/normas.json`, con link a fuente. Si no hay match: "no encontré normativa que aplique". Nunca inventar normativa.
2. **LLM:** siempre `generateObject()` del AI SDK con schemas de `@vigente/schema`, modelo vía Vercel AI Gateway: `anthropic/claude-sonnet-5` en pipeline y `/api/intent` (ADR-0005: la key free tier no accede a 4.5). Única llamada runtime: `/api/intent`. Todo lo demás es build step (ADR-0003).
3. **BD:** solo la tabla `perfiles` vía `@vigente/db`. Ni normas ni alertas se persisten. No agregar queries fuera de `packages/db` (ADR-0004).
4. **Matching geo:** por etiquetas (`ciudad`/`zona`), nunca por coordenadas. `punto`/`tramo` solo van al mapa (CONTEXT.md).
5. **Fuera de alcance (README §8):** login, admin, búsqueda, filtros, onboarding, manejo de errores elaborado. No los agregues "de paso". Responsive también, **salvo `/inicio`** — la landing de pitch es la única página responsive del proyecto (ADR-0007).
6. **TypeScript en todo** (ADR-0002). Sin Python, sin otros lenguajes.
7. Decisiones nuevas → ADR en `docs/adr/` + actualizar README si lo contradice. Términos nuevos → CONTEXT.md.

`AGENTS.md` es copia exacta de este archivo; si editás uno, replicá en el otro.
