# Vigente

Sistema que ingiere normativa pública de tres niveles de gobierno, reconstruye qué está vigente y la traduce a obligaciones concretas con vencimiento para un perfil específico.

## Language

**Norma**:
Un documento normativo publicado (ordenanza, decreto, ley, resolución) identificado por tipo + número + año.
_Avoid_: ley (como término genérico), regulación, documento

**Obligación**:
Algo concreto que un alcanzado debe hacer, con plazo y consecuencia por incumplir. Es la unidad de valor del producto; una **Norma** contiene cero o más.
_Avoid_: requisito, trámite

**Perfil**:
La descripción de un sujeto (persona física o comercio): rubro, ubicación, condiciones e intención. Mismo objeto lo produce el LLM en modo pull y lo persiste la BD en modo push.
_Avoid_: usuario, cuenta, suscriptor

**Modo pull**:
Consulta por intención: una pregunta en lenguaje natural se convierte en **Perfil** (vía LLM) y entra al **Matcher**.
_Avoid_: chatbot, búsqueda

**Modo push**:
Vista de **Alertas** para un **Perfil** persistido en la BD. No implica entrega (mail/notificación); eso es narrativa de pitch, no alcance.
_Avoid_: notificaciones, mailing

**Alerta**:
Una **Obligación** nueva o modificada recientemente que matchea un **Perfil**. Se computa al leer; nunca se persiste.

**Matcher**:
Función pura `(perfil, normas) → obligaciones ordenadas por vencimiento`. Sin LLM, sin I/O.

**Vigencia**:
El estado efectivo de una **Norma** hoy, resuelto a partir de sus relaciones (modifica / deroga / prorroga) con normas posteriores. Se resuelve únicamente dentro del **Corpus**: una modificatoria que no está en el corpus es invisible.

**Corpus**:
El conjunto curado de **Normas** que el sistema conoce (`data/normas.json`). No es una muestra ni un volcado: se elige norma por norma para que la **Vigencia** sea correcta dentro de él (ADR-0006).
_Avoid_: base, dataset, índice

**Confianza**:
Qué tan fielmente una **Obligación** refleja el texto de su **Norma** — mide la extracción, no la certeza jurídica. Un valor bajo significa "el texto era confuso o estaba mal escaneado", nunca "esta obligación quizás no aplique".

**Contrato**:
Los schemas Zod de `packages/schema` (norma, obligación, perfil). Congelado; es la frontera entre los cuatro workspaces.

## Relationships

- Una **Norma** contiene 0..n **Obligaciones**
- Una **Norma** se relaciona con otras vía modifica | deroga | prorroga → de ahí sale la **Vigencia**
- Las relaciones son **salientes** ("esta norma modifica a aquella"). Quién te modificó a vos se deriva invirtiéndolas dentro del **Corpus**; por eso el corpus se cura (ADR-0006)
- El **Matcher** cruza un **Perfil** contra las **Obligaciones** de las normas vigentes
- Una **Alerta** = **Obligación** matcheada + novedad reciente
- La BD (Neon) persiste solo **Perfiles**; las **Normas** viven en `data/normas.json`
- Matching geográfico por etiquetas, nunca por coordenadas: `geo.tipo = ciudad` aplica a todo perfil de esa ciudad; `zona` aplica si el perfil declara esa zona; `punto`/`tramo` no entra al matching (solo pin en el mapa). Las `coords` son exclusivamente visualización (Georef corre en build step).

## Example dialogue

> **Dev:** "¿Cuando el jurado tipea una pregunta creamos un usuario?"
> **Domain expert:** "No existe 'usuario'. La pregunta produce un **Perfil** efímero que entra al **Matcher**; solo se persiste si tocan 'guardar mi perfil', y ahí aparece en el **modo push**."
> **Dev:** "¿Y le mandamos el mail de alerta?"
> **Domain expert:** "No hay mails. Una **Alerta** es lo que se renderiza en la vista push; la entrega real es pitch, no demo."

## Flagged ambiguities

- "push" se usaba como entrega de notificaciones — resuelto: es una **vista** por perfil persistido; la entrega no se construye (ADR-0004).
- "BD" se usaba como "persistencia general" — resuelto: solo tabla `perfiles`; normas y alertas nunca tocan la BD.
