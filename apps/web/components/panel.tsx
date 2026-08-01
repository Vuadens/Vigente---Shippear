"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Perfil, Respuesta } from "@vigente/schema";
import type { MatchResponse, ResultadoItem, PerfilGuardadoVista } from "../lib/tipos";
import { ListaObligaciones } from "./lista-obligaciones";
import { PerfilBuilder } from "./perfil-builder";

// El mapa carga solo en cliente: Leaflet toca window/document.
const Mapa = dynamic(() => import("./mapa"), {
  ssr: false,
  loading: () => <div className="mapa mapa-load">Cargando mapa…</div>,
});

type Modo = "guardado" | "nuevo";

export function Panel({ inicial }: { inicial: PerfilGuardadoVista[] }) {
  const [perfiles, setPerfiles] = useState<PerfilGuardadoVista[]>(inicial);
  const [modo, setModo] = useState<Modo>("guardado");
  const [selId, setSelId] = useState<number | null>(inicial[0]?.id ?? null);
  const [items, setItems] = useState<ResultadoItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Alerta de accionar (ADR-0008): solo para perfiles guardados, no en cada
  // tecleo del builder — cada síntesis es una llamada LLM.
  const [alerta, setAlerta] = useState<Respuesta | null>(null);
  const [pensando, setPensando] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correrMatch = useCallback(async (perfil: Perfil) => {
    setCargando(true);
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ perfil }),
      });
      const data = (await r.json()) as MatchResponse;
      setItems(data.items ?? []);
      setBuscado(true);
    } finally {
      setCargando(false);
    }
  }, []);

  // Perfil guardado seleccionado -> match inmediato + alerta sintetizada.
  useEffect(() => {
    if (modo !== "guardado") return;
    const sel = perfiles.find((p) => p.id === selId);
    if (!sel) return;
    correrMatch(sel.perfil);

    let vigente = true;
    setAlerta(null);
    setPensando(true);
    const pregunta =
      sel.perfil.intencion ||
      "¿Qué tengo que hacer para estar en regla y qué me conviene atender primero?";
    fetch("/api/respuesta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pregunta, perfil: sel.perfil }),
    })
      .then((r) => (r.ok ? r.json() : { respuesta: null }))
      .then(({ respuesta }: { respuesta: Respuesta | null }) => {
        if (vigente) setAlerta(respuesta);
      })
      .catch(() => {})
      .finally(() => {
        if (vigente) setPensando(false);
      });
    return () => {
      vigente = false;
    };
  }, [modo, selId, perfiles, correrMatch]);

  // Builder: re-match con debounce mientras se tipea/togglea.
  function onCambioBuilder(perfil: Perfil) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => correrMatch(perfil), 300);
  }

  async function onGuardar(nombre: string, perfil: Perfil) {
    setGuardando(true);
    try {
      const r = await fetch("/api/perfiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nombre, perfil }),
      });
      const { guardado } = (await r.json()) as { guardado: PerfilGuardadoVista };
      setPerfiles((prev) => [guardado, ...prev]);
      setModo("guardado");
      setSelId(guardado.id);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="panel">
      <p className="lead">
        Perfiles bajo monitoreo. Cuando aparece normativa nueva que les aplica, cae acá —sin
        que tengan que buscar nada.
      </p>

      <div className="perfil-bar" role="tablist" aria-label="Perfiles guardados">
        {perfiles.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={modo === "guardado" && selId === p.id}
            className={`chip ${modo === "guardado" && selId === p.id ? "chip-on" : ""}`}
            onClick={() => {
              setModo("guardado");
              setSelId(p.id);
            }}
          >
            {p.nombre}
          </button>
        ))}
        <button
          className={`chip chip-add ${modo === "nuevo" ? "chip-on" : ""}`}
          aria-selected={modo === "nuevo"}
          role="tab"
          onClick={() => {
            setModo("nuevo");
            setItems([]);
            setBuscado(false);
          }}
        >
          + Armar uno nuevo
        </button>
      </div>

      {modo === "nuevo" && (
        <PerfilBuilder onCambio={onCambioBuilder} onGuardar={onGuardar} guardando={guardando} />
      )}

      {modo === "guardado" && pensando && <p className="count">Armando la alerta…</p>}
      {modo === "guardado" && alerta && (
        <div className="respuesta">
          <span className="resumen-label">Tu accionar</span>
          {alerta.accion_principal && <p className="respuesta-accion">{alerta.accion_principal}</p>}
          <p className="respuesta-texto">{alerta.respuesta}</p>
        </div>
      )}

      <div className="panel-grid">
        <div className="panel-list">
          <p className="count">
            {cargando
              ? "Cruzando con la normativa…"
              : items.length > 0
                ? `${items.length} ${items.length === 1 ? "obligación vigente" : "obligaciones vigentes"}`
                : modo === "nuevo" && !buscado
                  ? "Elegí condiciones para ver qué le aplicaría."
                  : "No encontré normativa cargada que le aplique a este perfil."}
          </p>
          {items.length > 0 && <ListaObligaciones items={items} />}
        </div>

        <div className="panel-map">
          <Mapa items={items} />
        </div>
      </div>
    </section>
  );
}
