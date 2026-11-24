// Actualiza automáticamente una base de datos ya instalada con las tablas y columnas
// que se han añadido después (por ejemplo, la de producción en TiDB Cloud).
// Se ejecuta una sola vez por proceso, en la primera petición a la API.
// Solo AÑADE cosas que faltan: nunca borra ni modifica datos.
import { query } from './db.js';

const PASOS = [
  { tabla: 'USUARIOS', columna: 'privacidad_aceptada', sql: 'ALTER TABLE USUARIOS ADD COLUMN privacidad_aceptada DATETIME NULL' },
  { tabla: 'USUARIOS', columna: 'sesiones_desde', sql: 'ALTER TABLE USUARIOS ADD COLUMN sesiones_desde INT UNSIGNED NULL' },
  {
    tabla: 'RECUPERACIONES',
    sql: `CREATE TABLE RECUPERACIONES (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id  INT UNSIGNED NOT NULL,
      token_hash  CHAR(64)     NOT NULL,
      caduca      DATETIME     NOT NULL,
      fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_recuperaciones_token UNIQUE (token_hash),
      CONSTRAINT fk_recup_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
  },
  {
    tabla: 'INTENTOS',
    sql: `CREATE TABLE INTENTOS (
      clave  CHAR(64)     PRIMARY KEY,
      n      INT UNSIGNED NOT NULL,
      hasta  DATETIME     NOT NULL,
      INDEX ix_intentos_hasta (hasta)
    ) ENGINE=InnoDB`,
  },
];

export async function actualizarEsquema() {
  const tablas = new Set((await query(
    'SELECT UPPER(table_name) AS t FROM information_schema.tables WHERE table_schema = DATABASE()'
  )).map((f) => f.t));
  // Base de datos todavía sin instalar: no hay nada que actualizar
  if (!tablas.has('USUARIOS')) return;

  const columnas = new Set((await query(
    `SELECT CONCAT(UPPER(table_name), '.', LOWER(column_name)) AS c
       FROM information_schema.columns WHERE table_schema = DATABASE() AND UPPER(table_name) = 'USUARIOS'`
  )).map((f) => f.c));

  for (const paso of PASOS) {
    const falta = paso.columna ? !columnas.has(`${paso.tabla}.${paso.columna}`) : !tablas.has(paso.tabla);
    if (!falta) continue;
    try {
      await query(paso.sql);
      console.info(`Base de datos actualizada: ${paso.columna ? `columna ${paso.tabla}.${paso.columna}` : `tabla ${paso.tabla}`}.`);
    } catch (err) {
      // Otra copia del servidor lo ha creado a la vez
      if (!['ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR'].includes(err.code)) throw err;
    }
  }
}

let pendiente = null;

/** Middleware: la primera petición espera a que el esquema esté al día; las demás pasan directamente. */
export function esquemaAlDia(req, res, next) {
  pendiente ??= actualizarEsquema().catch((err) => {
    pendiente = null; // se reintentará en la siguiente petición
    throw err;
  });
  pendiente.then(() => next(), (err) => {
    console.error('No se ha podido actualizar la base de datos:', err.message);
    // Si la base de datos no responde, se deja seguir: cada ruta devolverá su propio error
    next();
  });
}
