// Consultas sobre VALORACIONES (una por alumno y empresa; puntuación de 1 a 5).
import { query } from '../config/db.js';

/** Valoraciones aprobadas de una empresa, con el nombre abreviado del alumno. */
export function listarAprobadas(empresaId) {
  return query(
    `SELECT v.id, v.puntuacion, v.comentario, v.fecha,
            a.nombre AS alumnoNombre, LEFT(a.apellidos, 1) AS alumnoInicial, c.codigo AS ciclo
       FROM VALORACIONES v
       JOIN ALUMNOS a ON a.id = v.alumno_id
       LEFT JOIN CICLOS c ON c.id = a.ciclo_id
      WHERE v.empresa_id = ? AND v.estado = 'APROBADA'
      ORDER BY v.fecha DESC`,
    [empresaId]
  ).then((filas) => filas.map((f) => ({
    id: f.id, puntuacion: f.puntuacion, comentario: f.comentario, fecha: f.fecha,
    autor: `${f.alumnoNombre} ${f.alumnoInicial}.`, ciclo: f.ciclo,
  })));
}

export async function deAlumno(alumnoId, empresaId) {
  const [fila] = await query(
    'SELECT id, puntuacion, comentario, fecha, estado FROM VALORACIONES WHERE alumno_id = ? AND empresa_id = ?',
    [alumnoId, empresaId]
  );
  return fila || null;
}

/** Valoraciones del alumno por empresa: { empresaId: estado } */
export async function estadosDeAlumno(alumnoId) {
  const filas = await query('SELECT empresa_id AS empresaId, estado FROM VALORACIONES WHERE alumno_id = ?', [alumnoId]);
  return Object.fromEntries(filas.map((f) => [f.empresaId, f.estado]));
}

/** ¿Tiene el alumno alguna candidatura ACEPTADA en una oferta de esta empresa? */
export async function tieneExperiencia(alumnoId, empresaId) {
  const [fila] = await query(
    `SELECT 1 AS si FROM CANDIDATURAS c JOIN OFERTAS o ON o.id = c.oferta_id
      WHERE c.alumno_id = ? AND o.empresa_id = ? AND c.estado = 'ACEPTADA' LIMIT 1`,
    [alumnoId, empresaId]
  );
  return Boolean(fila);
}

export async function crear(alumnoId, empresaId, puntuacion, comentario) {
  const r = await query(
    'INSERT INTO VALORACIONES (empresa_id, alumno_id, puntuacion, comentario) VALUES (?, ?, ?, ?)',
    [empresaId, alumnoId, puntuacion, comentario]
  );
  return r.insertId;
}
