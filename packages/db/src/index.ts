import { neon } from "@neondatabase/serverless";
import type { Perfil } from "@vigente/schema";
import perfilesSeed from "../../../data/perfiles.json" with { type: "json" };

// Dueño: Joako. Única superficie de BD del sistema (ADR-0004).
// Cláusula de escape: sin DATABASE_URL (o si Neon falla) cae al JSON seedeado
// y la demo no se entera. No agregar tablas ni queries fuera de este archivo.

export interface PerfilGuardado {
  id: number;
  nombre: string;
  perfil: Perfil;
}

const seed: PerfilGuardado[] = perfilesSeed.map((p, i) => ({
  id: -(i + 1), // ids negativos = vienen del fallback, no de Neon
  nombre: p.nombre,
  perfil: p.perfil as Perfil,
}));

function sql() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export async function getPerfiles(): Promise<PerfilGuardado[]> {
  const db = sql();
  if (!db) return seed;
  try {
    const rows = await db`SELECT id, nombre, data FROM perfiles ORDER BY created_at DESC`;
    const guardados = rows.map((r) => ({ id: r.id, nombre: r.nombre, perfil: r.data as Perfil }));
    return [...guardados, ...seed];
  } catch {
    return seed;
  }
}

export async function guardarPerfil(nombre: string, perfil: Perfil): Promise<PerfilGuardado> {
  const db = sql();
  if (!db) return { id: -99, nombre, perfil };
  try {
    const [row] = await db`
      INSERT INTO perfiles (nombre, data) VALUES (${nombre}, ${JSON.stringify(perfil)})
      RETURNING id`;
    return { id: row.id, nombre, perfil };
  } catch {
    return { id: -99, nombre, perfil };
  }
}
