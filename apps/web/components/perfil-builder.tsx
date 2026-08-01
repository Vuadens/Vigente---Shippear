"use client";

import { useState } from "react";
import { RUBROS, type Perfil } from "@vigente/schema";

// Paso 8 de la demo: armar un perfil en vivo. Los cambios disparan un
// re-match inmediato (lo maneja el padre vía onCambio) y "Guardar" lo persiste.

// El vocabulario de rubros es canónico y vive en @vigente/schema (contrato
// congelado). El matcher compara exacto contra estos valores, así que NO usamos
// texto libre: solo mapeamos cada value a una etiqueta legible.
const RUBRO_LABEL: Record<string, string> = {
  gastronomia: "Gastronomía",
  comercio: "Comercio",
  construccion: "Construcción",
  transporte: "Transporte",
  industria: "Industria",
  servicios: "Servicios",
};
const OPCIONES_RUBRO = [
  { value: "", label: "Sin rubro / particular" },
  ...RUBROS.map((r) => ({ value: r, label: RUBRO_LABEL[r] ?? r })),
];

const CONDICIONES = [
  { value: "local_a_la_calle", label: "Local a la calle" },
  { value: "empleados", label: "Tiene empleados" },
  { value: "manipula_alimentos", label: "Manipula alimentos" },
  { value: "obra_en_vivienda", label: "Va a hacer una obra" },
];

// Rosario centro por defecto (coincide con la normativa cargada en la demo).
const COORDS_DEFAULT: [number, number] = [-32.9468, -60.6393];

interface Props {
  onCambio: (perfil: Perfil) => void;
  onGuardar: (nombre: string, perfil: Perfil) => Promise<void>;
  guardando: boolean;
}

export function PerfilBuilder({ onCambio, onGuardar, guardando }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"comercio" | "persona_fisica">("comercio");
  const [rubro, setRubro] = useState("");
  const [direccion, setDireccion] = useState("Rosario, Santa Fe");
  const [condiciones, setCondiciones] = useState<string[]>(["local_a_la_calle"]);

  function armarPerfil(next?: Partial<{ tipo: typeof tipo; rubro: string; direccion: string; condiciones: string[] }>): Perfil {
    return {
      tipo_sujeto: next?.tipo ?? tipo,
      rubro: next?.rubro ?? rubro,
      ubicacion: { direccion: next?.direccion ?? direccion, coords: COORDS_DEFAULT },
      condiciones: next?.condiciones ?? condiciones,
      intencion: "",
    };
  }

  function toggleCondicion(value: string) {
    const next = condiciones.includes(value)
      ? condiciones.filter((c) => c !== value)
      : [...condiciones, value];
    setCondiciones(next);
    onCambio(armarPerfil({ condiciones: next }));
  }

  return (
    <div className="builder">
      <div className="field">
        <label htmlFor="b-tipo">Tipo</label>
        <select
          id="b-tipo"
          value={tipo}
          onChange={(e) => {
            const v = e.target.value as typeof tipo;
            setTipo(v);
            onCambio(armarPerfil({ tipo: v }));
          }}
        >
          <option value="comercio">Comercio</option>
          <option value="persona_fisica">Persona física</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="b-rubro">Rubro</label>
        <select
          id="b-rubro"
          value={rubro}
          onChange={(e) => {
            setRubro(e.target.value);
            onCambio(armarPerfil({ rubro: e.target.value }));
          }}
        >
          {OPCIONES_RUBRO.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="b-dir">Dirección</label>
        <input
          id="b-dir"
          value={direccion}
          onChange={(e) => {
            setDireccion(e.target.value);
            onCambio(armarPerfil({ direccion: e.target.value }));
          }}
          placeholder="Av. Pellegrini 1234, Rosario"
        />
      </div>

      <fieldset className="field cond">
        <legend>Condiciones</legend>
        {CONDICIONES.map((c) => (
          <label key={c.value} className="check">
            <input
              type="checkbox"
              checked={condiciones.includes(c.value)}
              onChange={() => toggleCondicion(c.value)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <div className="save-row">
        <input
          aria-label="Nombre del perfil"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre (ej: Mi bar de Pellegrini)"
        />
        <button
          type="button"
          className="btn"
          disabled={guardando || !nombre.trim()}
          onClick={() => onGuardar(nombre.trim(), armarPerfil())}
        >
          {guardando ? "Guardando…" : "Guardar mi perfil"}
        </button>
      </div>
    </div>
  );
}
