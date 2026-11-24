import * as authService from '../services/authService.js';
import * as recuperacionService from '../services/recuperacionService.js';

// POST /api/auth/registro
export async function registro(req, res) {
  const resultado = await authService.registrar(req.body);
  await req.intentoValido?.();
  res.status(201).json({ data: resultado });
}

// POST /api/auth/login
export async function login(req, res) {
  const resultado = await authService.iniciarSesion(req.body);
  await req.intentoValido?.();
  res.json({ data: resultado });
}

// GET /api/auth/yo
export function yo(req, res) {
  res.json({ data: req.usuario });
}

// POST /api/auth/recuperar  { email }
export async function solicitarRecuperacion(req, res) {
  await recuperacionService.solicitar(req.body);
  res.json({ data: { mensaje: 'Si hay una cuenta con ese correo, te hemos enviado un enlace para cambiar la contraseña.' } });
}

// POST /api/auth/restablecer  { token, password }
export async function restablecerPassword(req, res) {
  await recuperacionService.restablecer(req.body);
  await req.intentoValido?.();
  res.json({ data: { actualizada: true } });
}
