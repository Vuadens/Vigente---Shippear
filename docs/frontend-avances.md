# Vigente — Registro de avances (Frontend `apps/web`)

> Dueños: Batista Renaudo + Juanma Foronda.
> El front **solo consume** `@vigente/matcher`, `@vigente/schema` y la superficie de BD (`@vigente/db`). No toca lógica de dominio (regla de CLAUDE.md / ADRs).

## Estado general

- Monorepo pnpm. App Next.js 15 + React 19 en `apps/web`.
- Sincronizado con `origin/main` vía merges locales (no se pusheó nada al remoto).
- `pnpm typecheck` limpio. Los 10 tests de `@vigente/matcher` pasan.
- Datos: hoy consume `data/normas.ejemplo.json`. Pendiente: switch a `data/normas.json` cuando lo entregue Franco.

## Sesión 1 — Pull + Bloque A (modo pull)

Se configuró el remoto `github.com/Vuadens/Vigente---Shippear.git` y se mergeó `origin/main`
(scaffolding del monorepo, ADRs, schema, matcher, db, pipeline, `apps/web` inicial).

Base de UI:
- `app/globals.css` — sistema de diseño (paleta papel/tinta + teal institucional + ámbar/rojo urgencia), tokens, tipografía Geist/Geist Mono, dark mode.
- `app/layout.tsx` — fuentes + metadata + themeColor.

Bloque A (recorrido de demo §9, pasos 1-3, 6-7):
- `app/page.tsx` — vista principal modo pull + nav Consultar/Monitoreo.
- `components/consulta.tsx` — input → `/api/intent` (perfil) → `/api/match` (obligaciones). Estado vacío anti-alucinación. Enter-to-submit con guarda de IME.
- `components/obligacion-card.tsx` + `countdown.tsx` — lista ordenada por urgencia, cuenta regresiva, detalle expandible.
- `app/api/match/route.ts` — capa de front que consume `match()` (no recomputa dominio).

## Sesión 2 — Bloque B (modo push + mapa)

- `app/panel/page.tsx` — página server "Monitoreo", carga perfiles con `getPerfiles()`.
- `components/panel.tsx` — orquesta la vista push: selector de perfiles + preview en vivo + mapa.
- `components/mapa.tsx` — mapa **Leaflet** (`react-leaflet` v5), pines agrupados por coordenada, color por urgencia, usando `geo.coords`.
- `components/perfil-builder.tsx` — armar perfil en vivo (tipo, rubro, dirección, condiciones); re-match inmediato + `guardarPerfil()`.
- `app/api/perfiles/route.ts` — GET lista / POST guardar (valida con `PerfilSchema`).

Dependencias agregadas: `leaflet`, `react-leaflet`, `@types/leaflet`.

Nota operativa: hubo un conflicto de dev servers (arranque manual chocó con el server gestionado por v0 y corrompió el chunk de CSS). Se resolvió dejando corriendo **solo** el server gestionado. **No** arrancar un `pnpm dev` manual en paralelo.

## Sesión 3 — Integración matcher/schema nuevos

Merge de `origin/main` (commit `d121c78`: matcher real + vocabulario nuevo en schema; no tocó `apps/web`).

1. **Selector de rubro canónico** — `perfil-builder.tsx` importa `RUBROS` de `@vigente/schema`
   (`gastronomia, comercio, construccion, transporte, industria, servicios`).
   Se eliminó el `comercio_minorista` inválido. Mapa `RUBRO_LABEL` para etiquetas legibles.
2. **Prompt con restricción de rubro** — `/api/intent` inyecta
   `El campo "rubro" debe ser exactamente uno de: ${RUBROS.join(", ")} — o vacío si no aplica.`
3. **Vista "qué cambió" (demo paso 7)** — `/api/match` usa `estado`, `afectada_por` y `reemplaza_a`
   directo del matcher (dejó de recomputar `vigencia()`). `lib/tipos.ts` suma `EstadoNorma` y `ReemplazaA`.
   `obligacion-card.tsx` renderiza el diff **Antes (tachado) → Ahora** lado a lado.
   Verificado: Ordenanza 9027/2012 → 10800/2025.
4. **Dirección → ciudad (demo paso 8)** — el matcher deriva ciudad de `ubicacion.direccion`
   (default Rosario). Cambiar a otra ciudad vacía la lista (intencional). Se corrigió el estado vacío
   del panel para mostrar el mensaje anti-alucinación correcto
   ("No encontré normativa cargada que le aplique a este perfil.").

