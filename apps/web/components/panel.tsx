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

// Norma-novedad de la demo (ADR-0009): la ordenanza de mesas en la vereda que
// "llega" como alerta al perfil del bar. Debe existir en data/normas.json y
// matchear el perfil gastronómico, o el botón no aparece.
const NOVEDAD_ID = "ord-10608-2024";

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
  // Novedad entrante por Telegram (ADR-0009): el banner aparece sí o sí; el
  // envío al bot es best-effort en paralelo.
  const [novedad, setNovedad] = useState<ResultadoItem | null>(null);
  const [novedades, setNovedades] = useState(0);
  const [notificando, setNotificando] = useState(false);
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
    setNovedad(null); // la novedad entrante es por perfil; se limpia al cambiar

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

  // Disparo de la novedad (paso 9): el presentador simula que entró normativa
  // nueva. El banner + badge aparecen sí o sí; el POST a Telegram es best-effort
  // y no bloquea la UI (ADR-0009).
  async function dispararNovedad() {
    const sel = perfiles.find((p) => p.id === selId);
    const item = items.find((i) => i.norma.id === NOVEDAD_ID);
    if (!sel || !item) return;
    setNovedad(item);
    setNovedades((n) => n + 1);
    setNotificando(true);
    try {
      await fetch("/api/notificar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nombre: sel.nombre, perfil: sel.perfil, normaId: NOVEDAD_ID }),
      });
    } catch {
      // best-effort: la UI ya se actualizó, la demo no depende del envío.
    } finally {
      setNotificando(false);
    }
  }

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
      <div className="panel-head">
        <p className="lead">
          Perfiles bajo monitoreo. Cuando aparece normativa nueva que les aplica, cae acá —sin
          que tengan que buscar nada.
        </p>
        {novedades > 0 && (
          <span className="alerta-badge" aria-label={`${novedades} alertas nuevas`}>
            🔔 {novedades}
          </span>
        )}
      </div>

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

      {/* Disparo de demo (ADR-0009): visible solo si la norma-novedad matchea el
          perfil activo. Honesto: representa el batch detectando el cambio. */}
      {modo === "guardado" && items.some((i) => i.norma.id === NOVEDAD_ID) && (
        <div className="sim-row">
          <button
            type="button"
            className="sim-alerta"
            onClick={dispararNovedad}
            disabled={notificando}
          >
            {notificando ? "Enviando…" : "⚡ Simular normativa entrante"}
          </button>
        </div>
      )}

      {novedad && (
        <div className="novedad-banner" role="alert">
          <div className="novedad-head">
            <span className="novedad-tag">🔔 Nueva ordenanza que te afecta</span>
            <span className="novedad-norma">
              {novedad.norma.tipo} {novedad.norma.numero}
            </span>
          </div>
          <p className="novedad-res">{novedad.norma.resumen_llano}</p>
          <p className="novedad-que">
            <strong>Qué hacer:</strong> {novedad.obligacion.que_hacer}
          </p>
          <div className="novedad-foot">
            <a href={novedad.norma.url_fuente} target="_blank" rel="noreferrer">
              Fuente oficial ↗
            </a>
            <button
              type="button"
              className="novedad-x"
              onClick={() => setNovedad(null)}
              aria-label="Descartar alerta"
            >
              Descartar
            </button>
          </div>
        </div>
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
