// Helpers de presentación de plazos (capa front, sin lógica de dominio).

export type Urgencia = "urgent" | "soon" | "later" | "perm";

/** Días desde hoy hasta la fecha límite ISO (yyyy-mm-dd). null = permanente. */
export function diasRestantes(venceISO: string | null): number | null {
  if (!venceISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(`${venceISO}T00:00:00`);
  return Math.round((vence.getTime() - hoy.getTime()) / 86_400_000);
}

export function urgencia(dias: number | null): Urgencia {
  if (dias === null) return "perm";
  if (dias <= 7) return "urgent";
  if (dias <= 30) return "soon";
  return "later";
}

export function fechaLegible(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// --- Agrupación por horizonte temporal (para la timeline de obligaciones) ---
// El eje de la vista es "para cuándo": agrupamos por proximidad del plazo.

export type Bucket = "vencido" | "urgent" | "soon" | "later" | "perm";

export function bucketDe(venceISO: string | null): Bucket {
  const dias = diasRestantes(venceISO);
  if (dias === null) return "perm";
  if (dias < 0) return "vencido";
  if (dias <= 7) return "urgent";
  if (dias <= 30) return "soon";
  return "later";
}

// Orden de los grupos de arriba (más urgente) hacia abajo.
export const BUCKETS: { key: Bucket; label: string; hint: string }[] = [
  { key: "vencido", label: "Vencidas", hint: "Ya pasó el plazo" },
  { key: "urgent", label: "Esta semana", hint: "Vencen en 7 días o menos" },
  { key: "soon", label: "Este mes", hint: "Vencen dentro de 30 días" },
  { key: "later", label: "Más adelante", hint: "Con plazo, sin urgencia" },
  { key: "perm", label: "Sin fecha límite", hint: "Obligaciones permanentes" },
];

// Día y mes por separado, para mostrar la fecha como "15 / nov" en la columna.
export function fechaPartes(iso: string): { dia: string; mes: string } {
  const d = new Date(`${iso}T00:00:00`);
  return {
    dia: String(d.getDate()),
    mes: d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
  };
}
