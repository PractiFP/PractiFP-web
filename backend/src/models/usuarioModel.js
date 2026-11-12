// Consultas sobre USUARIOS (siempre parametrizadas).
import { query } from '../config/db.js';

export async function buscarPorEmail(email) {
  const [fila] = await query(
    'SELECT id, email, password_hash AS passwordHash, rol, activo FROM USUARIOS WHERE email = ?',
    [email]
  );
  return fila || null;
}

export async function existeEmail(email) {
  const [fila] = await query('SELECT 1 AS existe FROM USUARIOS WHERE email = ?', [email]);
  return Boolean(fila);
}

export async function crear(conn, { email, passwordHash, rol }) {
  const r = await conn.query('INSERT INTO USUARIOS (email, password_hash, rol) VALUES (?, ?, ?)', [email, passwordHash, rol]);
  return r.insertId;
}

/** Datos de sesión: usuario + nombre visible y perfil según su rol. */
export async function obtenerSesion(id) {
  const [fila] = await query(
    `SELECT u.id, u.email, u.rol, u.activo, u.fecha_registro AS fechaRegistro,
            a.id AS alumnoId, a.nombre AS alumnoNombre, a.apellidos AS alumnoApellidos, c.codigo AS ciclo,
            e.id AS empresaId, e.nombre AS empresaNombre, e.verificada
       FROM USUARIOS u
       LEFT JOIN ALUMNOS a  ON a.usuario_id = u.id
       LEFT JOIN CICLOS c   ON c.id = a.ciclo_id
       LEFT JOIN EMPRESAS e ON e.usuario_id = u.id
      WHERE u.id = ?`,
    [id]
  );
  if (!fila) return null;

  const sesion = { id: fila.id, email: fila.email, rol: fila.rol, activo: Boolean(fila.activo), fechaRegistro: fila.fechaRegistro };
  if (fila.rol === 'ALUMNO') {
    Object.assign(sesion, { nombre: `${fila.alumnoNombre} ${fila.alumnoApellidos}`, nombreCorto: fila.alumnoNombre, alumnoId: fila.alumnoId, ciclo: fila.ciclo });
  } else if (fila.rol === 'EMPRESA') {
    Object.assign(sesion, { nombre: fila.empresaNombre, nombreCorto: fila.empresaNombre, empresaId: fila.empresaId, verificada: Boolean(fila.verificada) });
  } else {
    Object.assign(sesion, { nombre: 'Administración', nombreCorto: 'Admin' });
  }
  return sesion;
}

export async function obtenerHash(id) {
  const [fila] = await query('SELECT password_hash AS hash FROM USUARIOS WHERE id = ?', [id]);
  return fila?.hash ?? null;
}

export async function actualizarEmail(id, email) {
  await query('UPDATE USUARIOS SET email = ? WHERE id = ?', [email, id]);
}

export async function actualizarPassword(id, passwordHash) {
  await query('UPDATE USUARIOS SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}
