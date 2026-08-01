import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { rename } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Unzip, UnzipInflate } from "fflate";

// Descargas pesadas (la base de InfoLEG son 49 MB zip → 254 MB csv) cacheadas
// en disco. Está gitignoreado: el output commiteable es data/normas.json.
export const CACHE_DIR = new URL("../.cache/", import.meta.url).pathname;

function asegurarDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Baja un .zip de una sola entrada y deja el archivo descomprimido en el cache.
 * Descomprime en streaming: la base nacional no entra cómoda en memoria.
 * Idempotente — si el destino ya existe no vuelve a bajar nada.
 */
export async function zipCacheado(url: string, destino: string): Promise<string> {
  asegurarDir();
  const ruta = `${CACHE_DIR}${destino}`;
  if (existsSync(ruta)) return ruta;

  console.log(`  ↓ bajando ${destino} (una sola vez)...`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url} → HTTP ${res.status}`);

  const parcial = `${ruta}.parcial`;
  const salida = createWriteStream(parcial);

  const unzip = new Unzip();
  unzip.register(UnzipInflate);
  const escrituraLista = new Promise<void>((resolve, reject) => {
    salida.on("error", reject);
    unzip.onfile = (file) => {
      file.ondata = (err, chunk, final) => {
        if (err) return reject(err);
        if (chunk.length) salida.write(chunk);
        if (final) salida.end(() => resolve());
      };
      file.start();
    };
  });

  for await (const chunk of res.body) unzip.push(chunk as Uint8Array, false);
  unzip.push(new Uint8Array(0), true);
  await escrituraLista;

  // Rename atómico: un Ctrl-C a mitad no deja un cache corrupto que parezca válido.
  await rename(parcial, ruta);
  return ruta;
}

/**
 * Descarga de texto cacheada (CSVs chicos, páginas HTML de normas).
 * `encoding` importa: InfoLEG sirve las normas en latin-1, y leerlas como
 * UTF-8 rompe cada acento del texto que después va al LLM.
 */
export async function textoCacheado(
  url: string,
  destino: string,
  opts: { init?: RequestInit; encoding?: "utf-8" | "latin1" } = {},
): Promise<string> {
  asegurarDir();
  const { init, encoding = "utf-8" } = opts;
  const ruta = `${CACHE_DIR}${destino}`;
  const { readFile, writeFile } = await import("node:fs/promises");

  if (existsSync(ruta)) return readFile(ruta, "utf8");

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const texto = new TextDecoder(encoding).decode(await res.arrayBuffer());
  await writeFile(ruta, texto, "utf8"); // el cache siempre queda en UTF-8
  return texto;
}

/** Vuelca un stream web a un archivo (helper para descargas binarias). */
export async function guardarStream(res: Response, ruta: string): Promise<void> {
  if (!res.body) throw new Error("respuesta sin body");
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(ruta));
}
