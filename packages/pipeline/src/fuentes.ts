// Fuentes verificadas en el spike del 2026-08-01. Todas responden.

export const ROSARIO = {
  // 5.381 ordenanzas. Columnas: TIPO, NUMERO, ANIO, ASUNTO, FEC_SANCION,
  // FEC_PROMULGACION, NRO_BOLETIN, ANIO_BOLETIN, FEC_PUBLICACION_BOLETIN,
  // FUE_ACTUALIZADA, TEXTO_VIGENTE_NORMA (link a la página de detalle)
  ordenanzasCsv:
    "https://datosabiertos.rosario.gob.ar/sites/default/files/resources/normativas_ord_0.csv",
  decretosCsv:
    "https://datosabiertos.rosario.gob.ar/sites/default/files/resources/normativas_dec_0.csv",
  // El texto completo de una norma baja como PDF (escaneado, mandarlo directo al LLM):
  pdfNorma: (idNormativa: string) =>
    `https://www.rosario.gob.ar/normativa/verArchivo?tipo=pdf&id=${idNormativa}`,
};

export const INFOLEG = {
  // 999 filas de muestra. Columnas: id_norma, tipo_norma, numero_norma, ...,
  // titulo_resumido, texto_resumido, texto_original (link), modificada_por, modifica_a
  muestreoCsv:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/8b1c2310-564e-41e6-9a84-99cfa9939bbc/download/base-infoleg-normativa-nacional-muestreo.csv",
  modificadasMuestreoCsv:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/ae4babf3-164c-4726-bc58-8ff1c192afab/download/base-complementaria-infoleg-normas-modificadas-muestreo.csv",
  modificatoriasMuestreoCsv:
    "https://datos.jus.gob.ar/dataset/d9a963ea-8b1d-4ca3-9dd9-07a4773e8c23/resource/1092c0b4-3be5-41dd-bc72-feba592afcdf/download/base-complementaria-infoleg-normas-modificatorias-muestreo.csv",
};

// Geocoding (build step únicamente, ver CONTEXT.md): API Georef, sin key.
export const GEOREF = {
  direcciones: (direccion: string, localidad = "Rosario") =>
    `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(direccion)}&localidad=${encodeURIComponent(localidad)}&provincia=santa%20fe&max=1`,
};
