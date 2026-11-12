// Instalación real: crea las tablas y los catálogos (ciclos y tecnologías) SIN datos de prueba.
// Uso: npm run db:esquema   (¡borra la base de datos si ya existía!)
import { reiniciarBaseDatos } from './reiniciarBaseDatos.js';
import { pool } from '../src/config/db.js';

try {
  await reiniciarBaseDatos({ conDatos: false });
  console.log('Crea ahora la cuenta de administrador con:  npm run crear-admin -- <correo> <contraseña>');
} catch (err) {
  console.error('Error al crear la base de datos:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
