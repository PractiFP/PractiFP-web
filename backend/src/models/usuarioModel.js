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

export async function crear(conn, { email, passwordHash, rol, aceptaPrivacidad = false }) {
  const r = await conn.query(
    `INSERT INTO USUARIOS (email, password_hash, rol, privacidad_aceptada) VALUES (?, ?, ?, ${aceptaPrivacidad ? 'NOW()' : 'NULL'})`,
    [email, passwordHash, rol]
  );
  return r.insertId;
}

/** Datos de sesión: usuario + nombre visible y perfil según su rol. */
export async function obtenerSesion(id) {
  return (await leerSesion(id))?.sesion ?? null;
}

/**
 * Como obtenerSesion, pero devuelve también `sesionesDesde` (segundos Unix): los tokens
 * emitidos antes de ese momento ya no son válidos. Es un dato interno que no se envía al navegador.
 */
export async function leerSesion(id) {
  const [fila] = await query(
    `SELECT u.id, u.email, u.rol, u.activo, u.fecha_registro AS fechaRegistro, u.sesiones_desde AS sesionesDesde,
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
  return { sesion, sesionesDesde: fila.sesionesDesde ?? 0 };
}

export async function obtenerHash(id) {
  const [fila] = await query('SELECT password_hash AS hash FROM USUARIOS WHERE id = ?', [id]);
  return fila?.hash ?? null;
}

export async function actualizarEmail(id, email) {
  await query('UPDATE USUARIOS SET email = ? WHERE id = ?', [email, id]);
}

/**
 * Cambia la contraseña y cierra todas las sesiones abiertas: los tokens emitidos
 * antes de este momento dejan de valer. Devuelve ese momento (segundos Unix).
 */
export async function actualizarPassword(id, passwordHash, conn = null) {
  const ahora = Math.floor(Date.now() / 1000);
  await (conn ?? { query }).query('UPDATE USUARIOS SET password_hash = ?, sesiones_desde = ? WHERE id = ?', [passwordHash, ahora, id]);
  return ahora;
}

/** Elimina la cuenta. Sus datos (perfil, ofertas, candidaturas...) se borran en cascada. */
export async function eliminar(id) {
  const r = await query('DELETE FROM USUARIOS WHERE id = ?', [id]);
  return r.affectedRows > 0;
}

export async function contarAdminsActivos() {
  const [fila] = await query("SELECT COUNT(*) AS n FROM USUARIOS WHERE rol = 'ADMIN' AND activo = TRUE");
  return fila.n;
}
