import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { HttpError, bad, tx, guardarTecnologias } from '../util.js';

const r = Router();
const UP = path.resolve('uploads/proyectos');
fs.mkdirSync(UP, { recursive: true });

const up = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, f, cb) => cb(null, `${req.params.id}-${Date.now()}${path.extname(f.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, f, cb) => (/\.(png|jpe?g|webp|gif)$/i.test(f.originalname) ? cb(null, true) : cb(bad('Solo se admiten imágenes (PNG, JPG, WEBP, GIF)'))),
});

const selProyecto = `
  SELECT p.id, p.id_alumno, p.titulo, p.descripcion, p.url_github, p.url_demo, p.imagen_ruta, p.fecha,
         (SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ',')
            FROM proyecto_tecnologia pt JOIN tecnologia t ON t.id = pt.id_tecnologia
           WHERE pt.id_proyecto = p.id) AS techs
    FROM proyecto p`;

const fmt = (p) => ({ ...p, techs: p.techs ? p.techs.split(',') : [], imagen: p.imagen_ruta ? `/uploads/proyectos/${p.imagen_ruta}` : null, imagen_ruta: undefined });

function validar(b) {
  const titulo = (b.titulo || '').trim(), descripcion = (b.descripcion || '').trim();
  if (!titulo || !descripcion) throw bad('Título y descripción son obligatorios');
  const url = (v) => { const s = (v || '').trim(); if (s && !/^https?:\/\//i.test(s)) throw bad('Los enlaces deben empezar por http:// o https://'); return s; };
  return { titulo, descripcion, url_github: url(b.url_github), url_demo: url(b.url_demo) };
}

// Portfolio del propio alumno
r.get('/', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(`${selProyecto} WHERE p.id_alumno = ? ORDER BY p.fecha DESC, p.id DESC`, [req.user.id]);
  res.json(rows.map(fmt));
});

// Portfolio de un alumno concreto: visible para él mismo, para empresas (con o sin candidatura, sirve para decidir) y para admin
r.get('/alumno/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!(req.user.rol === 'admin' || req.user.rol === 'empresa' || req.user.id === id)) throw new HttpError(403, 'Sin permisos');
  const [rows] = await pool.query(`${selProyecto} WHERE p.id_alumno = ? ORDER BY p.fecha DESC, p.id DESC`, [id]);
  res.json(rows.map(fmt));
});

r.post('/', auth, role('alumno'), async (req, res) => {
  const p = validar(req.body);
  const id = await tx(async (c) => {
    const [x] = await c.query(
      'INSERT INTO proyecto (id_alumno, titulo, descripcion, url_github, url_demo) VALUES (?,?,?,?,?)',
      [req.user.id, p.titulo, p.descripcion, p.url_github, p.url_demo]
    );
    await guardarTecnologias(c, 'proyecto_tecnologia', 'id_proyecto', x.insertId, req.body.tecnologias);
    return x.insertId;
  });
  res.status(201).json({ id });
});

async function comprobarDueno(req) {
  const [[p]] = await pool.query('SELECT id_alumno FROM proyecto WHERE id = ?', [req.params.id]);
  if (!p) throw new HttpError(404, 'Proyecto no encontrado');
  if (p.id_alumno !== req.user.id) throw new HttpError(403, 'Sin permisos');
}

r.put('/:id', auth, role('alumno'), async (req, res) => {
  await comprobarDueno(req);
  const p = validar(req.body);
  await tx(async (c) => {
    await c.query('UPDATE proyecto SET titulo=?, descripcion=?, url_github=?, url_demo=? WHERE id=?', [
      p.titulo, p.descripcion, p.url_github, p.url_demo, req.params.id,
    ]);
    await guardarTecnologias(c, 'proyecto_tecnologia', 'id_proyecto', req.params.id, req.body.tecnologias);
  });
  res.json({ ok: true });
});

r.delete('/:id', auth, role('alumno'), async (req, res) => {
  await comprobarDueno(req);
  const [[p]] = await pool.query('SELECT imagen_ruta FROM proyecto WHERE id = ?', [req.params.id]);
  if (p?.imagen_ruta) fs.unlink(path.join(UP, p.imagen_ruta), () => {});
  await pool.query('DELETE FROM proyecto WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

r.post('/:id/imagen', auth, role('alumno'), async (req, res, next) => {
  await comprobarDueno(req);
  next();
}, up.single('imagen'), async (req, res) => {
  if (!req.file) throw bad('Falta la imagen');
  const [[p]] = await pool.query('SELECT imagen_ruta FROM proyecto WHERE id = ?', [req.params.id]);
  if (p?.imagen_ruta) fs.unlink(path.join(UP, p.imagen_ruta), () => {});
  await pool.query('UPDATE proyecto SET imagen_ruta = ? WHERE id = ?', [req.file.filename, req.params.id]);
  res.json({ imagen: `/uploads/proyectos/${req.file.filename}` });
});

export default r;
