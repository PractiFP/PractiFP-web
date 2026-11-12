// Cambios en los datos de acceso: correo y contraseña.
import bcrypt from 'bcryptjs';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import { PASSWORD_MIN } from './authService.js';
import * as Usuario from '../models/usuarioModel.js';

async function comprobarPassword(usuarioId, password, campo) {
  const hash = await Usuario.obtenerHash(usuarioId);
  if (!(await bcrypt.compare(String(password ?? ''), hash))) {
    throw new HttpError(400, 'La contraseña actual no es correcta.', { [campo]: 'La contraseña actual no es correcta.' });
  }
}

export async function cambiarEmail(usuarioId, cuerpo = {}) {
  const email = limpiar(cuerpo.email)?.toLowerCase();
  validar({ email, password: cuerpo.password }, {
    email: [reglas.requerido(), reglas.email(), reglas.longitudMax(255)],
    password: [reglas.requerido('Confirma con tu contraseña actual.')],
  });
  await comprobarPassword(usuarioId, cuerpo.password, 'password');
  const otro = await Usuario.buscarPorEmail(email);
  if (otro && otro.id !== usuarioId) {
    throw new HttpError(409, 'Ese correo ya está en uso.', { email: 'Ese correo ya está en uso.' });
  }
  await Usuario.actualizarEmail(usuarioId, email);
  return Usuario.obtenerSesion(usuarioId);
}

export async function cambiarPassword(usuarioId, cuerpo = {}) {
  const { actual, nueva } = cuerpo;
  validar({ actual, nueva }, {
    actual: [reglas.requerido('Introduce tu contraseña actual.')],
    nueva: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`), reglas.longitudMax(72)],
  });
  await comprobarPassword(usuarioId, actual, 'actual');
  if (actual === nueva) {
    throw new HttpError(400, 'Revisa los datos del formulario.', { nueva: 'La nueva contraseña debe ser distinta de la actual.' });
  }
  await Usuario.actualizarPassword(usuarioId, await bcrypt.hash(nueva, 10));
}
