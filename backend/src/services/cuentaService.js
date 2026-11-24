// Datos de acceso de la cuenta (correo y contraseña) y derechos del RGPD:
// descargar todos los datos propios y eliminar la cuenta.
import bcrypt from 'bcryptjs';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import { PASSWORD_MIN, firmarToken } from './authService.js';
import * as almacen from './almacen.js';
import * as Usuario from '../models/usuarioModel.js';
import * as Exportacion from '../models/exportacionModel.js';

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

/**
 * Cambia la contraseña. Se cierran las sesiones abiertas en otros dispositivos
 * y se devuelve un token nuevo para seguir en este.
 */
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
  const sesion = await Usuario.obtenerSesion(usuarioId);
  return { token: firmarToken(sesion) };
}

/** Todos los datos del usuario en un objeto (se descarga como JSON). */
export async function exportarDatos(usuario) {
  const datos = {
    exportado: new Date().toISOString(),
    aviso: 'Datos de tu cuenta de PractiFP. El currículum y las imágenes de los proyectos se descargan desde la propia web.',
    cuenta: await Exportacion.cuenta(usuario.id),
  };
  if (usuario.rol === 'ALUMNO') Object.assign(datos, await Exportacion.alumno(usuario.alumnoId));
  if (usuario.rol === 'EMPRESA') Object.assign(datos, await Exportacion.empresa(usuario.empresaId));
  return datos;
}

/**
 * Elimina la cuenta y todos sus datos (derecho de supresión). Pide la contraseña para confirmar.
 * Una empresa pierde también sus ofertas, y con ellas las candidaturas recibidas.
 */
export async function eliminarCuenta(usuario, cuerpo = {}) {
  validar({ password: cuerpo.password }, { password: [reglas.requerido('Escribe tu contraseña para confirmar.')] });
  await comprobarPassword(usuario.id, cuerpo.password, 'password');
  if (usuario.rol === 'ADMIN' && (await Usuario.contarAdminsActivos()) <= 1) {
    throw new HttpError(409, 'Eres la única cuenta de administración. Crea otra antes de eliminar esta.');
  }

  const archivos = usuario.rol === 'ALUMNO' ? await Exportacion.archivosDeAlumno(usuario.alumnoId) : [];
  await Usuario.eliminar(usuario.id);
  // Los archivos se borran después: si fallara, la cuenta ya no existe y no quedan enlazados a nadie
  for (const nombre of archivos) {
    await almacen.borrar(nombre).catch((err) => console.error(`No se ha podido borrar el archivo ${nombre}:`, err.message));
  }
}
