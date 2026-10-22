import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { CICLOS, HttpError, bad, tx, guardarTecnologias, usuarioCompleto } from '../util.js';

const r = Router();
const UP = path.resolve('uploads');

const up = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, f, cb) => cb(null, `${req.user.id}-${Date.now()}${path.extname(f.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, f, cb) => (/\.(pdf|docx?)$/i.test(f.originalname) ? cb(null, true) : cb(bad('Solo se admiten PDF o Word'))),
});

r.get('/', auth, async (req, res) => res.json(await usuarioCompleto(req.user.id)));

r.put('/', auth, role('alumno', 'empresa'), async (req, res) => {
  const b = req.body, id = req.user.id;
  if (!b.nombre?.trim()) throw bad('El nombre es obligatorio');
  await tx(async (c) => {
    await c.query('UPDATE usuario SET nombre = ? WHERE id = ?', [b.nombre.trim(), id]);
    if (req.user.rol === 'alumno') {
      if (!CICLOS.includes(b.ciclo)) throw bad('Ciclo no válido');
      await c.query('UPDATE alumno SET ciclo = ?, curso = ?, centro = ? WHERE id_usuario = ?', [
        b.ciclo, ['1º', '2º'].includes(b.curso) ? b.curso : '2º', (b.centro || '').trim(), id,
      ]);
      await guardarTecnologias(c, 'alumno_tecnologia', 'id_alumno', id, b.tecnologias);
    } else {
      const web = (b.web || '').trim();
      if (web && !/^https?:\/\//i.test(web)) throw bad('La web debe empezar por http:// o https://');
      let lat = b.latitud === '' || b.latitud == null ? null : Number(b.latitud);
      let lng = b.longitud === '' || b.longitud == null ? null : Number(b.longitud);
      if ((lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) ||
          (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)))
        throw bad('Coordenadas no válidas');
      await c.query('UPDATE empresa SET descripcion = ?, web = ?, localidad = ?, latitud = ?, longitud = ? WHERE id_usuario = ?', [
        (b.descripcion || '').trim(), web, (b.localidad || '').trim() || 'Sevilla', lat, lng, id,
      ]);
      await c.query('DELETE FROM empresa_ciclo WHERE id_empresa = ?', [id]);
      for (const ci of (b.ciclos || []).filter((x) => CICLOS.includes(x)))
        await c.query('INSERT IGNORE INTO empresa_ciclo (id_empresa, ciclo) VALUES (?,?)', [id, ci]);
    }
  });
  res.json(await usuarioCompleto(id));
});

// Subir CV (multipart/form-data, campo "cv")
r.post('/cv', auth, role('alumno'), up.single('cv'), async (req, res) => {
  if (!req.file) throw bad('Falta el archivo');
  const [[a]] = await pool.query('SELECT cv_ruta FROM alumno WHERE id_usuario = ?', [req.user.id]);
  if (a?.cv_ruta) fs.unlink(path.join(UP, a.cv_ruta), () => {});
  await pool.query('UPDATE alumno SET cv_ruta = ?, cv_nombre = ? WHERE id_usuario = ?', [
    req.file.filename, req.file.originalname, req.user.id,
  ]);
  res.json(await usuarioCompleto(req.user.id));
});

// Descargar CV: el propio alumno, un admin, o una empresa a la que el alumno se haya inscrito
r.get('/cv/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  let ok = req.user.rol === 'admin' || req.user.id === id;
  if (!ok && req.user.rol === 'empresa') {
    const [x] = await pool.query(
      'SELECT 1 FROM candidatura c JOIN oferta o ON o.id = c.id_oferta WHERE c.id_alumno = ? AND o.id_empresa = ? LIMIT 1',
      [id, req.user.id]
    );
    ok = x.length > 0;
  }
  if (!ok) throw new HttpError(403, 'Sin permisos');
  const [[a]] = await pool.query('SELECT cv_ruta, cv_nombre FROM alumno WHERE id_usuario = ?', [id]);
  if (!a?.cv_ruta) throw new HttpError(404, 'Este alumno no ha subido CV');
  res.download(path.join(UP, a.cv_ruta), a.cv_nombre);
});

export default r;
