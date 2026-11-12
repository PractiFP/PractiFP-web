// Punto de entrada: comprueba la base de datos y arranca el servidor HTTP.
import app from './src/app.js';
import { env } from './src/config/env.js';
import { mkdirSync } from 'node:fs';
import { pool, comprobarConexion } from './src/config/db.js';
import { ALMACEN, DIR_CV, DIR_PROYECTOS } from './src/config/archivos.js';

// Carpetas de archivos subidos (no se publican; se sirven solo con control de acceso)
if (ALMACEN === 'disco') for (const dir of [DIR_CV, DIR_PROYECTOS]) mkdirSync(dir, { recursive: true });

const servidor = app.listen(env.port, async () => {
  console.log(`API de PractiFP escuchando en http://localhost:${env.port}/api`);
  try {
    const version = await comprobarConexion();
    console.log(`Conectado a MariaDB ${version} (base de datos "${env.db.database}")`);
  } catch (err) {
    console.error(`No se pudo conectar con MariaDB: ${err.message}`);
    console.error('Revisa las variables DB_* del archivo .env y que el servidor de MariaDB esté arrancado.');
  }
});

// Cierre ordenado (Ctrl+C o parada del proceso)
async function cerrar() {
  servidor.close();
  await pool.end().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
