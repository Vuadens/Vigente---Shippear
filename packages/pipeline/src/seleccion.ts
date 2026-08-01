// ============================================================
// EL CORPUS (ADR-0006). Esto no es una muestra: cada norma está
// elegida a mano. La corrección de la vigencia vive acá, no en el
// código — leé las reglas antes de agregar nada.
//
//   1. Preferí normas que nadie modificó después.
//      - Nacional: solo se eligen leyes con TEXTO CONSOLIDADO
//        (`texto_actualizado` en InfoLEG). Ese texto ya incorpora
//        todas las modificaciones, así que la vigencia se resuelve
//        sola: no depende de que la modificatoria esté en el corpus.
//      - Municipal: el CSV de Rosario trae FUE_ACTUALIZADA, pero es
//        una señal DÉBIL — la 8952/2012 figura como "NO" y sin
//        embargo la 10720/2024 la derogó. Sirve como pista, no como
//        garantía. La garantía es la regla 2.
//
//   2. Si entra una norma que modifica o deroga a otra, ENTRA TAMBIÉN
//      LA OTRA. Cierre manual y explícito. No automático: la Ley
//      20.744 tiene 263 modificatorias y cerrarlo por código hace
//      explotar el corpus.
//
//   3. Cada entrada dice por qué está. Si no sabés escribir el porqué,
//      no la agregues.
//
// Romper 1 o 2 reintroduce en silencio el bug que ADR-0006 evita: una
// norma derogada mostrada como vigente.
// ============================================================

export type SeleccionRosario = { numero: number; anio: number; porque: string };
export type SeleccionNacional = { idNorma: string; porque: string };

// ---------- MUNICIPAL: Rosario (se buscan por NUMERO + ANIO en el CSV) ----------

export const ROSARIO_SELECCION: SeleccionRosario[] = [
  // --- Cadena de vigencia. Es el paso 7 de la demo: "una norma modificada
  //     por otra posterior y cómo el sistema resuelve cuál está vigente".
  //     Las tres puntas entran juntas (regla 2). ---
  { numero: 10720, anio: 2024, porque: "cadena/vigencia: modifica el Reglamento de Edificación y DEROGA la 8952 y la 9897" },
  { numero: 8952, anio: 2012, porque: "cadena/vigencia: derogada por la 10720/2024" },
  { numero: 9897, anio: 2018, porque: "cadena/vigencia: derogada por la 10720/2024" },

  // --- Obra en vivienda. Paso 1-2 de la demo:
  //     "quiero construir algo en mi casa, ¿qué tengo que saber?" ---
  { numero: 8336, anio: 2008, porque: "obra: crea el Nuevo Reglamento de Edificación, norma base del rubro" },
  { numero: 10561, anio: 2023, porque: "obra: Reglamento de Edificación, veredas y arbolado — relación con la vía pública" },
  { numero: 10608, anio: 2024, porque: "obra: modificación del Nuevo Reglamento de Edificación" },
  { numero: 10673, anio: 2024, porque: "obra: Reglamento de Edificación, capítulo Estacionamiento" },
  { numero: 10834, anio: 2025, porque: "obra: modificación reciente del Reglamento de Edificación" },
  { numero: 10813, anio: 2025, porque: "obra: define edificación de perímetro libre (torre)" },
  { numero: 10837, anio: 2025, porque: "obra: régimen de Derechos de Edificación Transferibles" },

  // --- Bar / gastronomía. Paso 3-6 de la demo: perfil de un bar de Rosario.
  //     Todas imponen obligaciones concretas a un local gastronómico. ---
  { numero: 10877, anio: 2025, porque: "bar: capacitación en primeros auxilios para personal gastronómico" },
  { numero: 10440, anio: 2022, porque: "bar: cartelería obligatoria sobre obstrucción de vías aéreas" },
  { numero: 10660, anio: 2024, porque: "bar: reglas de exhibición y promoción de alimentos y bebidas" },
  { numero: 10196, anio: 2021, porque: "bar: recipientes reutilizables aportados por el cliente" },
  { numero: 10158, anio: 2020, porque: "bar: prohibición de sorbetes plásticos" },
  { numero: 10226, anio: 2021, porque: "bar: envases para expendio de helado a granel" },
  { numero: 10677, anio: 2024, porque: "bar: programa de Aceite Vegetal Usado para establecimientos comerciales" },
  { numero: 9558, anio: 2016, porque: "bar: opción de retiro de alimentos no consumidos" },
  { numero: 10419, anio: 2022, porque: "bar: personal capacitado para alquiler de instalaciones deportivas" },

  // --- Comercio en general. Dan cobertura para que el modo pull no responda
  //     "no encontré normativa" ante una pregunta fuera de los dos perfiles
  //     cableados de la demo. ---
  { numero: 10842, anio: 2025, porque: "comercio: habilitación de guarderías y pensionados de perros y gatos" },
  { numero: 10801, anio: 2025, porque: "comercio: habilitación de jardines maternales particulares" },
  { numero: 10657, anio: 2024, porque: "comercio: obligación de aceptar pago con tarjeta de débito" },
  { numero: 10216, anio: 2021, porque: "comercio: envoltorios plásticos en frutas y verduras" },
  { numero: 9605, anio: 2016, porque: "comercio: cartel obligatorio para titulares de habilitación" },
  { numero: 9965, anio: 2019, porque: "comercio: cartelería en locales de venta de automotores" },
  { numero: 10434, anio: 2022, porque: "comercio: Registro de Infractores y Reincidentes Ambientales" },
  { numero: 10874, anio: 2025, porque: "comercio: protección del arbolado urbano — afecta obras y veredas" },
  { numero: 9825, anio: 2018, porque: "comercio: Registro de Salones de Fiestas" },
  { numero: 9890, anio: 2018, porque: "comercio: acceso a sanitarios para personas con EII" },
  { numero: 10034, anio: 2020, porque: "comercio: menú saludable en locales de expendio en escuelas" },
  { numero: 10600, anio: 2024, porque: "comercio: mapa interactivo de accesibilidad" },
  { numero: 9871, anio: 2018, porque: "obra: obligaciones ante afectación de veredas y circulación" },
  { numero: 9867, anio: 2018, porque: "comercio: cartelería precautoria en entidades bancarias" },
  { numero: 10889, anio: 2025, porque: "comercio: cartelería de seguridad en guarderías náuticas" },
  { numero: 7839, anio: 2005, porque: "bar: Código de Faltas — factor ocupacional y venta de alcohol" },
  { numero: 8127, anio: 2007, porque: "comercio: contaminación sonora — aplica a locales con música" },
  { numero: 6814, anio: 1999, porque: "comercio: manipulación y transporte de mercaderías peligrosas" },
  { numero: 9755, anio: 2017, porque: "comercio: habilitación de juegos infantiles de uso público" },
];

