import * as authService from '../services/authService.js';

// POST /api/auth/registro
export async function registro(req, res) {
  const resultado = await authService.registrar(req.body);
  res.status(201).json({ data: resultado });
}

// POST /api/auth/login
export async function login(req, res) {
  const resultado = await authService.iniciarSesion(req.body);
  res.json({ data: resultado });
}

// GET /api/auth/yo
export function yo(req, res) {
  res.json({ data: req.usuario });
}
