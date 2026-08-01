// Validador del contrato: pnpm -F @vigente/matcher validar
// Parsea data/normas.json (o el ejemplo si no existe) con NormaSchema y
// reporta errores por norma, ids duplicados y relaciones que apuntan al vacío.
import { readFileSync, existsSync } from "node:fs";
import { NormaSchema, type Norma } from "@vigente/schema";

const real = new URL("../../../data/normas.json", import.meta.url).pathname;
const ejemplo = new URL("../../../data/normas.ejemplo.json", import.meta.url).pathname;
const ruta = existsSync(real) ? real : ejemplo;

console.log(`Validando ${ruta}\n`);
const crudo = JSON.parse(readFileSync(ruta, "utf8"));
if (!Array.isArray(crudo)) {
  console.error("El archivo no es un array de normas.");
  process.exit(1);
}

let errores = 0;
const validas: Norma[] = [];
crudo.forEach((n, i) => {
  const r = NormaSchema.safeParse(n);
  if (r.success) {
    validas.push(r.data);
    return;
  }
  errores++;
  console.error(`✗ [${i}] ${n?.id ?? "(sin id)"}`);
  for (const issue of r.error.issues) {
    console.error(`    ${issue.path.join(".")}: ${issue.message}`);
  }
});

const ids = new Map<string, number>();
for (const n of validas) ids.set(n.id, (ids.get(n.id) ?? 0) + 1);
for (const [id, veces] of ids) {
  if (veces > 1) {
    errores++;
    console.error(`✗ id duplicado: ${id} (${veces} veces)`);
  }
}

for (const n of validas) {
  for (const r of n.relaciones) {
    if (!ids.has(r.norma)) {
      // No es error: la norma referida puede no estar en la selección de 60.
      console.warn(`⚠ ${n.id} ${r.tipo} → ${r.norma} (no está en el JSON; no entra al grafo de vigencia)`);
    }
  }
}

const totalObligaciones = validas.reduce((acc, n) => acc + n.obligaciones.length, 0);
console.log(`\n${validas.length}/${crudo.length} normas válidas · ${totalObligaciones} obligaciones`);
if (errores > 0) {
  console.error(`${errores} errores.`);
  process.exit(1);
}
console.log("Contrato OK.");
