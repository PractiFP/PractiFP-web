// Consultas sobre ALUMNOS y sus tecnologías.
import { query } from '../config/db.js';

export async function crear(conn, { usuarioId, nombre, apellidos, cicloId }) {
  const r = await conn.query(
    'INSERT INTO ALUMNOS (usuario_id, nombre, apellidos, ciclo_id) VALUES (?, ?, ?, ?)',
    [usuarioId, nombre, apellidos, cicloId]
  );
  return r.insertId;
}

/** Perfil completo. No incluye el email ni la ruta del CV (solo si existe). */
export async function obtenerPerfil(id) {
  const [fila] = await query(
    `SELECT a.id, a.usuario_id AS usuarioId, a.nombre, a.apellidos, a.curso, a.centro, a.localidad, a.descripcion,
            a.cv_ruta IS NOT NULL AS tieneCv,
            c.id AS cicloId, c.codigo AS cicloCodigo, c.nombre AS cicloNombre,
            u.activo
       FROM ALUMNOS a
       JOIN USUARIOS u ON u.id = a.usuario_id
       LEFT JOIN CICLOS c ON c.id = a.ciclo_id
      WHERE a.id = ?`,
    [id]
  );
  if (!fila) return null;
  const { cicloId, cicloCodigo, cicloNombre, ...resto } = fila;
  return {
    ...resto,
    tieneCv: Boolean(fila.tieneCv),
    activo: Boolean(fila.activo),
    ciclo: cicloId ? { id: cicloId, codigo: cicloCodigo, nombre: cicloNombre } : null,
    tecnologias: await listarTecnologias(id),
  };
}

export async function actualizar(id, d) {
  await query(
    `UPDATE ALUMNOS SET nombre = ?, apellidos = ?, ciclo_id = ?, curso = ?, centro = ?, localidad = ?, descripcion = ?
      WHERE id = ?`,
    [d.nombre, d.apellidos, d.cicloId, d.curso, d.centro, d.localidad, d.descripcion, id]
  );
}

export async function obtenerCvRuta(id) {
  const [fila] = await query('SELECT cv_ruta AS ruta FROM ALUMNOS WHERE id = ?', [id]);
  return fila?.ruta ?? null;
}

export async function guardarCvRuta(id, ruta) {
  await query('UPDATE ALUMNOS SET cv_ruta = ? WHERE id = ?', [ruta, id]);
}

export function listarTecnologias(alumnoId) {
  return query(
    `SELECT t.id, t.nombre, at.nivel
       FROM ALUMNO_TECNOLOGIA at JOIN TECNOLOGIAS t ON t.id = at.tecnologia_id
      WHERE at.alumno_id = ?
      ORDER BY FIELD(at.nivel, 'AVANZADO', 'INTERMEDIO', 'BASICO'), t.nombre`,
    [alumnoId]
  );
}

/** Añade la tecnología o cambia su nivel si ya la tenía. */
export async function guardarTecnologia(alumnoId, tecnologiaId, nivel) {
  await query(
    `INSERT INTO ALUMNO_TECNOLOGIA (alumno_id, tecnologia_id, nivel) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nivel = VALUES(nivel)`,
    [alumnoId, tecnologiaId, nivel]
  );
}

export async function quitarTecnologia(alumnoId, tecnologiaId) {
  const r = await query('DELETE FROM ALUMNO_TECNOLOGIA WHERE alumno_id = ? AND tecnologia_id = ?', [alumnoId, tecnologiaId]);
  return r.affectedRows > 0;
}

/** ¿El alumno se ha inscrito en alguna oferta de esta empresa? (permite a la empresa ver su CV) */
export async function tieneCandidaturaEnEmpresa(alumnoId, empresaId) {
  const [fila] = await query(
    `SELECT 1 AS si FROM CANDIDATURAS c JOIN OFERTAS o ON o.id = c.oferta_id
      WHERE c.alumno_id = ? AND o.empresa_id = ? LIMIT 1`,
    [alumnoId, empresaId]
  );
  return Boolean(fila);
}