// ---------- NACIONAL: InfoLEG (se buscan por id_norma en la base completa) ----------
//
// Todas tienen `texto_actualizado` (texto consolidado). Esa es la razón por la
// que están: el consolidado ya incorpora las modificaciones, así que decir que
// están vigentes es honesto aunque sus modificatorias no estén en el corpus.
// Las leyes SIN consolidado quedaron afuera a propósito — notablemente el
// Código Alimentario (18.284, 496 modificatorias) y Higiene y Seguridad
// (19.587, 74): son relevantes, pero no podemos afirmar su texto vigente.

export const NACIONAL_SELECCION: SeleccionNacional[] = [
  { idNorma: "25552", porque: "Ley 20.744 Contrato de Trabajo — obligaciones de todo empleador" },
  { idNorma: "51609", porque: "Ley 24.977 Monotributo — régimen simplificado, alcanza a casi toda pyme" },
  { idNorma: "638", porque: "Ley 24.240 Defensa del Consumidor — obligaciones de todo comercio" },
  { idNorma: "27971", porque: "Ley 24.557 Riesgos del Trabajo — ART obligatoria" },
  { idNorma: "19946", porque: "Ley 22.802 Lealtad Comercial — rotulado y publicidad" },
  { idNorma: "63368", porque: "Ley 11.544 Jornada de trabajo — límites de jornada" },
  { idNorma: "18771", porque: "Ley 11.683 Procedimiento fiscal — deberes formales ante ARCA/AFIP" },
  { idNorma: "25553", porque: "Ley 19.550 Sociedades — obligaciones societarias y contables" },
  { idNorma: "230592", porque: "Ley 26.940 Registración laboral — sanciones por empleo no registrado" },
  { idNorma: "263953", porque: "Ley 27.264 PYME — beneficios y requisitos para acceder" },
  { idNorma: "305262", porque: "Ley 27.430 Reforma tributaria — impacto en obligaciones impositivas" },
  { idNorma: "55556", porque: "Ley 25.065 Tarjetas de crédito — obligaciones del comercio adherido" },
  { idNorma: "64790", porque: "Ley 25.326 Datos personales — aplica a todo comercio con base de clientes" },
  { idNorma: "93595", porque: "Ley 25.877 Ordenamiento laboral — inspección del trabajo" },
  { idNorma: "203798", porque: "Ley 26.773 Riesgos del trabajo — reparación de accidentes" },
  { idNorma: "273567", porque: "Ley 27.349 Apoyo al capital emprendedor — SAS" },
  { idNorma: "15932", porque: "Ley 24.467 PyME — marco general de la pequeña empresa" },
  { idNorma: "25379", porque: "Ley 24.522 Concursos y quiebras — obligaciones ante insolvencia" },
  { idNorma: "60016", porque: "Ley 25.156 Defensa de la competencia — conductas prohibidas" },
];
