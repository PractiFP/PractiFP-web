// "¿Has olvidado tu contraseña?": envío del enlace por correo y cambio de contraseña con ese enlace.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { transaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import { PASSWORD_MIN } from './authService.js';
import * as correo from './correo.js';
import * as Usuario from '../models/usuarioModel.js';
import * as Recuperacion from '../models/recuperacionModel.js';

export const MINUTOS_VALIDEZ = 60;
// Para que nadie llene el buzón de otra persona: como mucho un correo cada 2 minutos por cuenta
const MINUTOS_ENTRE_CORREOS = 2;

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Envía el enlace de recuperación si existe una cuenta activa con ese correo.
 * La respuesta es siempre la misma, exista o no la cuenta, para no revelar qué correos están registrados.
 */
export async function solicitar(cuerpo = {}) {
  const email = limpiar(cuerpo.email)?.toLowerCase();
  validar({ email }, { email: [reglas.requerido('Introduce tu correo.'), reglas.email(), reglas.longitudMax(255)] });
  if (!correo.disponible()) {
    throw new HttpError(503, 'La recuperación de contraseña por correo no está disponible. Contacta con el administrador del sitio.');
  }

  const usuario = await Usuario.buscarPorEmail(email);
  if (!usuario || !usuario.activo) return;
  if (await Recuperacion.hayReciente(usuario.id, MINUTOS_ENTRE_CORREOS)) return;

  const token = crypto.randomBytes(32).toString('base64url');
  await Recuperacion.crear(usuario.id, hash(token), MINUTOS_VALIDEZ);

  // El código va después de "#": el navegador no lo envía a ningún servidor ni aparece en registros
  const enlace = `${env.frontendUrl}/restablecer-contrasena#${token}`;
  const texto = [
    'Hola:',
    '',
    'Alguien (seguramente tú) ha pedido cambiar la contraseña de tu cuenta de PractiFP.',
    `Para elegir una contraseña nueva, abre este enlace (caduca en ${MINUTOS_VALIDEZ} minutos y solo se puede usar una vez):`,
    '',
    enlace,
    '',
    'Si no lo has pedido tú, ignora este correo: tu contraseña no cambiará.',
    '',
    'PractiFP',
  ].join('\n');
  const html = `<p>Hola:</p>
<p>Alguien (seguramente tú) ha pedido cambiar la contraseña de tu cuenta de PractiFP.</p>
<p><a href="${correo.escaparHtml(enlace)}">Elegir una contraseña nueva</a></p>
<p>El enlace caduca en ${MINUTOS_VALIDEZ} minutos y solo se puede usar una vez.</p>
<p>Si no lo has pedido tú, ignora este correo: tu contraseña no cambiará.</p>
<p>PractiFP</p>`;

  try {
    await correo.enviar({ para: usuario.email, asunto: 'Cambia tu contraseña de PractiFP', texto, html });
  } catch (err) {
    // No se informa al usuario (revelaría que la cuenta existe); queda en el registro del servidor
    console.error('No se ha podido enviar el correo de recuperación:', err.message);
  }
}

/** Cambia la contraseña usando el código del enlace. Cierra todas las sesiones abiertas. */
export async function restablecer(cuerpo = {}) {
  const { token, password } = cuerpo;
  validar({ token, password }, {
    token: [(v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(v) ? null : 'El enlace no es válido o está incompleto. Pide uno nuevo.')],
    password: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`), reglas.longitudMax(72)],
  });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const usuarioId = await transaction(async (conn) => {
    const id = await Recuperacion.consumir(conn, hash(String(token)));
    if (id) await Usuario.actualizarPassword(id, passwordHash, conn);
    return id;
  });
  if (!usuarioId) throw new HttpError(400, 'El enlace no es válido o ha caducado. Pide uno nuevo.');

  const sesion = await Usuario.obtenerSesion(usuarioId);
  if (!sesion?.activo) throw new HttpError(403, 'Esta cuenta está desactivada. Contacta con el administrador.');
}
