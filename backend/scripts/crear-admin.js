// Crea una cuenta de administrador (los administradores no se pueden registrar desde la web).
// Uso: npm run crear-admin -- correo@dominio.es "contraseña segura"
import bcrypt from 'bcryptjs';
import { pool, query } from '../src/config/db.js';

const [email, password] = process.argv.slice(2);
try {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Indica un correo válido.');
  if (!password || password.length < 12) throw new Error('La contraseña del administrador debe tener al menos 12 caracteres.');
  const [existe] = await query('SELECT id FROM USUARIOS WHERE email = ?', [email.toLowerCase()]);
  if (existe) throw new Error('Ya existe una cuenta con ese correo.');
  await query("INSERT INTO USUARIOS (email, password_hash, rol) VALUES (?, ?, 'ADMIN')", [email.toLowerCase(), await bcrypt.hash(password, 10)]);
  console.log(`Administrador ${email.toLowerCase()} creado.`);
} catch (err) {
  console.error(`No se ha creado el administrador: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
