import { match } from "@vigente/matcher";
import { getPerfiles } from "@vigente/db";
import type { Norma } from "@vigente/schema";
import normasEjemplo from "../../../data/normas.ejemplo.json";

// Placeholder de arranque (dueños: Batista + Juanma). Ya integra matcher + db
// contra el seed — reemplazar por las vistas reales del recorrido de la demo.
// Cuando exista data/normas.json, cambiar el import.

const normas = normasEjemplo as Norma[];

export default async function Home() {
  const perfiles = await getPerfiles();
  const perfil = perfiles[0];
  const obligaciones = match(perfil.perfil, normas);

  // Las clases son el mínimo para conservar jerarquía: el preflight de Tailwind
  // (ADR-0007) resetea h1/ol/a, y el contenedor ya no vive en el <body>.
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-4xl">Vigente</h1>
      <p className="mt-2 text-tenue">
        Perfil demo: <strong className="font-semibold text-tinta">{perfil.nombre}</strong> —{" "}
        {obligaciones.length} obligaciones
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5">
        {obligaciones.map((m, i) => (
          <li key={i}>
            <strong className="font-semibold">{m.obligacion.que_hacer}</strong>
            {m.vence && <span className="text-vence"> — vence {m.vence}</span>}
            <br />
            <span className="text-tenue">
              {m.norma.tipo} {m.norma.numero}: {m.norma.resumen_llano}{" "}
            </span>
            <a href={m.norma.url_fuente} className="underline underline-offset-2">
              fuente
            </a>
          </li>
        ))}
      </ol>
    </main>
  );
}
