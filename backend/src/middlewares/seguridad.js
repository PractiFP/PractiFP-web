// Cabeceras HTTP de seguridad (sin dependencias externas).
import { env } from '../config/env.js';

// Política para el frontend compilado cuando lo sirve este mismo servidor (modo producción)
const CSP_WEB = [
  "default-src 'self'",
  "script-src 'self'",
  // React aplica estilos en línea (atributo style); Google Fonts sirve la hoja de estilos de las fuentes
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  // Teselas del mapa, imágenes de proyectos y vistas previas locales (blob:)
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "connect-src 'self'",
  // El visor de currículums muestra el PDF descargado en un iframe con URL blob:
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function cabecerasSeguridad(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    // La API solo devuelve JSON o archivos: no necesita cargar nada
    'Content-Security-Policy': req.path.startsWith('/api') ? "default-src 'none'; frame-ancestors 'none'" : CSP_WEB,
  });
  if (env.nodeEnv === 'production') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}
