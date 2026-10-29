// Datos de ejemplo:  npm run seed   (solo si la base de datos está vacía)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { tx, guardarTecnologias } from './util.js';

const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM usuario');
if (n > 0) {
  console.log('La base de datos ya tiene datos; no se hace nada.');
  process.exit(0);
}

const usuario = async (c, nombre, email, pass, rol) => {
  const [x] = await c.query('INSERT INTO usuario (nombre, email, password_hash, rol) VALUES (?,?,?,?)', [
    nombre, email, await bcrypt.hash(pass, 10), rol,
  ]);
  return x.insertId;
};

await tx(async (c) => {
  await usuario(c, 'Administración', 'admin@practifp.es', 'admin123', 'admin');

  const al = await usuario(c, 'Alumno Demo', 'alumno@demo.es', 'alumno123', 'alumno');
  await c.query('INSERT INTO alumno (id_usuario, ciclo, curso, centro) VALUES (?,?,?,?)', [al, 'DAM', '2º', 'IES Demo, Sevilla']);
  await guardarTecnologias(c, 'alumno_tecnologia', 'id_alumno', al, ['Java', 'SQL', 'Git', 'Spring']);

  const empresa = async (nombre, email, desc, ciclos) => {
    const id = await usuario(c, nombre, email, 'empresa123', 'empresa');
    await c.query('INSERT INTO empresa (id_usuario, descripcion, localidad) VALUES (?,?,?)', [id, desc, 'Sevilla']);
    for (const ci of ciclos) await c.query('INSERT INTO empresa_ciclo (id_empresa, ciclo) VALUES (?,?)', [id, ci]);
    return id;
  };
  const oferta = async (emp, titulo, ciclo, rem, mod, plazas, techs) => {
    const [x] = await c.query(
      `INSERT INTO oferta (id_empresa, titulo, descripcion, ciclo, localidad, remunerada, modalidad, plazas)
       VALUES (?,?,?,?,?,?,?,?)`,
      [emp, titulo, 'Prácticas formativas con tutor en la empresa. Incorporación inmediata.', ciclo, 'Sevilla', rem, mod, plazas]
    );
    await guardarTecnologias(c, 'oferta_tecnologia', 'id_oferta', x.insertId, techs);
  };

  const a = await empresa('TechSevilla', 'empresa@techsevilla.es', 'Consultora de software en Sevilla.', ['DAM', 'DAW']);
  const b = await empresa('Giralda Apps', 'hola@giraldaapps.es', 'Apps móviles para clientes de toda Andalucía.', ['DAM']);
  const s = await empresa('RedSur', 'info@redsur.es', 'Infraestructura y sistemas.', ['ASIR']);

  await oferta(a, 'Desarrollador Java Junior', 'DAM', 1, 'Híbrida', 2, ['Java', 'Spring', 'SQL', 'Git']);
  await oferta(a, 'Prácticas backend', 'DAM', 0, 'Presencial', 1, ['Java', 'MySQL', 'Docker']);
  await oferta(b, 'Desarrollo Android', 'DAM', 1, 'Remota', 1, ['Kotlin', 'Android', 'Git']);
  await oferta(a, 'Frontend React', 'DAW', 1, 'Híbrida', 2, ['JavaScript', 'React', 'Git']);
  await oferta(a, 'Full stack PHP', 'DAW', 0, 'Presencial', 1, ['PHP', 'SQL', 'Git']);
  await oferta(s, 'Soporte de sistemas', 'ASIR', 1, 'Presencial', 2, ['Linux', 'Redes', 'Bash']);
  await oferta(s, 'Administración cloud', 'ASIR', 1, 'Remota', 1, ['AWS', 'Linux', 'Docker']);
});

console.log('Listo. Cuentas: admin@practifp.es / admin123, alumno@demo.es / alumno123, empresa@techsevilla.es / empresa123');
await pool.end();
