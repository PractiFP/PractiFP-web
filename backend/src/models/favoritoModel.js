// Consultas sobre FAVORITOS (clave primaria compuesta: alumno + oferta).
import { query } from '../config/db.js';

/** Guarda la oferta. Devuelve false si ya estaba guardada. */
export async function guardar(alumnoId, ofertaId) {
  const r = await query('INSERT IGNORE INTO FAVORITOS (alumno_id, oferta_id) VALUES (?, ?)', [alumnoId, ofertaId]);
  return r.affectedRows > 0;
}

export async function quitar(alumnoId, ofertaId) {
  const r = await query('DELETE FROM FAVORITOS WHERE alumno_id = ? AND oferta_id = ?', [alumnoId, ofertaId]);
  return r.affectedRows > 0;
}

export async function idsDeAlumno(alumnoId, ofertaIds) {
  if (!ofertaIds.length) return new Set();
  const filas = await query('SELECT oferta_id AS id FROM FAVORITOS WHERE alumno_id = ? AND oferta_id IN (?)', [alumnoId, ofertaIds]);
  return new Set(filas.map((f) => f.id));
}

/** Ids de las ofertas favoritas del alumno, de la más reciente a la más antigua. */
export async function listarIds(alumnoId) {
  const filas = await query('SELECT oferta_id AS id FROM FAVORITOS WHERE alumno_id = ? ORDER BY fecha_guardado DESC', [alumnoId]);
  return filas.map((f) => f.id);
}
