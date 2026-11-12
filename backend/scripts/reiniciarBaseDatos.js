// Recrea la base de datos (schema.sql + seed.sql) y prepara los archivos de ejemplo.
// La usan "npm run db:reset", "npm run db:esquema" y las pruebas automáticas.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mariadb from 'mariadb';
import { env } from '../src/config/env.js';
import { ALMACEN } from '../src/config/archivos.js';
import { query } from '../src/config/db.js';
import * as almacen from '../src/services/almacen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const archivo = (n) => readFile(path.join(dir, '../../database', n), 'utf8');

/**
 * @param {object} opciones
 * @param {boolean} opciones.conDatos  true: carga también seed.sql (datos de prueba); false: solo las tablas y los catálogos
 */
export async function reiniciarBaseDatos({ silencioso = false, conDatos = true } = {}) {
  const log = (...a) => { if (!silencioso) console.log(...a); };
  const { host, port, user, password, ssl } = env.db;
  const conn = await mariadb.createConnection({ host, port, user, password, ssl, multipleStatements: true });
  try {
    // TiDB (MySQL compatible) acepta las restricciones CHECK pero no las aplica salvo que se active esta opción
    const [{ version }] = await conn.query('SELECT VERSION() AS version');
    if (version.includes('TiDB')) {
      try {
        await conn.query('SET GLOBAL tidb_enable_check_constraint = ON');
        log('TiDB: restricciones CHECK activadas.');
      } catch {
        log('Aviso: no se han podido activar las restricciones CHECK en TiDB; la aplicación valida igualmente los datos.');
      }
    }

    // schema.sql crea la base "practifp"; si DB_NAME es otro nombre, se ajusta aquí
    const schema = (await archivo('schema.sql')).replaceAll(/\bpractifp\b/g, env.db.database);
    const seed = (await archivo('seed.sql')).replaceAll(/USE practifp;/g, `USE ${env.db.database};`);
    await conn.query(schema);
    log(`Esquema creado en "${env.db.database}".`);
    if (conDatos) {
      await conn.query(seed);
      log('Datos de prueba cargados. Contraseña de todas las cuentas: practifp123');
    } else {
      // Solo los catálogos (ciclos y tecnologías) del seed, sin usuarios, empresas ni ofertas
      const catalogos = seed.match(/INSERT INTO CICLOS[\s\S]*?;\s*\n|INSERT INTO TECNOLOGIAS[\s\S]*?;\s*\n/g).join('\n');
      await conn.query(`USE ${env.db.database};\n${catalogos}`);
      log('Catálogos de ciclos y tecnologías cargados (sin datos de prueba).');
    }
  } finally {
    await conn.end();
  }

  // Archivos: se vacían las carpetas (modo disco; en modo bd la tabla ARCHIVOS ya se ha recreado)
  // y se guarda el currículum de ejemplo de los alumnos que lo tienen en el seed
  await almacen.vaciarDisco();
  const pdf = await readFile(path.join(dir, '../../database/archivos/cv_ejemplo.pdf'));
  const filas = await query('SELECT cv_ruta AS nombre FROM ALUMNOS WHERE cv_ruta IS NOT NULL');
  for (const { nombre } of filas) await almacen.guardar(nombre, pdf);
  if (filas.length) log(`${filas.length} currículums de ejemplo guardados (${ALMACEN === 'bd' ? 'en la base de datos' : 'en la carpeta de archivos'}).`);
}

/** ¿Existe ya la base de datos con sus tablas? (conexión sin elegir base de datos, por si aún no existe) */
export async function estaInstalada() {
  const { host, port, user, password, ssl } = env.db;
  const conn = await mariadb.createConnection({ host, port, user, password, ssl });
  try {
    const [{ n }] = await conn.query(
      "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'USUARIOS'",
      [env.db.database]
    );
    return Number(n) > 0;
  } finally {
    await conn.end();
  }
}
