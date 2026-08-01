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

  return (
    <main>
      <h1>Vigente</h1>
      <p>
        Perfil demo: <strong>{perfil.nombre}</strong> — {obligaciones.length} obligaciones
      </p>
      <ol>
        {obligaciones.map((m, i) => (
          <li key={i}>
            <strong>{m.obligacion.que_hacer}</strong>
            {m.vence && <> — vence {m.vence}</>}
            <br />
            {m.norma.tipo} {m.norma.numero}: {m.norma.resumen_llano}{" "}
            <a href={m.norma.url_fuente}>fuente</a>
          </li>
        ))}
      </ol>
    </main>
  );
}
