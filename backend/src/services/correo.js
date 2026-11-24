// Envío de correos por SMTP (Brevo, Gmail, el servidor del centro...).
// Configuración en las variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM.
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const { correo } = env;

/** Correos "enviados" durante las pruebas automáticas (no se envía nada de verdad). */
export const enviadosEnPruebas = [];

/**
 * ¿Se pueden enviar correos? En desarrollo sí aunque no haya SMTP (se muestran en la consola).
 * En producción hacen falta el servidor SMTP, el remitente y la dirección pública de la web.
 */
export function disponible() {
  if (env.nodeEnv !== 'production') return true;
  return Boolean(correo.host && correo.remitente && env.frontendUrlDefinida);
}

let transporte = null;

export async function enviar({ para, asunto, texto, html }) {
  if (env.nodeEnv === 'test') {
    enviadosEnPruebas.push({ para, asunto, texto, html });
    return;
  }
  if (!correo.host) {
    console.info(`\n[correo de prueba: SMTP no configurado]\nPara: ${para}\nAsunto: ${asunto}\n\n${texto}\n`);
    return;
  }
  transporte ??= nodemailer.createTransport({
    host: correo.host,
    port: correo.port,
    secure: correo.port === 465, // 465: TLS directo; 587: STARTTLS
    requireTLS: correo.port !== 465 && correo.port !== 25,
    auth: correo.usuario ? { user: correo.usuario, pass: correo.password } : undefined,
    // Que un servidor de correo lento no deje la petición colgada
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  await transporte.sendMail({ from: correo.remitente || correo.usuario, to: para, subject: asunto, text: texto, html });
}

/** Escapa texto para insertarlo en el HTML del correo. */
export const escaparHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
