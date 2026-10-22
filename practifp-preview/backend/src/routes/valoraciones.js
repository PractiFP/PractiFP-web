import { Router } from 'express';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { HttpError, bad } from '../util.js';

const r = Router();
const campo = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > 5) throw bad('Las puntuaciones deben ser un número entero de 1 a 5'); return n; };

// Reseñas aprobadas y públicas de una empresa (visibles para cualquier alumno autenticado)
r.get('/empresa/:id', auth, role('alumno'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT v.id, v.ambiente, v.formacion, v.flexibilidad, v.acompanamiento, v.comentario, v.fecha, u.ciclo
       FROM valoracion v JOIN alumno u ON u.id_usuario = v.id_alumno
      WHERE v.id_empresa = ? AND v.estado = 'Aprobada' ORDER BY v.fecha DESC`, [req.params.id]
  );
  res.json(rows);
});

// El propio alumno: ¿puede valorar esta empresa? (necesita una candidatura Aceptada ahí) y su valoración si ya existe
r.get('/empresa/:id/estado', auth, role('alumno'), async (req, res) => {
  const [[elegible]] = await pool.query(
    `SELECT 1 FROM candidatura c JOIN oferta o ON o.id = c.id_oferta
      WHERE c.id_alumno = ? AND o.id_empresa = ? AND c.estado = 'Aceptada' LIMIT 1`,
    [req.user.id, req.params.id]
  );
  const [[mia]] = await pool.query('SELECT * FROM valoracion WHERE id_alumno = ? AND id_empresa = ?', [req.user.id, req.params.id]);
  res.json({ puedeValorar: !!elegible, miValoracion: mia || null });
});

r.post('/', auth, role('alumno'), async (req, res) => {
  const idEmpresa = Number(req.body.id_empresa);
  const [[elegible]] = await pool.query(
    `SELECT 1 FROM candidatura c JOIN oferta o ON o.id = c.id_oferta
      WHERE c.id_alumno = ? AND o.id_empresa = ? AND c.estado = 'Aceptada' LIMIT 1`,
    [req.user.id, idEmpresa]
  );
  if (!elegible) throw new HttpError(403, 'Solo puedes valorar empresas donde hayas sido aceptado en unas prácticas');
  const v = {
    ambiente: campo(req.body.ambiente), formacion: campo(req.body.formacion),
    flexibilidad: campo(req.body.flexibilidad), acompanamiento: campo(req.body.acompanamiento),
    comentario: (req.body.comentario || '').trim().slice(0, 600),
  };
  try {
    await pool.query(
      `INSERT INTO valoracion (id_alumno, id_empresa, ambiente, formacion, flexibilidad, acompanamiento, comentario)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.id, idEmpresa, v.ambiente, v.formacion, v.flexibilidad, v.acompanamiento, v.comentario]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya has valorado a esta empresa');
    throw e;
  }
  res.status(201).json({ ok: true });
});

export default r;
