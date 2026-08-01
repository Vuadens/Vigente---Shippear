"use client";

import { useState } from "react";
import type { ResultadoItem } from "../lib/tipos";
import { diasRestantes, bucketDe, fechaPartes, fechaLegible } from "../lib/plazo";

const JURIS: Record<string, string> = {
  municipal: "Municipal",
  provincial: "Provincial",
  nacional: "Nacional",
};

const VERBO: Record<string, string> = {
  modifica: "modifica a",
  deroga: "deroga a",
  prorroga: "prorroga a",
};

// Columna "para cuándo": el eje de toda la vista. Color solo por urgencia.
function Plazo({ vence }: { vence: string | null }) {
  const b = bucketDe(vence);
  const dias = diasRestantes(vence);

  let n: string;
  let u: string;
  if (b === "perm" || dias === null) {
    n = "—";
    u = "sin plazo";
  } else if (b === "vencido") {
    n = String(Math.abs(dias));
    u = Math.abs(dias) === 1 ? "día tarde" : "días tarde";
  } else if (b === "later" && vence) {
    const p = fechaPartes(vence);
    n = p.dia;
    u = p.mes;
  } else {
    n = String(dias);
    u = dias === 1 ? "día" : "días";
  }

  return (
    <span className={`ob-when ${b}`} aria-hidden="true">
      <span className="ob-when-n">{n}</span>
      <span className="ob-when-u">{u}</span>
    </span>
  );
}

function Chevron() {
  return (
    <svg className="ob-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ObligacionRow({ item }: { item: ResultadoItem }) {
  const [abierto, setAbierto] = useState(false);
  const dias = diasRestantes(item.vence);
  const detalleId = `detalle-${item.norma.id}-${item.obligacion.que_hacer.length}`;

  return (
    <li className="ob">
      <button
        type="button"
        className="ob-row"
        aria-expanded={abierto}
        aria-controls={detalleId}
        onClick={() => setAbierto((v) => !v)}
      >
        <Plazo vence={item.vence} />
        <span className="ob-main">
          <span className="ob-what">
            {item.obligacion.que_hacer}
            {item.estado === "modificada" && (
              <span
                className="ob-badge"
                title={
                  item.afectada_por.length > 0
                    ? `Modificada por ${item.afectada_por.map((a) => a.label).join(", ")}`
                    : "Modificada por una norma posterior"
                }
              >
                Modificada
              </span>
            )}
          </span>
          <span className="ob-src">
            {JURIS[item.norma.jurisdiccion]} · {item.norma.tipo} {item.norma.numero}
          </span>
        </span>
        <Chevron />
      </button>

      {abierto && (
        <dl className="detail" id={detalleId}>
          <div>
            <dt>Qué dice la norma</dt>
            <dd>{item.norma.resumen_llano}</dd>
          </div>

          <div>
            <dt>Por qué te aplica</dt>
            <dd>
              {item.porque.map((p, i) => (
                <span key={i} className="pill">
                  {p}
                </span>
              ))}
            </dd>
          </div>

          <div>
            <dt>Plazo</dt>
            <dd>
              {item.vence
                ? dias !== null && dias < 0
                  ? `Venció el ${fechaLegible(item.vence)}`
                  : `Hasta el ${fechaLegible(item.vence)}`
                : "Obligación permanente, sin fecha límite."}
            </dd>
          </div>

          <div>
            <dt>Si no cumplís</dt>
            <dd>{item.obligacion.si_no_cumplis}</dd>
          </div>

          {item.reemplaza_a ? (
            <div>
              <dt>Qué cambió</dt>
              <dd>
                <div className="diff">
                  <div className="diff-col diff-old">
                    <span className="diff-tag">Antes · {item.reemplaza_a.norma.tipo} {item.reemplaza_a.norma.numero}</span>
                    <span className="diff-txt tachado">{item.reemplaza_a.obligacion.que_hacer}</span>
                  </div>
                  <span className="diff-arrow" aria-hidden="true">→</span>
                  <div className="diff-col diff-new">
                    <span className="diff-tag">Ahora · {item.norma.tipo} {item.norma.numero}</span>
                    <span className="diff-txt">{item.obligacion.que_hacer}</span>
                  </div>
                </div>
              </dd>
            </div>
          ) : item.cambia.length > 0 ? (
            <div>
              <dt>Qué cambió</dt>
              <dd>
                Esta norma {VERBO[item.cambia[0].tipo] ?? "afecta a"}{" "}
                {item.cambia.map((c) => c.label).join(", ")}. Rige el régimen nuevo.
              </dd>
            </div>
          ) : null}

          {item.afectada_por.length > 0 && (
            <div>
              <dd className="warn">
                Ojo: esta norma fue modificada por {item.afectada_por.map((a) => a.label).join(", ")}.
                Verificá el texto vigente antes de actuar.
              </dd>
            </div>
          )}

          <div>
            <dt>Fuente oficial</dt>
            <dd>
              <a
                className="source"
                href={item.norma.url_fuente}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver publicación original
              </a>
              <span className="ob-src">
                {" "}
                · publicada el {fechaLegible(item.norma.fecha_publicacion)}
              </span>
            </dd>
          </div>
        </dl>
      )}
    </li>
  );
}
