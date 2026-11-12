// Comprueba que un parámetro de la URL es un id numérico positivo.
import { HttpError } from '../utils/HttpError.js';

export const validarId = (nombre) => (req, res, next) => {
  const valor = Number(req.params[nombre]);
  if (!Number.isInteger(valor) || valor <= 0) return next(new HttpError(404, 'No se ha encontrado el recurso.'));
  next();
};
