"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ResultadoItem } from "../lib/tipos";
import { diasRestantes, urgencia } from "../lib/plazo";

// Mapa del modo push (Bloque B). Muestra un pin por ubicación con las
// obligaciones georreferenciadas del perfil. Es lo primero que se sacrifica
// si hay atraso (README §5), por eso vive aislado y se carga en cliente.

// Colores del semáforo de urgencia, tomados de los tokens de tema en runtime
// (así el pin acompaña light/dark). Fallback a valores fijos si no resuelve.
function colorUrgencia(nivel: string): string {
  const map: Record<string, string> = {
    urgent: "--urgent",
    soon: "--soon",
    later: "--primary",
    perm: "--ok",
  };
  const fallback: Record<string, string> = {
    urgent: "#c0392b",
    soon: "#b45309",
    later: "#0b6b66",
    perm: "#2f7d54",
  };
  if (typeof window === "undefined") return fallback[nivel] ?? fallback.perm;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(map[nivel] ?? "--ok")
    .trim();
  return v || fallback[nivel] || fallback.perm;
}

interface Punto {
  coords: [number, number];
  descripcion: string;
  items: ResultadoItem[];
}

function pinIcon(color: string, n: number) {
  return L.divIcon({
    className: "vg-pin",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${color};
      border:2px solid var(--surface,#fff);box-shadow:0 1px 4px rgba(0,0,0,.4);
      color:#fff;font:600 12px/1 var(--font-sans,sans-serif);
    "><span style="transform:rotate(45deg)">${n}</span></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });
}

function urgenciaPunto(items: ResultadoItem[]): string {
  const prioridad = ["urgent", "soon", "later", "perm"];
  return items
    .map((i) => urgencia(diasRestantes(i.vence)))
    .sort((a, b) => prioridad.indexOf(a) - prioridad.indexOf(b))[0] ?? "perm";
}

export default function Mapa({ items }: { items: ResultadoItem[] }) {
  // Agrupar por coordenada (solo las que están geocodificadas).
  const grupos = new Map<string, Punto>();
  for (const item of items) {
    const c = item.geo.coords;
    if (!c || c.length < 2) continue;
    const key = `${c[0]},${c[1]}`;
    if (!grupos.has(key)) {
      grupos.set(key, { coords: [c[0], c[1]], descripcion: item.geo.descripcion, items: [] });
    }
    grupos.get(key)!.items.push(item);
  }
  const puntos = [...grupos.values()];

  if (puntos.length === 0) {
    return (
      <div className="empty">
        Ninguna de estas obligaciones tiene una ubicación puntual en el mapa.
      </div>
    );
  }

  const centro = puntos[0].coords;

  return (
    <div className="mapa">
      <MapContainer center={centro} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {puntos.map((p) => {
          const u = urgenciaPunto(p.items);
          return (
            <Marker key={`${p.coords[0]},${p.coords[1]}`} position={p.coords} icon={pinIcon(colorUrgencia(u), p.items.length)}>
              <Popup>
                <strong>{p.descripcion}</strong>
                <br />
                {p.items.length} {p.items.length === 1 ? "obligación" : "obligaciones"}
                <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                  {p.items.map((i, idx) => (
                    <li key={idx}>{i.obligacion.que_hacer}</li>
                  ))}
                </ul>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
