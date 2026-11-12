// Utilidades comunes de las pruebas automáticas.
// Las pruebas usan una base de datos aparte (DB_NAME + "_test") y una carpeta de
// archivos temporal, así que no tocan los datos de desarrollo.
import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

process.env.DB_NAME = process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test`;
process.env.UPLOADS_DIR = mkdtempSync(path.join(os.tmpdir(), 'practifp-pruebas-'));
process.env.NODE_ENV = 'test';

const { reiniciarBaseDatos } = await import('../scripts/reiniciarBaseDatos.js');
const { default: app } = await import('../src/app.js');
const { pool } = await import('../src/config/db.js');

let servidor;
let base;

/** Reinicia la base de datos de pruebas y arranca la API en un puerto libre. */
export async function iniciar() {
  await reiniciarBaseDatos({ silencioso: true });
  await new Promise((ok) => { servidor = app.listen(0, ok); });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
}

/** URL base de la API de pruebas (p. ej. http://127.0.0.1:41234/api). */
export const urlBase = () => base;

export async function terminar() {
  // Se limpia todo aunque iniciar() haya fallado (por ejemplo, con la base de datos parada)
  if (servidor) await new Promise((ok) => servidor.close(ok));
  await pool.end().catch(() => {});
  rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
}

/**
 * Petición a la API. Devuelve { status, headers, data, error } (o buffer si binario=true).
 * `cuerpo` puede ser un objeto (se envía como JSON) o un FormData.
 */
export async function api(metodo, ruta, { cuerpo, token, binario = false } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let body;
  if (cuerpo instanceof FormData) body = cuerpo;
  else if (cuerpo !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(cuerpo); }
  const res = await fetch(base + ruta, { method: metodo, headers, body });
  if (binario) return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()) };
  const json = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data: json?.data, error: json?.error };
}

export const PASSWORD = 'practifp123';
export const CUENTAS = {
  admin: 'admin@practifp.es',
  lucia: 'lucia.martin@correo.example', // alumna DAM: 4 candidaturas, aceptada en Cantábrico Data
  carlos: 'carlos.ruiz@correo.example',
  ana: 'ana.lopez@correo.example',
  pablo: 'pablo.sanz@correo.example', // cuenta desactivada
  nubalia: 'rrhh@nubalia.example', // empresa 1 (verificada)
  turia: 'hola@turiaapps.example', // empresa 3
  ebro: 'info@ebroredes.example', // empresa 7 (sin verificar)
};

/** Inicia sesión y devuelve el token. */
export async function entrar(cuenta) {
  const r = await api('POST', '/auth/login', { cuerpo: { email: CUENTAS[cuenta] ?? cuenta, password: PASSWORD } });
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión con ${cuenta}: ${r.error?.mensaje}`);
  return r.data.token;
}

export const fechaDentroDe = (dias) => new Date(Date.now() + dias * 864e5).toLocaleDateString('sv-SE');

/** Archivo para subir en un formulario multipart. */
export function formulario(campos, archivo) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.append(k, typeof v === 'string' ? v : JSON.stringify(v));
  if (archivo) fd.append(archivo.campo, new Blob([archivo.contenido], { type: archivo.tipo }), archivo.nombre);
  return fd;
}

/** PNG mínimo válido (generado en memoria) para las pruebas de imágenes. */
export async function pngDePrueba() {
  const { deflateSync, crc32 } = await import('node:zlib');
  const trozo = (tipo, datos) => {
    const t = Buffer.from(tipo);
    const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, datos])) >>> 0);
    return Buffer.concat([largo, t, datos, crc]);
  };
  const cabecera = Buffer.alloc(13); cabecera.writeUInt32BE(4, 0); cabecera.writeUInt32BE(4, 4); cabecera[8] = 8; cabecera[9] = 2;
  const pixeles = Buffer.concat(Array.from({ length: 4 }, () => Buffer.from([0, ...Array(12).fill(120)])));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), trozo('IHDR', cabecera), trozo('IDAT', deflateSync(pixeles)), trozo('IEND', Buffer.alloc(0))]);
}

export const PDF_DE_PRUEBA = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
