import { Router } from 'express';
import { pool } from '../db.js';
import { auth, role } from '../middleware/auth.js';
import { HttpError, selOferta, fmtOferta } from '../util.js';

const r = Router();
r.use(auth, role('admin'));

r.get('/stats', async (req, res) => {
  const [[s]] = await pool.query(`
    SELECT (SELECT COUNT(*) FROM usuario) AS usuarios,
           (SELECT COUNT(*) FROM usuario WHERE rol = 'empresa') AS empresas,
           (SELECT COUNT(*) FROM oferta WHERE activa = 1) AS ofertas_activas,
           (SELECT COUNT(*) FROM candidatura) AS candidaturas`);
  const [porCiclo] = await pool.query('SELECT ciclo, COUNT(*) AS total FROM oferta GROUP BY ciclo');
  res.json({ ...s, porCiclo });
});

r.get('/usuarios', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, rol, bloqueado, created_at FROM usuario WHERE id <> ? ORDER BY id', [req.user.id]
  );
  res.json(rows.map((u) => ({ ...u, bloqueado: !!u.bloqueado })));
});

r.patch('/usuarios/:id/bloqueo', async (req, res) => {
  const [x] = await pool.query("UPDATE usuario SET bloqueado = NOT bloqueado WHERE id = ? AND rol <> 'admin'", [req.params.id]);
  if (!x.affectedRows) throw new HttpError(404, 'Usuario no encontrado');
  res.json({ ok: true });
});

// ON DELETE CASCADE borra su perfil, ofertas, candidaturas y favoritos
r.delete('/usuarios/:id', async (req, res) => {
  const [x] = await pool.query("DELETE FROM usuario WHERE id = ? AND rol <> 'admin'", [req.params.id]);
  if (!x.affectedRows) throw new HttpError(404, 'Usuario no encontrado');
  res.json({ ok: true });
});

r.get('/ofertas', async (req, res) => {
  const [rows] = await pool.query(`${selOferta()} ORDER BY o.id DESC`);
  res.json(rows.map((o) => fmtOferta(o)));
});

export default r;
