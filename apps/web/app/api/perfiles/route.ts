import { getPerfiles, guardarPerfil } from "@vigente/db";
import { PerfilSchema } from "@vigente/schema";

// Capa de front (Batista + Juanma). Solo consume la única superficie de BD
// (getPerfiles / guardarPerfil, ADR-0004). No abre otras queries.

export async function GET() {
  const perfiles = await getPerfiles();
  return Response.json({ perfiles });
}

export async function POST(req: Request) {
  const body = await req.json();
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const parse = PerfilSchema.safeParse(body?.perfil);
  if (!nombre || !parse.success) {
    return Response.json({ error: "datos inválidos" }, { status: 400 });
  }
  const guardado = await guardarPerfil(nombre, parse.data);
  return Response.json({ guardado });
}
