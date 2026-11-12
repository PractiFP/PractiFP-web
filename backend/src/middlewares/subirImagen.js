// Subida de la imagen de un proyecto: JPG, PNG o WebP de 2 MB como máximo.
// El archivo se recibe en memoria y solo se guarda después de validarlo.
import multer from 'multer';
import { IMAGEN_TAMANO_MAX, IMAGEN_TIPOS } from '../config/archivos.js';
import { HttpError } from '../utils/HttpError.js';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGEN_TAMANO_MAX, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    if (!IMAGEN_TIPOS[file.mimetype]) return cb(new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.', { imagen: 'La imagen debe ser JPG, PNG o WebP.' }));
    cb(null, true);
  },
}).single('imagen');

export function subirImagen(req, res, next) {
  subida(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 2 MB.' : 'No se ha podido subir la imagen.';
      return next(new HttpError(400, mensaje, { imagen: mensaje }));
    }
    next(err);
  });
}
