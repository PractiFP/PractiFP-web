import { Router } from 'express';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { ESTADOS, HttpError, bad, selOferta, FLAGS, fmtOferta, techsAlumno } from '../util.js';

const r = Router();

// ---- Candidaturas ----
r.get('/candidaturas', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.estado, c.fecha, o.id AS id_oferta, o.titulo, u.nombre AS empresa
       FROM candidatura c JOIN oferta o ON o.id = c.id_oferta JOIN usuario u ON u.id = o.id_empresa
      WHERE c.id_alumno = ? ORDER BY c.fecha DESC, c.id DESC`, [req.user.id]
  );
  res.json(rows);
});

r.post('/candidaturas', auth, role('alumno'), async (req, res) => {
  const idOferta = Number(req.body.id_oferta);
  const [[o]] = await pool.query('SELECT activa, proceso_cerrado FROM oferta WHERE id = ?', [idOferta]);
  if (!o || !o.activa) throw new HttpError(404, 'Esta oferta ya no está disponible');
  if (o.proceso_cerrado) throw new HttpError(409, 'Esta empresa ha cerrado el proceso de selección');
  try {
    await pool.query('INSERT INTO candidatura (id_alumno, id_oferta) VALUES (?,?)', [req.user.id, idOferta]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya te has inscrito a esta oferta');
    throw e;
  }
  res.status(201).json({ ok: true });
});

// El alumno retira su candidatura
r.delete('/candidaturas/:id', auth, role('alumno'), async (req, res) => {
  const [x] = await pool.query('DELETE FROM candidatura WHERE id = ? AND id_alumno = ?', [req.params.id, req.user.id]);
  if (!x.affectedRows) throw new HttpError(404, 'Candidatura no encontrada');
  res.json({ ok: true });
});

// La empresa cambia el estado (solo de candidaturas a sus ofertas)
r.patch('/candidaturas/:id', auth, role('empresa'), async (req, res) => {
  if (!ESTADOS.includes(req.body.estado)) throw bad('Estado no válido');
  const [x] = await pool.query(
    `UPDATE candidatura c JOIN oferta o ON o.id = c.id_oferta SET c.estado = ? WHERE c.id = ? AND o.id_empresa = ?`,
    [req.body.estado, req.params.id, req.user.id]
  );
  if (!x.affectedRows) throw new HttpError(404, 'Candidatura no encontrada');
  res.json({ ok: true });
});

// ---- Favoritos ----
r.get('/favoritos', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(
    `${selOferta(FLAGS)} JOIN favorito fv ON fv.id_oferta = o.id AND fv.id_alumno = ?
      WHERE o.activa = 1 ORDER BY o.id DESC`, [req.user.id, req.user.id, req.user.id]
  );
  const mine = await techsAlumno(req.user.id);
  res.json(rows.map((o) => fmtOferta(o, mine)));
});

r.put('/favoritos/:id', auth, role('alumno'), async (req, res) => {
  await pool.query('INSERT IGNORE INTO favorito (id_alumno, id_oferta) VALUES (?,?)', [req.user.id, req.params.id]);
  res.json({ ok: true });
});

r.delete('/favoritos/:id', auth, role('alumno'), async (req, res) => {
  await pool.query('DELETE FROM favorito WHERE id_alumno = ? AND id_oferta = ?', [req.user.id, req.params.id]);
  res.json({ ok: true });
});

// ---- Empresas que aceptan alumnos del ciclo del alumno (haya o no oferta) ----
r.get('/empresas-abiertas', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, e.descripcion, e.web, e.localidad, e.latitud, e.longitud,
            (SELECT COUNT(*) FROM oferta o WHERE o.id_empresa = u.id AND o.activa = 1) AS ofertas_activas,
            (SELECT COUNT(*) FROM valoracion v WHERE v.id_empresa = u.id AND v.estado = 'Aprobada') AS valoraciones,
            (SELECT ROUND(AVG((v.ambiente + v.formacion + v.flexibilidad + v.acompanamiento) / 4), 1)
               FROM valoracion v WHERE v.id_empresa = u.id AND v.estado = 'Aprobada') AS valoracion_media
       FROM usuario u
       JOIN empresa e ON e.id_usuario = u.id
       JOIN empresa_ciclo ec ON ec.id_empresa = u.id
       JOIN alumno a ON a.id_usuario = ? AND a.ciclo = ec.ciclo
      WHERE u.bloqueado = 0 ORDER BY u.nombre`, [req.user.id]
  );
  res.json(rows.map((r) => ({ ...r, valoracion_media: r.valoracion_media ? Number(r.valoracion_media) : null })));
});

// ---- Mapa: todas las empresas con ubicación conocida que aceptan alumnos activos de cualquier ciclo con oferta abierta ----
r.get('/empresas-mapa', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, e.descripcion, e.web, e.localidad, e.latitud, e.longitud,
            (SELECT COUNT(*) FROM oferta o WHERE o.id_empresa = u.id AND o.activa = 1) AS ofertas_activas
       FROM usuario u JOIN empresa e ON e.id_usuario = u.id
      WHERE u.bloqueado = 0 AND e.latitud IS NOT NULL AND e.longitud IS NOT NULL
      ORDER BY u.nombre`
  );
  res.json(rows);
});

export default r;
