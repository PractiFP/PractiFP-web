// Manejador central de errores: todas las respuestas de error tienen el formato
// { error: { mensaje, detalles } }
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

// Traduce errores habituales de MariaDB a mensajes comprensibles
const ERRORES_BD = {
  ER_DUP_ENTRY: [409, 'El registro ya existe.'],
  ER_NO_REFERENCED_ROW_2: [400, 'Hace referencia a un elemento que no existe.'],
  ER_ROW_IS_REFERENCED_2: [409, 'No se puede eliminar porque está en uso.'],
  ER_CONSTRAINT_FAILED: [400, 'Los datos no cumplen las restricciones.'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Los datos no cumplen las restricciones.'],
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor.';
  // Los mensajes escritos por la aplicación (HttpError) se pueden mostrar siempre;
  // los de errores inesperados se ocultan en producción porque pueden revelar detalles internos
  let mostrable = err instanceof HttpError;

  if (err.code && ERRORES_BD[err.code]) {
    [status, mensaje] = ERRORES_BD[err.code];
    mostrable = true;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ER_GET_CONNECTION_TIMEOUT' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    status = 503;
    mensaje = 'No se puede conectar con la base de datos.';
    mostrable = true;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    mensaje = 'Los datos enviados son demasiado grandes.';
  }

  if (status >= 500) console.error(mostrable ? `${status} ${mensaje}` : err);

  res.status(status).json({
    error: {
      mensaje: status >= 500 && !mostrable && env.nodeEnv === 'production' ? 'Error interno del servidor.' : mensaje,
      detalles: err.detalles || null,
    },
  });
}
