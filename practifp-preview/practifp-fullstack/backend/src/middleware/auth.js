import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

// Comprueba el token y que el usuario siga existiendo y no esté bloqueado
export async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado' });
  let payload;
  try {
    payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Sesión no válida' });
  }
  const [[u]] = await pool.query('SELECT id, rol, bloqueado FROM usuario WHERE id = ?', [payload.id]);
  if (!u || u.bloqueado) return res.status(401).json({ error: 'Cuenta no disponible' });
  req.user = { id: u.id, rol: u.rol };
  next();
}

// role('empresa', 'admin') -> solo esos roles
export const role = (...roles) => (req, res, next) =>
  roles.includes(req.user.rol) ? next() : res.status(403).json({ error: 'Sin permisos' });
