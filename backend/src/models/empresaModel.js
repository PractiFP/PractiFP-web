// Consultas sobre EMPRESAS.
import { query } from '../config/db.js';

export async function crear(conn, { usuarioId, nombre, localidad }) {
  const r = await conn.query(
    'INSERT INTO EMPRESAS (usuario_id, nombre, localidad) VALUES (?, ?, ?)',
    [usuarioId, nombre, localidad]
  );
  return r.insertId;
}

/** Perfil de la empresa (sin el email de la cuenta). */
export async function obtenerPerfil(id) {
  const [fila] = await query(
    `SELECT e.id, e.usuario_id AS usuarioId, e.nombre, e.descripcion, e.web, e.telefono, e.direccion, e.localidad,
            e.latitud, e.longitud, e.verificada, u.activo
       FROM EMPRESAS e JOIN USUARIOS u ON u.id = e.usuario_id
      WHERE e.id = ?`,
    [id]
  );
  if (!fila) return null;
  return { ...fila, verificada: Boolean(fila.verificada), activo: Boolean(fila.activo) };
}

export async function actualizar(id, d) {
  await query(
    `UPDATE EMPRESAS SET nombre = ?, descripcion = ?, web = ?, telefono = ?, direccion = ?, localidad = ?, latitud = ?, longitud = ?
      WHERE id = ?`,
    [d.nombre, d.descripcion, d.web, d.telefono, d.direccion, d.localidad, d.latitud, d.longitud, id]
  );
}

/** Empresas con la cuenta activa y su número de ofertas abiertas. */
export async function listar({ q, localidad } = {}) {
  const condiciones = ['u.activo = TRUE'];
  const params = [];
  if (q) { condiciones.push('e.nombre LIKE ?'); params.push(`%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`); }
  if (localidad) { condiciones.push('e.localidad = ?'); params.push(localidad); }
  const filas = await query(
    `SELECT e.id, e.nombre, e.descripcion, e.direccion, e.localidad, e.latitud, e.longitud, e.verificada,
            (SELECT COUNT(*) FROM OFERTAS o WHERE o.empresa_id = e.id AND o.activa = TRUE AND o.fecha_limite >= CURRENT_DATE) AS ofertasAbiertas,
            (SELECT ROUND(AVG(v.puntuacion), 1) FROM VALORACIONES v WHERE v.empresa_id = e.id AND v.estado = 'APROBADA') AS valoracionMedia
       FROM EMPRESAS e JOIN USUARIOS u ON u.id = e.usuario_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY ofertasAbiertas DESC, e.nombre`,
    params
  );
  return filas.map((f) => ({ ...f, verificada: Boolean(f.verificada), valoracionMedia: f.valoracionMedia === null ? null : Number(f.valoracionMedia) }));
}

export function localidades() {
  return query(
    `SELECT DISTINCT e.localidad AS nombre FROM EMPRESAS e JOIN USUARIOS u ON u.id = e.usuario_id
      WHERE u.activo = TRUE AND e.localidad IS NOT NULL ORDER BY e.localidad`
  );
}
