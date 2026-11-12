// Vuelve a crear la base de datos con schema.sql y carga los datos de seed.sql.
// Uso: npm run db:reset   (¡borra todos los datos!)
import { reiniciarBaseDatos } from './reiniciarBaseDatos.js';
import { pool } from '../src/config/db.js';

try {
  await reiniciarBaseDatos();
} catch (err) {
  console.error('Error al reiniciar la base de datos:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