## Sesión 4 — Rediseño visual + timeline + badge "modificada"

Rediseño visual (light por defecto + dark, teal refinado, serif Lora para títulos, toggle de tema):
- `app/globals.css` reescrito con tokens light/dark completos.
- `app/layout.tsx` — serif Lora + script anti-flash de tema.
- `components/theme-toggle.tsx` (nuevo) — toggle sol/luna, persiste en localStorage.
- `components/mapa.tsx` — colores de pin leídos de tokens de tema en runtime.

Rediseño de resultados: de **cards** a **timeline agrupada por horizonte temporal**
(brief del jefe: listas > cards, tipografía fuerte, color solo para significado):
- `lib/plazo.ts` — `bucketDe`, `BUCKETS` (Vencidas / Esta semana / Este mes / Más adelante / Sin fecha límite), `fechaPartes`.
- `components/obligacion-card.tsx` → `ObligacionRow`: fila con columna "para cuándo" a la izquierda + acción como texto protagonista.
- `components/lista-obligaciones.tsx` (nuevo) — agrupa y renderiza la timeline; reutilizado por Consultar y Monitoreo (elimina duplicación).
- `components/consulta.tsx` — "Perfil interpretado" → resumen "Esto es lo que entendí".
- `components/countdown.tsx` — **eliminado** (ya no se usa).

Matcher actualizado (merge `640493f`; no tocó `apps/web`):
- `deroga` → excluye norma vieja + `reemplaza_a` en la nueva (diff "antes → ahora"). Ya soportado.
- `modifica` → muestra ambas; la vieja trae `estado: "modificada"` + `afectada_por`.
  **`obligacion-card.tsx` ahora muestra un badge "Modificada"** (pill ámbar) en la fila,
  con tooltip que lista las normas que la afectan (`afectada_por`). Estilo en `globals.css` (`.ob-badge`).
  Nota: el corpus de ejemplo no tiene un caso `modifica` que matchee un perfil de la demo,
  así que el badge no se ve con los datos actuales (código verificado de forma aislada).
- Selector de rubro desde `RUBROS` de `@vigente/schema`: ya estaba (Sesión 3).

## Pendiente en Vercel (NO ejecutable desde v0 — requiere acción manual del dueño)

Requerimiento del jefe: linkear el repo de GitHub al proyecto `vigente` (root `apps/web`)
y cargar 2 env vars en Settings → Environment Variables. Comparar contra el placeholder
`https://vigente-demo.vercel.app`.

Bloqueo encontrado (verificado por CLI, `vercel project ls` / `inspect`):
- El proyecto **`vigente` NO existe** en el team `bautirenaudo9-12's projects` (único team de la cuenta).
- `vigente-demo.vercel.app` responde 200 pero **vive en otra cuenta/team** al que esta sesión no tiene acceso.
- El único proyecto propio es **`vigente-shippear`** (linkeado a este chat), hoy con
  Root Directory `.` y Framework Preset `undefined` — **no** configurado como `apps/web`.

Por eso el link de GitHub y las env vars **no se pudieron hacer desde acá** (sin acceso al proyecto correcto).
Pasos para hacerlo manualmente en el dashboard de Vercel del proyecto correcto:

1. **Identificar el proyecto**: confirmar con el equipo si se usa `vigente` (otra cuenta) o
   `vigente-shippear` (esta). Si es `vigente-shippear`, ajustar **Root Directory → `apps/web`**
   (Settings → Build & Deployment) y Framework Preset → Next.js.
2. **Linkear GitHub**: Settings → Git → Connect Git Repository → elegir `Vuadens/Vigente---Shippear`.
3. **Env vars**: Settings → Environment Variables → agregar las 2 variables (nombre + valor, marcar
   Production/Preview/Development según corresponda). Confirmar nombres/valores con el jefe.
   (Nota: en v0 este proyecto ya tiene `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` disponible.)
4. **Deploy y comparar** contra `vigente-demo.vercel.app`.

## Comandos útiles

- Typecheck front: `pnpm -F web typecheck`
- Tests matcher: `pnpm -F @vigente/matcher test`
- Preview: lo gestiona v0 automáticamente (no arrancar `pnpm dev` manual).

## Reglas duras (recordatorio)

- El front solo consume contratos; nunca reimplementa dominio.
- Anti-alucinación: si `match()` no devuelve nada → mensaje "no encontré…", nunca inventar.
- Fuera de alcance (§8): sin auth, filtros, búsqueda, landing.
- Si hay atraso: se sacrifica el mapa antes que la lista de obligaciones.
