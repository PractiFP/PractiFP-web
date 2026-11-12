// Dónde se guardan los archivos subidos (currículums e imágenes de proyectos).
// Ninguno se sirve de forma pública directamente: siempre pasan por la API.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * ALMACEN_ARCHIVOS:
 *  - "disco" (por defecto): carpetas en el servidor (desarrollo local y Docker).
 *  - "bd": dentro de la base de datos, tabla ARCHIVOS (plataformas sin disco permanente, como Vercel).
 */
export const ALMACEN = process.env.ALMACEN_ARCHIVOS === 'bd' ? 'bd' : 'disco';

// Se puede cambiar con UPLOADS_DIR (las pruebas automáticas usan una carpeta temporal)
export const DIR_UPLOADS = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(raiz, 'uploads');
export const DIR_CV = path.join(DIR_UPLOADS, 'cv');
export const DIR_PROYECTOS = path.join(DIR_UPLOADS, 'proyectos');

// 4 MB: Vercel no admite peticiones de más de 4,5 MB
export const CV_TAMANO_MAX = 4 * 1024 * 1024;
export const IMAGEN_TAMANO_MAX = 2 * 1024 * 1024; // 2 MB
export const IMAGEN_TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
