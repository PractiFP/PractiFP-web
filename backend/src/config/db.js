// Pool de conexiones a MariaDB y funciones de ayuda para consultas parametrizadas.
import mariadb from 'mariadb';
import { env } from './env.js';

export const pool = mariadb.createPool({
  ...env.db,
  charset: 'utf8mb4',
  // Devuelve números de JavaScript en lugar de BigInt/strings
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  decimalAsNumber: true,
  // Las fechas DATE se devuelven como 'YYYY-MM-DD' para evitar desfases de zona horaria
  dateStrings: true,
  // Si MariaDB no responde, fallar en 5 s en lugar de dejar la petición colgada
  acquireTimeout: 5000,
  connectTimeout: 3000,
});

/**
 * Ejecuta una consulta parametrizada (los valores van en `params`, nunca concatenados).
 * @example query('SELECT * FROM OFERTAS WHERE id = ?', [id])
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Ejecuta varias operaciones dentro de una transacción.
 * @example await transaction(async (conn) => { await conn.query(...); })
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Comprueba que la base de datos responde. */
export async function comprobarConexion() {
  const [fila] = await query('SELECT VERSION() AS version');
  return fila.version;
}
