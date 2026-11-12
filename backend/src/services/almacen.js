// Almacén de archivos con dos modos (ver config/archivos.js): carpetas en disco o tabla ARCHIVOS.
// Los nombres los genera siempre el servidor (nunca se usa el nombre que envía el usuario).
import crypto from 'node:crypto';
import path from 'node:path';
import { mkdir, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { query } from '../config/db.js';
import { ALMACEN, DIR_CV, DIR_PROYECTOS } from '../config/archivos.js';

const TIPOS = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const carpeta = (nombre) => (nombre.startsWith('cv_') ? DIR_CV : DIR_PROYECTOS);
// path.basename impide salir de la carpeta con "../"
const rutaEnDisco = (nombre) => path.join(carpeta(nombre), path.basename(nombre));

/** Nombre aleatorio, p. ej. cv_3_9f2c1a7b0d4e5f61.pdf */
export const nombreNuevo = (prefijo, extension) => `${prefijo}_${crypto.randomBytes(8).toString('hex')}${extension}`;

export async function guardar(nombre, buffer) {
  const tipo = TIPOS[path.extname(nombre)] ?? 'application/octet-stream';
  if (ALMACEN === 'bd') {
    await query('INSERT INTO ARCHIVOS (nombre, tipo, contenido, tamano) VALUES (?, ?, ?, ?)', [nombre, tipo, buffer, buffer.length]);
  } else {
    await mkdir(carpeta(nombre), { recursive: true });
    await writeFile(rutaEnDisco(nombre), buffer);
  }
}

/** Devuelve { buffer, tipo } o null si no existe. */
export async function leer(nombre) {
  if (ALMACEN === 'bd') {
    const [fila] = await query('SELECT tipo, contenido FROM ARCHIVOS WHERE nombre = ?', [nombre]);
    return fila ? { buffer: fila.contenido, tipo: fila.tipo } : null;
  }
  try {
    return { buffer: await readFile(rutaEnDisco(nombre)), tipo: TIPOS[path.extname(nombre)] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

/** Borra el archivo; no falla si ya no existía. */
export async function borrar(nombre) {
  if (!nombre) return;
  if (ALMACEN === 'bd') await query('DELETE FROM ARCHIVOS WHERE nombre = ?', [nombre]);
  else await unlink(rutaEnDisco(nombre)).catch(() => {});
}

/** Vacía las carpetas de archivos (solo en modo disco; en modo bd la tabla se recrea con el esquema). */
export async function vaciarDisco() {
  if (ALMACEN === 'bd') return;
  for (const dir of [DIR_CV, DIR_PROYECTOS]) {
    await mkdir(dir, { recursive: true });
    for (const f of await readdir(dir)) if (!f.startsWith('.')) await rm(path.join(dir, f));
  }
}
