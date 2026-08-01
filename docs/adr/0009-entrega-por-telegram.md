# 0009 — Entrega de Alertas por Telegram (enmienda ADR-0004)

**Estado:** aceptada · 2026-08-01 · enmienda a ADR-0004

## Contexto

ADR-0004 y CONTEXT.md fijaban que la **entrega** de Alertas (mail/notificación) era "narrativa de pitch, no alcance": el **modo push** era solo una *vista*. Esa restricción protegía el día de no meter mailing, suscripciones ni estado de entrega.

El paso 9 de la demo (`docs/guion-demo.md`, el golpe final) es "la alerta que llega sola". Contarla sin mostrar una entrega real la debilita. Un bot de Telegram vuelve la entrega **barata y sin infraestructura**: una sola llamada HTTP a `api.telegram.org`, sin dominio verificado ni SMTP. Eso reabre la decisión: se puede entregar de verdad sin traicionar el resto de las restricciones (persistencia, anti-alucinación).

## Decisión

Telegram es un **canal de entrega real y delgado** de la Alerta, no un prop. Con estas fronteras:

1. **No cambia la persistencia (ADR-0004 intacto).** La Alerta se sigue computando al leer y **no se persiste**. No hay tabla de alertas, ni de entregas, ni de suscripciones, ni estado leído/no-leído. La única tabla sigue siendo `perfiles`.
2. **Destino único de demo.** El bot no puede iniciar conversación, así que se entrega a un `chat_id` fijo (`TELEGRAM_CHAT_ID`) con `TELEGRAM_BOT_TOKEN`, ambos en `.env`. No se asocia un destino por Perfil (eso sería onboarding, fuera de alcance — README §8). El Contrato Zod (`@vigente/schema`) no se toca.
3. **Disparador controlado por el presentador.** El corpus es estático: no hay una norma que "llegue" de verdad. Un botón discreto y honesto ("Simular normativa entrante") en Monitoreo dispara el evento, con el timing del presentador. Representa el batch nocturno detectando la novedad.
4. **Mensaje grounded (regla #1).** Nueva ruta `/api/notificar` (server; el token nunca toca el cliente): recibe `{ perfil, normaId }`, corre `match()` contra `data/normas.json`, toma la Obligación real de la norma-novedad (`ord-10608-2024`, mesas en la vereda) y arma el mensaje desde esos datos + `url_fuente`. Cero texto inventado.
5. **Entrega best-effort, UI independiente.** El envío a Telegram es una llamada de red externa: es lo único frágil en vivo. El banner + badge en pantalla aparecen **sí o sí** al disparar; el POST a Telegram corre en paralelo y si falla, la demo no se entera (mismo criterio de fallback que `@vigente/db` e `/api/intent`, y que README §10).

## Alternativas consideradas

- **Prop scripteado (texto fijo).** No tocaba el dominio pero rompía la regla #1 y quedaba deshonesto si el jurado preguntaba.
- **Reversión total (persistir entregas/suscripciones/leído).** Es producción, no un día. Contradice ADR-0004 de raíz.
- **`chat_id` por Perfil.** Más "real" pero exige que cada usuario le dé `/start` al bot y pegue su id: onboarding, fuera de alcance.
- **Mail (Resend/SMTP).** Requiere dominio verificado e infra; más superficie de falla que un bot.

## Consecuencias

- Nueva superficie runtime: `/api/notificar` (no-LLM, externa). Runtime queda: `/api/intent`, `/api/respuesta` (LLM) y `/api/notificar` (Telegram).
- CONTEXT.md se actualiza: **Alerta** puede entregarse por Telegram; **Modo push** ya no niega la entrega, pero la Alerta sigue sin persistirse.
- Sin `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` la entrega no sale; la demo en pantalla funciona igual.
- El token que se pega en un chat queda comprometido: regenerar con @BotFather antes de cualquier uso serio.
