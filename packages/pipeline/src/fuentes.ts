// Fuentes verificadas en el spike del 2026-08-01. Todas responden.

export const ROSARIO = {
  // 5.337 ordenanzas. Columnas: TIPO, NUMERO, ANIO, ASUNTO, FEC_SANCION,
  // FEC_PROMULGACION, NRO_BOLETIN, ANIO_BOLETIN, FEC_PUBLICACION_BOLETIN,
  // FUE_ACTUALIZADA, TEXTO_VIGENTE_NORMA (link a la página de detalle)
  ordenanzasCsv:
    "https://datosabiertos.rosario.gob.ar/sites/default/files/resources/normativas_ord_0.csv",
  decretosCsv:
    "https://datosabiertos.rosario.gob.ar/sites/default/files/resources/normativas_dec_0.csv",
  // El texto completo baja como PDF escaneado *con capa OCR* — se extrae el texto
  // y solo se manda el binario al LLM si la extracción viene vacía (ver texto.ts).
  // Ojo: no todo idNormativa tiene PDF; algunos devuelven ~48 bytes.
  pdfNorma: (idNormativa: string) =>
    `https://www.rosario.gob.ar/normativa/verArchivo?tipo=pdf&id=${idNormativa}`,
};

export const INFOLEG = {
  // Base completa: 426.113 normas desde 1997 (49 MB zip → 254 MB csv).
  // El CSV de muestreo son 999 filas de un solo mes de 2022, puro acto
  // administrativo: no sirve para elegir normas relevantes.
  // Columnas: id_norma, tipo_norma, numero_norma, ..., titulo_resumido,
  // texto_resumido, texto_original, texto_actualizado, modificada_por, modifica_a.
  // OJO: modificada_por / modifica_a son CONTADORES, no ids. Las aristas reales
  // están en las bases complementarias de abajo.
  baseZip:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/bf0ec116-ad4e-4572-a476-e57167a84403/download/base-infoleg-normativa-nacional.zip",
  // Aristas del grafo de vigencia, ya resueltas: pares (modificatoria, modificada).
  modificadasZip:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/0c4fdafe-f4e8-4ac2-bc2e-acf50c27066d/download/base-complementaria-infoleg-normas-modificadas.zip",
  modificatoriasZip:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/dea3c247-5a5d-408f-a224-39ae0f8eb371/download/base-complementaria-infoleg-normas-modificatorias.zip",
  // InfoLEG devuelve 403 sin User-Agent de navegador.
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

// Geocoding (build step únicamente, ver CONTEXT.md): API Georef, sin key.
// Lo consume packages/pipeline/src/geocodificar.ts (dueño: Joako).
export const GEOREF = {
  direcciones: (direccion: string, localidad = "Rosario") =>
    `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(direccion)}&localidad=${encodeURIComponent(localidad)}&provincia=santa%20fe&max=1`,
};
