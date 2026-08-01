# 0004 — Neon Postgres solo para perfiles (revierte parcialmente el "cero BD" del brief)

**Estado:** aceptada · 2026-08-01 · Modifica las secciones 2 y 8 del README original.

## Contexto

El brief original decía "no hay base de datos". Pero el modo push necesita saber *a quién* avisarle: la entidad perfil tiene semántica de suscripción. Además, en el paso 8 de la demo, que el jurado pueda **guardar** el perfil que acaba de tipear convierte una búsqueda paramétrica en una suscripción en vivo — mucho más creíble como producto.

## Decisión

- **Neon Postgres provisionado desde el Vercel Marketplace** (sponsor del hackathon; `DATABASE_URL` se inyecta sola al deploy).
- **Una sola tabla:** `perfiles(id, nombre, data jsonb, created_at)`. El `jsonb` es el objeto perfil del contrato Zod, sin normalizar.
- Sin ORM ni migraciones: un `schema.sql` + `@neondatabase/serverless`.
- **La BD guarda únicamente perfiles.** Las normas siguen en `data/normas.json` estático. Las alertas se computan al leer (`matcher(perfil, normas)` filtrado por novedad), no se persisten.
- Responsable: Joako.

## Cláusula de escape

El front consume `getPerfiles()` / `guardarPerfil()` de un módulo `db`. Si Neon da problemas a la hora 4, ese módulo cae a `data/perfiles.json` en memoria y la demo no se entera.

## Alternativas consideradas

- **Cero BD (brief original):** no permite el "guardar mi perfil" en vivo del paso 8 ni responde "a quién le mando qué" con algo tangible.
- **Upstash Redis (KV):** setup igual de corto, pero Postgres es más narrable ante el jurado.
- **Supabase:** más setup (auth, cliente propio) para el mismo resultado; el brief ya lo descartaba.

## Consecuencias

- El pitch puede mostrar la arquitectura real de producción: perfiles en BD + batch nocturno que corre el matcher por perfil.
- Aparece una env var (`DATABASE_URL`) y un paso de provisioning; ambos a cargo de Joako y ausentes del camino crítico.
