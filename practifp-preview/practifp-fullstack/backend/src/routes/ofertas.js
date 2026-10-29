import { Router } from 'express';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import {
  CICLOS, MODALIDADES, HttpError, bad, tx, guardarTecnologias,
  selOferta, FLAGS, fmtOferta, techsAlumno,
} from '../util.js';

const r = Router();

function validar(b) {
  const titulo = (b.titulo || '').trim(), descripcion = (b.descripcion || '').trim(), localidad = (b.localidad || '').trim();
  if (!titulo || !descripcion || !localidad) throw bad('Título, descripción y localidad son obligatorios');
  if (!CICLOS.includes(b.ciclo) || !MODALIDADES.includes(b.modalidad)) throw bad('Ciclo o modalidad no válidos');
  return {
    titulo, descripcion, localidad, ciclo: b.ciclo, modalidad: b.modalidad,
    plazas: Math.min(50, Math.max(1, parseInt(b.plazas) || 1)),
    remunerada: b.remunerada ? 1 : 0,
  };
}

// Comprueba que la oferta existe y es de la empresa (o el usuario es admin si permitirAdmin)
async function comprobarDueno(req, permitirAdmin = false) {
  const [[o]] = await pool.query('SELECT id_empresa FROM oferta WHERE id = ?', [req.params.id]);
  if (!o) throw new HttpError(404, 'Oferta no encontrada');
  const esAdmin = permitirAdmin && req.user.rol === 'admin';
  if (!esAdmin && o.id_empresa !== req.user.id) throw new HttpError(403, 'Sin permisos');
}

// Buscador del alumno con filtros: ?q=&ciclo=&modalidad=&remunerada=1&tecnologia=
r.get('/', auth, role('alumno'), async (req, res) => {
  const { q, ciclo, modalidad, remunerada, tecnologia } = req.query;
  const where = ['o.activa = 1'], p = [req.user.id, req.user.id];
  if (CICLOS.includes(ciclo)) { where.push('o.ciclo = ?'); p.push(ciclo); }
  if (MODALIDADES.includes(modalidad)) { where.push('o.modalidad = ?'); p.push(modalidad); }
  if (remunerada === '1') where.push('o.remunerada = 1');
  if (tecnologia) {
    where.push(`EXISTS (SELECT 1 FROM oferta_tecnologia ot JOIN tecnologia t ON t.id = ot.id_tecnologia
                         WHERE ot.id_oferta = o.id AND t.nombre = ?)`);
    p.push(String(tecnologia));
  }
  if (q) {
    const k = `%${String(q).slice(0, 60)}%`;
    where.push(`(o.titulo LIKE ? OR u.nombre LIKE ? OR EXISTS (SELECT 1 FROM oferta_tecnologia ot
                  JOIN tecnologia t ON t.id = ot.id_tecnologia WHERE ot.id_oferta = o.id AND t.nombre LIKE ?))`);
    p.push(k, k, k);
  }
  const [rows] = await pool.query(
    `${selOferta(FLAGS)} WHERE ${where.join(' AND ')} ORDER BY o.fecha_publicacion DESC, o.id DESC`, p
  );
  const mine = await techsAlumno(req.user.id);
  res.json(rows.map((o) => fmtOferta(o, mine)));
});

// Ofertas de la empresa autenticada, con nº de candidatos
r.get('/mias', auth, role('empresa'), async (req, res) => {
  const [rows] = await pool.query(
    `${selOferta(', (SELECT COUNT(*) FROM candidatura c WHERE c.id_oferta = o.id) AS candidatos')}
      WHERE o.id_empresa = ? ORDER BY o.id DESC`, [req.user.id]
  );
  res.json(rows.map((o) => fmtOferta(o)));
});

r.get('/:id', auth, async (req, res) => {
  const [[o]] = await pool.query(`${selOferta()} WHERE o.id = ?`, [req.params.id]);
  if (!o || (!o.activa && req.user.rol !== 'admin' && o.id_empresa !== req.user.id))
    throw new HttpError(404, 'Oferta no encontrada');
  res.json(fmtOferta(o));
});

r.post('/', auth, role('empresa'), async (req, res) => {
  const o = validar(req.body);
  const id = await tx(async (c) => {
    const [x] = await c.query(
      `INSERT INTO oferta (id_empresa, titulo, descripcion, ciclo, localidad, remunerada, modalidad, plazas)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, o.titulo, o.descripcion, o.ciclo, o.localidad, o.remunerada, o.modalidad, o.plazas]
    );
    await guardarTecnologias(c, 'oferta_tecnologia', 'id_oferta', x.insertId, req.body.tecnologias);
    return x.insertId;
  });
  res.status(201).json({ id });
});

r.put('/:id', auth, role('empresa'), async (req, res) => {
  await comprobarDueno(req);
  const o = validar(req.body);
  await tx(async (c) => {
    await c.query(
      `UPDATE oferta SET titulo=?, descripcion=?, ciclo=?, localidad=?, remunerada=?, modalidad=?, plazas=? WHERE id=?`,
      [o.titulo, o.descripcion, o.ciclo, o.localidad, o.remunerada, o.modalidad, o.plazas, req.params.id]
    );
    await guardarTecnologias(c, 'oferta_tecnologia', 'id_oferta', req.params.id, req.body.tecnologias);
  });
  res.json({ ok: true });
});

// Pausar / reactivar
r.patch('/:id/activa', auth, role('empresa'), async (req, res) => {
  await comprobarDueno(req);
  await pool.query('UPDATE oferta SET activa = NOT activa WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// La empresa borra la suya; el admin puede borrar cualquiera (ofertas fraudulentas)
r.delete('/:id', auth, role('empresa', 'admin'), async (req, res) => {
  await comprobarDueno(req, true);
  await pool.query('DELETE FROM oferta WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// Candidatos de una oferta (solo su empresa)
r.get('/:id/candidaturas', auth, role('empresa'), async (req, res) => {
  await comprobarDueno(req);
  const [rows] = await pool.query(
    `SELECT c.id, c.estado, c.fecha, u.id AS id_alumno, u.nombre, u.email, a.ciclo, a.curso, a.centro, a.cv_nombre
       FROM candidatura c JOIN usuario u ON u.id = c.id_alumno JOIN alumno a ON a.id_usuario = u.id
      WHERE c.id_oferta = ? ORDER BY c.fecha DESC, c.id DESC`, [req.params.id]
  );
  const [[o]] = await pool.query(`${selOferta()} WHERE o.id = ?`, [req.params.id]);
  const oferta = fmtOferta(o);
  let techs = {};
  if (rows.length) {
    const [t] = await pool.query(
      `SELECT x.id_alumno, t.nombre FROM alumno_tecnologia x JOIN tecnologia t ON t.id = x.id_tecnologia
        WHERE x.id_alumno IN (?) ORDER BY t.nombre`, [rows.map((x) => x.id_alumno)]
    );
    t.forEach((x) => (techs[x.id_alumno] ||= []).push(x.nombre));
  }
  res.json({
    oferta,
    candidaturas: rows.map((c) => {
      const tecnologias = techs[c.id_alumno] || [];
      return { ...c, tecnologias, compatibilidad: fmtOferta(o, tecnologias).compatibilidad };
    }),
  });
});

export default r;
