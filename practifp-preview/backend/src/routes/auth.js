import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { HttpError, bad, tx, usuarioCompleto } from '../util.js';

const r = Router();
const firmar = (u) => jwt.sign({ id: u.id, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });

r.post('/registro', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6 || !['alumno', 'empresa'].includes(rol))
    throw bad('Datos no válidos (la contraseña necesita al menos 6 caracteres)');
  const hash = await bcrypt.hash(password, 10);
  let id;
  try {
    id = await tx(async (c) => {
      const [x] = await c.query('INSERT INTO usuario (nombre, email, password_hash, rol) VALUES (?,?,?,?)', [
        nombre.trim(), email.trim().toLowerCase(), hash, rol,
      ]);
      await c.query(`INSERT INTO ${rol} (id_usuario) VALUES (?)`, [x.insertId]); // rol validado arriba
      return x.insertId;
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ese email ya está registrado');
    throw e;
  }
  const usuario = await usuarioCompleto(id);
  res.status(201).json({ token: firmar(usuario), usuario });
});

r.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const [[u]] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password_hash)))
    throw new HttpError(401, 'Email o contraseña incorrectos');
  if (u.bloqueado) throw new HttpError(403, 'Esta cuenta está bloqueada');
  const usuario = await usuarioCompleto(u.id);
  res.json({ token: firmar(usuario), usuario });
});

export default r;
