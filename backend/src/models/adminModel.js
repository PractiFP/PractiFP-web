// Consultas para el panel de administración (siempre parametrizadas).
import { query } from '../config/db.js';

const like = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export async function listarUsuarios({ q, rol, activo }) {
  const condiciones = ['1 = 1'];
  const params = [];
  if (q) {
    condiciones.push(`(u.email LIKE ? OR CONCAT(a.nombre, ' ', a.apellidos) LIKE ? OR e.nombre LIKE ?)`);
    params.push(like(q), like(q), like(q));
  }
  if (rol) { condiciones.push('u.rol = ?'); params.push(rol); }
  if (activo !== null) { condiciones.push('u.activo = ?'); params.push(activo); }
  const filas = await query(
    `SELECT u.id, u.email, u.rol, u.activo, u.fecha_registro AS fechaRegistro,
            a.id AS alumnoId, CONCAT(a.nombre, ' ', a.apellidos) AS alumnoNombre,
            e.id AS empresaId, e.nombre AS empresaNombre
       FROM USUARIOS u
       LEFT JOIN ALUMNOS a ON a.usuario_id = u.id
       LEFT JOIN EMPRESAS e ON e.usuario_id = u.id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY u.fecha_registro DESC, u.id DESC`,
    params
  );
  return filas.map((f) => ({
    id: f.id, email: f.email, rol: f.rol, activo: Boolean(f.activo), fechaRegistro: f.fechaRegistro,
    nombre: f.alumnoNombre ?? f.empresaNombre ?? 'Administración',
    perfil: f.alumnoId ? { tipo: 'alumno', id: f.alumnoId } : f.empresaId ? { tipo: 'empresa', id: f.empresaId } : null,
  }));
}

export async function obtenerUsuario(id) {
  const [fila] = await query('SELECT id, rol, activo FROM USUARIOS WHERE id = ?', [id]);
  return fila || null;
}

export async function cambiarActivo(id, activo) {
  await query('UPDATE USUARIOS SET activo = ? WHERE id = ?', [activo, id]);
}

export async function listarEmpresas({ q, verificada }) {
  const condiciones = ['1 = 1'];
  const params = [];
  if (q) { condiciones.push('(e.nombre LIKE ? OR u.email LIKE ? OR e.localidad LIKE ?)'); params.push(like(q), like(q), like(q)); }
  if (verificada !== null) { condiciones.push('e.verificada = ?'); params.push(verificada); }
  const filas = await query(
    `SELECT e.id, e.nombre, e.descripcion, e.web, e.telefono, e.direccion, e.localidad, e.latitud, e.longitud, e.verificada,
            u.id AS usuarioId, u.email, u.activo, u.fecha_registro AS fechaRegistro,
            (SELECT COUNT(*) FROM OFERTAS o WHERE o.empresa_id = e.id) AS ofertas,
            (SELECT COUNT(*) FROM OFERTAS o WHERE o.empresa_id = e.id AND o.activa = TRUE AND o.fecha_limite >= CURRENT_DATE) AS ofertasAbiertas,
            (SELECT ROUND(AVG(v.puntuacion), 1) FROM VALORACIONES v WHERE v.empresa_id = e.id AND v.estado = 'APROBADA') AS valoracionMedia
       FROM EMPRESAS e JOIN USUARIOS u ON u.id = e.usuario_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY e.verificada ASC, u.fecha_registro DESC`,
    params
  );
  return filas.map((f) => ({ ...f, verificada: Boolean(f.verificada), activo: Boolean(f.activo), valoracionMedia: f.valoracionMedia === null ? null : Number(f.valoracionMedia) }));
}

export async function cambiarVerificada(empresaId, verificada) {
  const r = await query('UPDATE EMPRESAS SET verificada = ? WHERE id = ?', [verificada, empresaId]);
  return r.affectedRows > 0;
}

export async function listarOfertas({ q, estado }) {
  const condiciones = ['1 = 1'];
  const params = [];
  if (q) { condiciones.push('(o.titulo LIKE ? OR e.nombre LIKE ?)'); params.push(like(q), like(q)); }
  if (estado === 'abiertas') condiciones.push('o.activa = TRUE AND o.fecha_limite >= CURRENT_DATE');
  if (estado === 'cerradas') condiciones.push('o.activa = TRUE AND o.fecha_limite < CURRENT_DATE');
  if (estado === 'inactivas') condiciones.push('o.activa = FALSE');
  const filas = await query(
    `SELECT o.id, o.titulo, o.localidad, o.activa, o.fecha_publicacion AS fechaPublicacion, o.fecha_limite AS fechaLimite,
            (o.activa = TRUE AND o.fecha_limite >= CURRENT_DATE) AS abierta,
            c.codigo AS ciclo, e.id AS empresaId, e.nombre AS empresaNombre, e.verificada AS empresaVerificada,
            (SELECT COUNT(*) FROM CANDIDATURAS ca WHERE ca.oferta_id = o.id) AS candidaturas
       FROM OFERTAS o JOIN EMPRESAS e ON e.id = o.empresa_id JOIN CICLOS c ON c.id = o.ciclo_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY o.fecha_publicacion DESC, o.id DESC`,
    params
  );
  return filas.map((f) => ({
    id: f.id, titulo: f.titulo, localidad: f.localidad, ciclo: f.ciclo, activa: Boolean(f.activa), abierta: Boolean(f.abierta),
    fechaPublicacion: f.fechaPublicacion, fechaLimite: f.fechaLimite, candidaturas: f.candidaturas,
    empresa: { id: f.empresaId, nombre: f.empresaNombre, verificada: Boolean(f.empresaVerificada) },
  }));
}

export async function listarValoraciones({ estado }) {
  const filas = await query(
    `SELECT v.id, v.puntuacion, v.comentario, v.fecha, v.estado,
            e.id AS empresaId, e.nombre AS empresaNombre,
            a.id AS alumnoId, CONCAT(a.nombre, ' ', a.apellidos) AS alumnoNombre, u.email AS alumnoEmail
       FROM VALORACIONES v
       JOIN EMPRESAS e ON e.id = v.empresa_id
       JOIN ALUMNOS a ON a.id = v.alumno_id
       JOIN USUARIOS u ON u.id = a.usuario_id
      WHERE v.estado = ?
      ORDER BY v.fecha ${estado === 'PENDIENTE' ? 'ASC' : 'DESC'}`,
    [estado]
  );
  return filas.map((f) => ({
    id: f.id, puntuacion: f.puntuacion, comentario: f.comentario, fecha: f.fecha, estado: f.estado,
    empresa: { id: f.empresaId, nombre: f.empresaNombre },
    alumno: { id: f.alumnoId, nombre: f.alumnoNombre, email: f.alumnoEmail },
  }));
}

export async function contarValoraciones() {
  const filas = await query('SELECT estado, COUNT(*) AS n FROM VALORACIONES GROUP BY estado');
  return Object.fromEntries(['PENDIENTE', 'APROBADA', 'RECHAZADA'].map((e) => [e, filas.find((f) => f.estado === e)?.n ?? 0]));
}

export async function cambiarEstadoValoracion(id, estado) {
  const r = await query('UPDATE VALORACIONES SET estado = ? WHERE id = ?', [estado, id]);
  return r.affectedRows > 0;
}

export async function eliminarValoracion(id) {
  const r = await query('DELETE FROM VALORACIONES WHERE id = ?', [id]);
  return r.affectedRows > 0;
}
