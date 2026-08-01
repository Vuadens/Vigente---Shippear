"use client";

import { useState } from "react";
import type { MatchResponse, ResultadoItem } from "../lib/tipos";
import type { Perfil } from "@vigente/schema";
import { ListaObligaciones } from "./lista-obligaciones";

const EJEMPLOS = [
  "quiero construir algo en mi casa, ¿qué tengo que saber?",
  "tengo un bar con mesas en la vereda en Rosario",
];

type Estado = "idle" | "cargando" | "listo" | "error";

export function Consulta() {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [items, setItems] = useState<ResultadoItem[]>([]);

  async function consultar(pregunta: string) {
    const q = pregunta.trim();
    if (!q) return;
    setEstado("cargando");
    setError(null);
    try {
      // 1) Modo pull: texto -> Perfil (única llamada LLM, con fallback de guión).
      const rIntent = await fetch("/api/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pregunta: q }),
      });
      if (!rIntent.ok) throw new Error("No pude interpretar la consulta.");
      const { perfil: p } = (await rIntent.json()) as { perfil: Perfil };

      // 2) Perfil -> obligaciones (matcher puro, sin LLM).
      const rMatch = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ perfil: p }),
      });
      if (!rMatch.ok) throw new Error("No pude cruzar tu perfil con la normativa.");
      const data = (await rMatch.json()) as MatchResponse;

      setPerfil(data.perfil);
      setItems(data.items);
      setEstado("listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
      setEstado("error");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    consultar(texto);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envía; Shift+Enter salta línea. Respeta composición de IME.
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      consultar(texto);
    }
  }

  return (
    <section>
      <p className="lead">
        Contame qué estás por hacer o qué tipo de comercio tenés, y te digo qué normativa
        vigente te aplica hoy —con plazos y consecuencias concretas.
      </p>

      <form className="query" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="pregunta">
          Tu consulta sobre normativa
        </label>
        <textarea
          id="pregunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ej: quiero construir algo en mi casa, ¿qué tengo que saber?"
        />
        <button className="btn" type="submit" disabled={estado === "cargando" || !texto.trim()}>
          {estado === "cargando" ? "Consultando…" : "Ver qué me aplica"}
        </button>
      </form>

      <div className="examples" aria-label="Consultas de ejemplo">
        {EJEMPLOS.map((ej) => (
          <button
            key={ej}
            type="button"
            className="chip"
            onClick={() => {
              setTexto(ej);
              consultar(ej);
            }}
          >
            {ej}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {estado === "listo" && perfil && (
        <>
          <div className="resumen">
            <span className="resumen-label">Esto es lo que entendí</span>
            <div className="resumen-tags">
              {perfil.rubro && <span className="tag">{perfil.rubro}</span>}
              {perfil.condiciones.map((c) => (
                <span key={c} className="tag">
                  {c.replace(/_/g, " ")}
                </span>
              ))}
              {perfil.intencion && <span className="tag">{perfil.intencion}</span>}
              {!perfil.rubro && perfil.condiciones.length === 0 && !perfil.intencion && (
                <span className="resumen-vacio">una consulta general</span>
              )}
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <p className="count">
                {items.length} {items.length === 1 ? "obligación te aplica" : "obligaciones te aplican"}
              </p>
              <ListaObligaciones items={items} />
            </>
          ) : (
            <div className="empty">
              <strong>No encontré normativa que aplique a esto en mi base.</strong>
              No invento resultados: si una norma no está cargada, no aparece. Probá
              reformular la consulta con más detalle (rubro, actividad o ubicación).
            </div>
          )}
        </>
      )}
    </section>
  );
}
