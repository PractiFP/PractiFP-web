// Subida del currículum con Multer: solo PDF y como máximo 4 MB.
// El archivo se recibe en memoria y solo se guarda después de validarlo.
import multer from 'multer';
import { CV_TAMANO_MAX } from '../config/archivos.js';
import { HttpError } from '../utils/HttpError.js';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CV_TAMANO_MAX, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new HttpError(400, 'El archivo debe ser un PDF.', { cv: 'El archivo debe ser un PDF.' }));
    cb(null, true);
  },
}).single('cv');

export function subirCv(req, res, next) {
  subida(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera los 4 MB.' : 'No se ha podido subir el archivo.';
      return next(new HttpError(400, mensaje, { cv: mensaje }));
    }
    next(err);
  });
}
