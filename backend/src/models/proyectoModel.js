// Consultas sobre PROYECTOS y PROYECTO_TECNOLOGIA.
import { query } from '../config/db.js';

const COLUMNAS = `p.id, p.alumno_id AS alumnoId, p.titulo, p.descripcion, p.imagen_ruta IS NOT NULL AS tieneImagen,
  p.url_github AS urlGithub, p.url_demo AS urlDemo, p.fecha_creacion AS fechaCreacion`;

async function conTecnologias(proyectos) {
  if (!proyectos.length) return proyectos;
  const filas = await query(
    `SELECT pt.proyecto_id AS proyectoId, t.id, t.nombre
       FROM PROYECTO_TECNOLOGIA pt JOIN TECNOLOGIAS t ON t.id = pt.tecnologia_id
      WHERE pt.proyecto_id IN (?) ORDER BY t.nombre`,
    [proyectos.map((p) => p.id)]
  );
  return proyectos.map((p) => ({
    ...p,
    tieneImagen: Boolean(p.tieneImagen),
    tecnologias: filas.filter((f) => f.proyectoId === p.id).map(({ id, nombre }) => ({ id, nombre })),
  }));
}

export async function listarDeAlumno(alumnoId) {
  return conTecnologias(await query(`SELECT ${COLUMNAS} FROM PROYECTOS p WHERE p.alumno_id = ? ORDER BY p.fecha_creacion DESC, p.id DESC`, [alumnoId]));
}

export async function obtener(id) {
  const [fila] = await query(`SELECT ${COLUMNAS}, p.imagen_ruta AS imagenRuta FROM PROYECTOS p WHERE p.id = ?`, [id]);
  if (!fila) return null;
  const [proyecto] = await conTecnologias([fila]);
  return proyecto;
}

/** Datos para servir la imagen: solo de alumnos con la cuenta activa. */
export async function obtenerImagen(id) {
  const [fila] = await query(
    `SELECT p.imagen_ruta AS ruta, u.activo FROM PROYECTOS p
       JOIN ALUMNOS a ON a.id = p.alumno_id JOIN USUARIOS u ON u.id = a.usuario_id
      WHERE p.id = ?`,
    [id]
  );
  return fila || null;
}

export async function crear(conn, alumnoId, d) {
  const r = await conn.query(
    'INSERT INTO PROYECTOS (alumno_id, titulo, descripcion, imagen_ruta, url_github, url_demo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [alumnoId, d.titulo, d.descripcion, d.imagenRuta, d.urlGithub, d.urlDemo, d.fechaCreacion]
  );
  return r.insertId;
}

export async function actualizar(conn, id, d) {
  await conn.query(
    'UPDATE PROYECTOS SET titulo = ?, descripcion = ?, imagen_ruta = ?, url_github = ?, url_demo = ?, fecha_creacion = ? WHERE id = ?',
    [d.titulo, d.descripcion, d.imagenRuta, d.urlGithub, d.urlDemo, d.fechaCreacion, id]
  );
}

export async function guardarTecnologias(conn, proyectoId, ids) {
  await conn.query('DELETE FROM PROYECTO_TECNOLOGIA WHERE proyecto_id = ?', [proyectoId]);
  if (ids.length) await conn.batch('INSERT INTO PROYECTO_TECNOLOGIA (proyecto_id, tecnologia_id) VALUES (?, ?)', ids.map((t) => [proyectoId, t]));
}

export async function eliminar(id) {
  await query('DELETE FROM PROYECTOS WHERE id = ?', [id]);
}
