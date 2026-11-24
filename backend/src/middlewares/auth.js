// Autenticación (JWT) y autorización por rol.
import { HttpError } from '../utils/HttpError.js';
import { verificarToken } from '../services/authService.js';
import { leerSesion } from '../models/usuarioModel.js';

/** Exige un token válido. Deja el usuario actual en req.usuario. */
export async function requireAuth(req, res, next) {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Debes iniciar sesión.');

    let payload;
    try {
      payload = verificarToken(token);
    } catch (err) {
      throw new HttpError(401, err.name === 'TokenExpiredError' ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.' : 'Sesión no válida. Vuelve a iniciar sesión.');
    }

    // Se consulta la BD en cada petición para aplicar al momento desactivaciones o cambios de rol
    const leida = await leerSesion(Number(payload.sub));
    if (!leida) throw new HttpError(401, 'Sesión no válida. Vuelve a iniciar sesión.');
    // La contraseña se ha cambiado después de emitir este token: se cierran las demás sesiones
    if (payload.iat < leida.sesionesDesde) throw new HttpError(401, 'Tu contraseña ha cambiado. Vuelve a iniciar sesión.');
    const usuario = leida.sesion;
    if (!usuario.activo) throw new HttpError(403, 'Esta cuenta está desactivada. Contacta con el administrador.');

    req.usuario = usuario;
    next();
  } catch (err) {
    next(err);
  }
}

/** Exige que el usuario tenga uno de los roles indicados. Usar después de requireAuth. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.usuario) return next(new HttpError(401, 'Debes iniciar sesión.'));
  if (!roles.includes(req.usuario.rol)) return next(new HttpError(403, 'No tienes permiso para acceder a este recurso.'));
  next();
};

/**
 * Sesión opcional: si llega un token válido deja el usuario en req.usuario;
 * si no hay token o no es válido, continúa como visitante.
 */
export async function optionalAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return next();
  try {
    const payload = verificarToken(token);
    const leida = await leerSesion(Number(payload.sub));
    if (leida?.sesion.activo && payload.iat >= leida.sesionesDesde) req.usuario = leida.sesion;
  } catch {
    // token no válido: se trata como visitante
  }
  next();
}
