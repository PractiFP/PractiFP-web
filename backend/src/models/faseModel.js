// Consultas sobre FASES_SELECCION. El orden es único dentro de cada oferta.
import { query } from '../config/db.js';

export function listar(ofertaId) {
  return query(
    `SELECT id, nombre, descripcion, orden, duracion_dias AS duracionDias, obligatoria
       FROM FASES_SELECCION WHERE oferta_id = ? ORDER BY orden`,
    [ofertaId]
  ).then((filas) => filas.map((f) => ({ ...f, obligatoria: Boolean(f.obligatoria) })));
}

/** Fases de varias ofertas: { ofertaId: [fases] } */
export async function listarDeOfertas(ofertaIds) {
  if (!ofertaIds.length) return {};
  const filas = await query(
    'SELECT id, oferta_id AS ofertaId, nombre, orden FROM FASES_SELECCION WHERE oferta_id IN (?) ORDER BY orden',
    [ofertaIds]
  );
  const mapa = {};
  for (const f of filas) (mapa[f.ofertaId] ??= []).push({ id: f.id, nombre: f.nombre, orden: f.orden });
  return mapa;
}

/**
 * Guarda la lista completa de fases de una oferta dentro de una transacción.
 * Las fases que traen id se actualizan (así se conserva la fase actual de las
 * candidaturas), las nuevas se insertan y las que no aparecen se eliminan.
 */
export async function guardarTodas(conn, ofertaId, fases) {
  const conservar = fases.filter((f) => f.id).map((f) => f.id);
  if (conservar.length) {
    await conn.query('DELETE FROM FASES_SELECCION WHERE oferta_id = ? AND id NOT IN (?)', [ofertaId, conservar]);
    // Orden provisional fuera de rango para no chocar con la restricción UNIQUE (oferta, orden) al reordenar
    await conn.query('UPDATE FASES_SELECCION SET orden = orden + 100 WHERE oferta_id = ?', [ofertaId]);
  } else {
    await conn.query('DELETE FROM FASES_SELECCION WHERE oferta_id = ?', [ofertaId]);
  }
  for (const [i, f] of fases.entries()) {
    if (f.id) {
      await conn.query(
        'UPDATE FASES_SELECCION SET nombre = ?, descripcion = ?, orden = ?, duracion_dias = ?, obligatoria = ? WHERE id = ? AND oferta_id = ?',
        [f.nombre, f.descripcion, i + 1, f.duracionDias, f.obligatoria, f.id, ofertaId]
      );
    } else {
      await conn.query(
        'INSERT INTO FASES_SELECCION (oferta_id, nombre, descripcion, orden, duracion_dias, obligatoria) VALUES (?, ?, ?, ?, ?, ?)',
        [ofertaId, f.nombre, f.descripcion, i + 1, f.duracionDias, f.obligatoria]
      );
    }
  }
}

export async function perteneceAOferta(faseId, ofertaId) {
  const [fila] = await query('SELECT 1 AS si FROM FASES_SELECCION WHERE id = ? AND oferta_id = ?', [faseId, ofertaId]);
  return Boolean(fila);
}
