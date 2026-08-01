import type { ResultadoItem } from "../lib/tipos";
import { bucketDe, BUCKETS } from "../lib/plazo";
import { ObligacionRow } from "./obligacion-card";

// Timeline de obligaciones: en vez de cards sueltas, agrupamos por "para cuándo"
// (vencidas → esta semana → este mes → más adelante → sin plazo). El matcher ya
// ordena por urgencia, así que dentro de cada grupo se preserva ese orden.
export function ListaObligaciones({ items }: { items: ResultadoItem[] }) {
  const grupos = BUCKETS.map((b) => ({
    ...b,
    items: items.filter((it) => bucketDe(it.vence) === b.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="lista">
      {grupos.map((g) => (
        <section key={g.key} className={`grupo grupo-${g.key}`}>
          <header className="grupo-head">
            <span className="grupo-dot" aria-hidden="true" />
            <h3 className="grupo-title">{g.label}</h3>
            <span className="grupo-hint">{g.hint}</span>
            <span className="grupo-count">{g.items.length}</span>
          </header>
          <ul className="filas">
            {g.items.map((item, i) => (
              <ObligacionRow key={`${item.norma.id}-${i}`} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
