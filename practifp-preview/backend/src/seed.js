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

  const empresa = async (nombre, email, desc, ciclos, lat, lng) => {
    const id = await usuario(c, nombre, email, 'empresa123', 'empresa');
    await c.query('INSERT INTO empresa (id_usuario, descripcion, localidad, latitud, longitud) VALUES (?,?,?,?,?)', [id, desc, 'Sevilla', lat, lng]);
    for (const ci of ciclos) await c.query('INSERT INTO empresa_ciclo (id_empresa, ciclo) VALUES (?,?)', [id, ci]);
    return id;
  };
  const oferta = async (emp, titulo, ciclo, rem, mod, plazas, techs, fases, duracion, cerrado = false) => {
    const [x] = await c.query(
      `INSERT INTO oferta (id_empresa, titulo, descripcion, ciclo, localidad, remunerada, modalidad, plazas, fases_seleccion, duracion_proceso, proceso_cerrado)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [emp, titulo, 'Prácticas formativas con tutor en la empresa. Incorporación inmediata.', ciclo, 'Sevilla', rem, mod, plazas, fases, duracion, cerrado ? 1 : 0]
    );
    await guardarTecnologias(c, 'oferta_tecnologia', 'id_oferta', x.insertId, techs);
    return x.insertId;
  };

  // Coordenadas reales de zonas de Sevilla, para el mapa
  const a = await empresa('TechSevilla', 'empresa@techsevilla.es', 'Consultora de software en Sevilla.', ['DAM', 'DAW'], 37.3886, -5.9823); // Cartuja
  const b = await empresa('Giralda Apps', 'hola@giraldaapps.es', 'Apps móviles para clientes de toda Andalucía.', ['DAM'], 37.3858, -5.9931); // Centro
  const s = await empresa('RedSur', 'info@redsur.es', 'Infraestructura y sistemas.', ['ASIR'], 37.3772, -5.9869); // Triana

  const o1 = await oferta(a, 'Desarrollador Java Junior', 'DAM', 1, 'Híbrida', 2, ['Java', 'Spring', 'SQL', 'Git'],
    'CV → Prueba técnica → Entrevista', '2 semanas');
  await oferta(a, 'Prácticas backend', 'DAM', 0, 'Presencial', 1, ['Java', 'MySQL', 'Docker'],
    'CV → Entrevista', '1 semana');
  await oferta(b, 'Desarrollo Android', 'DAM', 1, 'Remota', 1, ['Kotlin', 'Android', 'Git'],
    'CV → Entrevista técnica', '10 días', true); // proceso ya cerrado, de ejemplo
  await oferta(a, 'Frontend React', 'DAW', 1, 'Híbrida', 2, ['JavaScript', 'React', 'Git'],
    'CV → Prueba técnica → Entrevista final', '3 semanas');
  await oferta(a, 'Full stack PHP', 'DAW', 0, 'Presencial', 1, ['PHP', 'SQL', 'Git'], '', '');
  await oferta(s, 'Soporte de sistemas', 'ASIR', 1, 'Presencial', 2, ['Linux', 'Redes', 'Bash'],
    'CV → Entrevista con el equipo', '1 semana');
  await oferta(s, 'Administración cloud', 'ASIR', 1, 'Remota', 1, ['AWS', 'Linux', 'Docker'], '', '');

  // Un proyecto de portfolio para el alumno demo
  const [pr] = await c.query(
    'INSERT INTO proyecto (id_alumno, titulo, descripcion, url_github, url_demo) VALUES (?,?,?,?,?)',
    [al, 'Gestor de tareas en Spring Boot', 'API REST con autenticación JWT y frontend en React para gestionar tareas de clase.', 'https://github.com/ejemplo/gestor-tareas', '']
  );
  await guardarTecnologias(c, 'proyecto_tecnologia', 'id_proyecto', pr.insertId, ['Java', 'Spring', 'React', 'MySQL']);

  // Candidatura aceptada en TechSevilla, para poder demostrar la valoración de empresas
  const [cand] = await c.query('INSERT INTO candidatura (id_alumno, id_oferta, estado) VALUES (?,?,?)', [al, o1, 'Aceptada']);
  await c.query(
    `INSERT INTO valoracion (id_alumno, id_empresa, ambiente, formacion, flexibilidad, acompanamiento, comentario, estado)
     VALUES (?,?,?,?,?,?,?,?)`,
    [al, a, 5, 4, 5, 4, 'Muy buen ambiente y el tutor siempre estuvo disponible para resolver dudas.', 'Aprobada']
  );
});

console.log('Listo. Cuentas: admin@practifp.es / admin123, alumno@demo.es / alumno123, empresa@techsevilla.es / empresa123');
await pool.end();
