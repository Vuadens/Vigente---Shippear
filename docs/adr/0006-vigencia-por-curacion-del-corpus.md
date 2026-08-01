# 0006 — La vigencia se garantiza curando el corpus, no extendiendo el contrato

**Estado:** aceptada · 2026-08-01

## Contexto

El contrato congelado (README §3) modela `relaciones` como aristas **salientes**: "esta norma modifica a aquella". El matcher deriva quién modificó a quién invirtiendo esas aristas **dentro del corpus**.

De ahí sale un agujero: si la Ordenanza A fue modificada por la B y **B no está entre las 60 normas**, el matcher no tiene forma de saberlo y presenta las obligaciones de A **como vigentes**. Silenciosamente incorrecto — exactamente el escenario que hunde el paso 7 de la demo.

El dato existe en las fuentes: Rosario trae `FUE_ACTUALIZADA: SI/NO` y la base nacional trae `modificada_por` como **contador**. Ambas dicen "a esta la tocaron" sin decir por quién. El schema congelado no tiene dónde guardar eso.

## Decisión

**Se cura el corpus en vez de extender el contrato.** Tres reglas:

1. **Nacional: solo normas con texto consolidado.** Se eligen únicamente leyes que tengan `texto_actualizado` en InfoLEG. Ese texto ya incorpora todas las modificaciones posteriores, así que la vigencia se resuelve sola y no depende de que la modificatoria esté en el corpus. Las 19 nacionales seleccionadas lo tienen. Quedan afuera a propósito el Código Alimentario (18.284) y Higiene y Seguridad (19.587): son relevantes pero no tienen consolidado, y no podemos afirmar su texto vigente.

   Para las municipales no existe equivalente. El CSV de Rosario trae `FUE_ACTUALIZADA`, pero **es una señal débil, no una garantía**: la Ordenanza 8.952/2012 figura como `NO` y sin embargo la 10.720/2024 la derogó. Sirve como pista al elegir; lo que garantiza la corrección es la regla 2.
2. **Las cadenas de la demo se incluyen completas.** Si entra una norma modificatoria, entra también la modificada. El cierre es manual y explícito, no transitivo automático (la Ley 20.744 tiene decenas de modificatorias; cerrarlo por código hace explotar el corpus).
3. **Las relaciones salientes se conservan aunque apunten fuera del corpus.** Son un dato verdadero. El matcher ignora los ids que no resuelve.

Las relaciones se construyen **híbrido, según jurisdicción**:

- **Nacional:** de las bases complementarias de InfoLEG (`id_norma_modificatoria → id_norma_modificada`). Determinístico, cero alucinación. El LLM no las toca.
- **Municipal:** del texto, vía LLM — el CSV de Rosario no dice por quién fue actualizada una norma. Se instruye al modelo a citar únicamente normas mencionadas literalmente en el texto.

## Alternativas consideradas

- **Extender el schema** con algo tipo `vigencia_incierta: boolean`. Es la respuesta correcta para producción, y queda como deuda explícita. Hoy no: el contrato es la frontera entre cuatro workspaces y romperlo a mitad de día cuesta más de lo que arregla.
- **Todas las relaciones por LLM.** Un solo camino de código, pero desperdicia una fuente oficial ya resuelta y gratis. La arista de vigencia es donde inventar sale más caro: decide si una obligación se muestra o no.
- **Ignorar el problema.** El sistema afirmaría vigencia sobre normas que él mismo sabe desactualizadas.

## Consecuencias

- El corpus queda honesto **por construcción**, no por lógica en runtime. Defendible en el pitch: cada norma que se ve está verificada.
- La garantía vive en la selección (`seleccion.ts`), no en el código. Agregar normas sin respetar las reglas 1 y 2 reintroduce el agujero en silencio — está documentado ahí.
- El matcher puede encontrar `relaciones[].norma` que no resuelven a ninguna norma del corpus. Es esperado: se ignoran.
