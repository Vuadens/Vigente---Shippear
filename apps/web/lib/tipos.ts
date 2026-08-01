import type { Plazo, Perfil } from "@vigente/schema";

// Forma del payload que devuelve /api/match (enriquecido para las vistas).

export interface NormaRef {
  id: string;
  jurisdiccion: "municipal" | "provincial" | "nacional";
  tipo: string;
  numero: string;
  fecha_publicacion: string;
  url_fuente: string;
  resumen_llano: string;
}

export interface ObligacionVista {
  que_hacer: string;
  si_no_cumplis: string;
  plazo: Plazo;
  confianza: number;
}

export interface Relacion {
  tipo: "modifica" | "deroga" | "prorroga";
  norma: string;
  label: string;
}

export interface GeoVista {
  tipo: "ciudad" | "zona" | "tramo" | "punto";
  descripcion: string;
  coords: number[];
}

export type EstadoNorma = "vigente" | "modificada" | "derogada";

// Referencia mínima a la obligación anterior reemplazada (demo paso 7).
export interface ReemplazaA {
  norma: {
    id: string;
    tipo: string;
    numero: string;
    fecha_publicacion: string;
  };
  obligacion: {
    que_hacer: string;
    si_no_cumplis: string;
  };
}

export interface ResultadoItem {
  norma: NormaRef;
  obligacion: ObligacionVista;
  vence: string | null;
  estado: EstadoNorma;
  geo: GeoVista;
  afectada_por: { id: string; label: string }[];
  reemplaza_a?: ReemplazaA;
  cambia: Relacion[];
  porque: string[];
}

export interface MatchResponse {
  perfil: Perfil;
  total: number;
  items: ResultadoItem[];
}

// Perfil guardado que devuelve /api/perfiles (espeja PerfilGuardado de @vigente/db).
export interface PerfilGuardadoVista {
  id: number;
  nombre: string;
  perfil: Perfil;
}
