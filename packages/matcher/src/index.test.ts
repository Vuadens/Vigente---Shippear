import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import type { Norma, Perfil } from "@vigente/schema";
import { match, alertas, vigencia } from "./index.ts";
import normasEjemplo from "../../../data/normas.ejemplo.json" with { type: "json" };
import perfiles from "../../../data/perfiles.json" with { type: "json" };

const normas = normasEjemplo as Norma[];
const bar = perfiles[0].perfil as Perfil;
const vecino = perfiles[1].perfil as Perfil;

test("bar: ve la ord-10800 nueva, no la ord-9027 derogada", () => {
  const r = match(bar, normas);
  const ids = r.map((m) => m.norma.id);
  assert.ok(ids.includes("ord-10800-2025"));
  assert.ok(!ids.includes("ord-9027-2012"), "la derogada se excluye");
});

test("modifica NO excluye: ambas visibles, la vieja marcada", () => {
  const modificatoria: Norma = {
    id: "ord-88888-2026",
    jurisdiccion: "municipal",
    tipo: "Ordenanza",
    numero: "88888/2026",
    fecha_publicacion: "2026-05-01",
    url_fuente: "https://example.com",
    resumen_llano: "Modifica parcialmente el permiso de edificación.",
    obligaciones: [
      {
        que_hacer: "Presentar además el plano de instalación eléctrica",
        alcanzados: { rubros: [], condiciones: ["obra_en_vivienda"] },
        plazo: { tipo: "permanente", valor: "" },
        si_no_cumplis: "Multa",
        confianza: 0.9,
      },
    ],
    geo: { tipo: "ciudad", descripcion: "Rosario", coords: [] },
    relaciones: [{ tipo: "modifica", norma: "ord-10500-2024" }],
  };
  const r = match(vecino, [...normas, modificatoria]);
  const ids = r.map((m) => m.norma.id);
  assert.ok(ids.includes("ord-10500-2024"), "la modificada sigue visible");
  assert.ok(ids.includes("ord-88888-2026"));
  const vieja = r.find((m) => m.norma.id === "ord-10500-2024");
  assert.equal(vieja?.estado, "modificada");
  assert.deepEqual(vieja?.afectada_por, ["ord-88888-2026"]);
});

test("bar: la obligación nueva expone qué reemplaza (demo paso 7)", () => {
  const r = match(bar, normas);
  const nueva = r.find((m) => m.norma.id === "ord-10800-2025");
  assert.ok(nueva?.reemplaza_a);
  assert.equal(nueva.reemplaza_a.norma.id, "ord-9027-2012");
});

test("vecino: solo el permiso de edificación", () => {
  const r = match(vecino, normas);
  assert.equal(r.length, 1);
  assert.equal(r[0].norma.id, "ord-10500-2024");
});

test("res-15 (nacional, zona 'Frente marítimo') no matchea a nadie", () => {
  for (const p of [bar, vecino]) {
    assert.ok(match(p, normas).every((m) => m.norma.id !== "res-15-2022"));
  }
});

test("rubro con mayúsculas/acentos matchea igual", () => {
  const r = match({ ...bar, rubro: "Gastronomía" }, normas);
  assert.ok(r.some((m) => m.norma.id === "ord-10800-2025"));
});

test("perfil de otra ciudad no matchea normas de Rosario", () => {
  const otro: Perfil = {
    ...bar,
    ubicacion: { direccion: "San Martín 100, San Lorenzo", coords: [] },
  };
  assert.equal(match(otro, normas).length, 0);
});

test("dirección vacía asume Rosario (default de la demo)", () => {
  const sinDir: Perfil = { ...bar, ubicacion: { direccion: "", coords: [] } };
  assert.ok(match(sinDir, normas).length > 0);
});

test("norma derogada se excluye", () => {
  const derogatoria: Norma = {
    id: "ord-99999-2026",
    jurisdiccion: "municipal",
    tipo: "Ordenanza",
    numero: "99999/2026",
    fecha_publicacion: "2026-01-01",
    url_fuente: "https://example.com",
    resumen_llano: "Deroga el permiso de edificación.",
    obligaciones: [],
    geo: { tipo: "ciudad", descripcion: "Rosario", coords: [] },
    relaciones: [{ tipo: "deroga", norma: "ord-10500-2024" }],
  };
  const todas = [...normas, derogatoria];
  assert.equal(vigencia(todas[2], todas).estado, "derogada");
  assert.equal(match(vecino, todas).length, 0);
});

test("orden: vencimiento más urgente primero, permanentes al final", () => {
  const r = match(bar, normas);
  const vences = r.map((m) => m.vence);
  const conFecha = vences.filter((v) => v !== null);
  assert.deepEqual(conFecha, [...conFecha].sort());
  const primerNull = vences.indexOf(null);
  if (primerNull !== -1) {
    assert.ok(vences.slice(primerNull).every((v) => v === null));
  }
});

test("smoke: data/normas.json real (si el pipeline ya corrió)", (t) => {
  const ruta = new URL("../../../data/normas.json", import.meta.url).pathname;
  if (!existsSync(ruta)) return t.skip("todavía no existe data/normas.json");
  const reales = JSON.parse(readFileSync(ruta, "utf8")) as Norma[];
  assert.ok(Array.isArray(reales) && reales.length > 0);
  const delBar = match(bar, reales);
  match(vecino, reales);
  assert.ok(delBar.length >= 1, "el bar seed debería matchear ≥1 obligación real");
});

test("alertas: solo normas publicadas desde la fecha dada", () => {
  const r = alertas(bar, normas, "2025-01-01");
  assert.ok(r.length > 0);
  assert.ok(r.every((m) => m.norma.fecha_publicacion >= "2025-01-01"));
  assert.equal(alertas(bar, normas, "2026-07-01").length, 0);
});
