# 0007 — Landing de pitch en `/inicio` (revierte parcialmente el "no hay landing" del brief)

**Estado:** aceptada · 2026-08-01 · Modifica la sección 8 del README original.

## Contexto

El brief listaba la landing entre lo que no se construye, con buen motivo: cada hora que no va al recorrido de la demo es una hora perdida. Pero el proyecto quedó sin ninguna superficie que se explique sola. El recorrido de README §9 sólo funciona con alguien operándolo en vivo; un link compartido a `/` abre una lista de obligaciones sin contexto de qué es el producto ni qué problema resuelve.

Todo el contenido del pitch ya está escrito en README §1, §2, §4 y §11. Pasarlo a pantalla es trabajo de maquetado, no de producto.

## Decisión

- **La landing vive en `/inicio`, no en `/`.** El recorrido de la demo no cambia: el paso 1 (README §9) sigue siendo lo primero que ve el jurado al abrir la app. La landing no es parte del recorrido; se comparte por link y se linkea desde el pitch.
- **Es estática.** Server Component sin `use client`, sin estado, sin fetch, sin BD. No agrega superficie de runtime: no toca ADR-0003 (la única llamada LLM sigue siendo `/api/intent`) ni ADR-0004 (no consulta `perfiles`).
- **El ejemplo de obligación sale de `data/normas.ejemplo.json`**, con su `url_fuente` real como link. La regla anti-alucinación (README §6) aplica a la landing igual que a la app: nada de normativa verosímil inventada para ilustrar.
- **Es la única página responsive del proyecto.** Ver más abajo.
- Entra Tailwind v4 al proyecto (`apps/web`), que hasta ahora no tenía nada de CSS. Sirve también para las vistas del recorrido, que todavía no existen.
- Responsable: Batista.

## Responsive: excepción acotada

README §8 también deja "responsive" fuera de alcance, y para las vistas de la demo eso sigue valiendo — se proyectan en una pantalla conocida. La landing es el caso opuesto: se comparte por link y se abre mayormente en teléfono. Una landing que no entra en un celular no cumple la función por la que se construye.

La excepción es sólo para `/inicio`. Con Tailwind son unos pocos prefijos `md:`, no una tarea aparte.

## Alternativas consideradas

- **Landing en `/` con la demo movida a `/consulta`:** cambia el recorrido del jurado y obliga a reensayar el pitch. El costo cae sobre el único camino que importa.
- **Landing en `/` con la consulta embebida arriba:** conserva el paso 1 pero mezcla dos objetivos en una página; el riesgo de romper la demo mientras se itera el diseño es real.
- **No construirla (brief original):** deja al proyecto sin nada compartible fuera de la demo en vivo.

## Consecuencias

- README §8 y la regla 5 de `CLAUDE.md`/`AGENTS.md` dejan de listar la landing como fuera de alcance.
- Aparece Tailwind en `apps/web`. Su preflight resetea los estilos por defecto de los elementos HTML, así que `app/page.tsx` necesita clases explícitas para conservar jerarquía visual.
- Los números de mercado que la landing muestra son estimación propia del equipo, no dato censado, y se rotulan como tal en la página.
