// Carga y valida las variables de entorno en un único sitio.
import 'dotenv/config';

const requeridas = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const faltan = requeridas.filter((k) => !process.env[k]);
if (faltan.length) {
  console.error(`Faltan variables de entorno: ${faltan.join(', ')}. Copia .env.example a .env y complétalo.`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'cambia_este_secreto') {
  console.error('JWT_SECRET es demasiado corto o es el valor de ejemplo. Genera uno con:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  // Número de proxies inversos delante del servidor (Nginx, etc.), para obtener la IP real del cliente
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  // En producción, el backend sirve también el frontend compilado (frontend/dist)
  servirFrontend: process.env.SERVIR_FRONTEND === 'true',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    // DB_SSL=true: conexión cifrada verificando el certificado del servidor (obligatorio en TiDB Cloud)
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
  },
  // Correo saliente (SMTP) para los enlaces de recuperación de contraseña.
  // Sin SMTP_HOST: en desarrollo el enlace se muestra en la consola; en producción la función se desactiva.
  correo: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    usuario: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    remitente: process.env.SMTP_FROM || '',
  },
  // true si FRONTEND_URL está definida (los enlaces de los correos deben apuntar a la web real)
  frontendUrlDefinida: Boolean(process.env.FRONTEND_URL),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
};
