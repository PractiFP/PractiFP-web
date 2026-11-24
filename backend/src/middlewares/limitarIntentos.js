// Limita los intentos por IP en una ventana de tiempo (protección contra la fuerza bruta
// en el inicio de sesión, el registro, etc.).
//
// El contador se guarda en la base de datos (tabla INTENTOS) y no en la memoria del servidor:
// en Vercel cada petición puede atenderla una copia distinta, y un contador en memoria no protegería.
//
// Funcionamiento: cada intento suma 1 ANTES de llegar a la ruta. Si la operación sale bien, la ruta
// llama a req.intentoValido() y se resta, de modo que en la práctica solo cuentan los intentos fallidos.
// (Restar después de responder no sería fiable en Vercel, que puede congelar la función al responder).
//
// Opción contarTodos: cuentan todos los intentos, salgan bien o mal (p. ej. pedir correos de recuperación).
import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

// No se guarda la IP: solo un hash con clave secreta del límite y la IP
const claveDe = (nombre, ip) => crypto.createHmac('sha256', env.jwt.secret).update(`${nombre}|${ip}`).digest('hex');

export function limitarIntentos({ nombre, maximo = 10, ventanaMin = 15, contarTodos = false } = {}) {
  return async (req, res, next) => {
    const clave = claveDe(nombre ?? `${req.method} ${req.baseUrl}${req.path}`, req.ip);
    try {
      // Suma el intento (o empieza una ventana nueva si la anterior ya terminó)
      await query(
        `INSERT INTO INTENTOS (clave, n, hasta) VALUES (?, 1, NOW() + INTERVAL ? MINUTE)
         ON DUPLICATE KEY UPDATE n = IF(hasta > NOW(), n + 1, 1),
                                 hasta = IF(hasta > NOW(), hasta, NOW() + INTERVAL ? MINUTE)`,
        [clave, ventanaMin, ventanaMin]
      );
      const [fila] = await query('SELECT n, GREATEST(TIMESTAMPDIFF(SECOND, NOW(), hasta), 1) AS quedan FROM INTENTOS WHERE clave = ?', [clave]);

      // De vez en cuando se borran los contadores caducados para que la tabla no crezca
      if (Math.random() < 0.02) query('DELETE FROM INTENTOS WHERE hasta < NOW() - INTERVAL 1 DAY LIMIT 500').catch(() => {});

      if (fila && fila.n > maximo) {
        const minutos = Math.ceil(fila.quedan / 60);
        res.set('Retry-After', String(fila.quedan));
        return next(new HttpError(429, `Demasiados intentos. Vuelve a probar dentro de ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`));
      }
    } catch (err) {
      // Base de datos todavía sin instalar (p. ej. instalación desde la web): no hay contador
      if (err.code === 'ER_NO_SUCH_TABLE') return next();
      return next(err);
    }

    req.intentoValido = contarTodos
      ? async () => {}
      : () => query('UPDATE INTENTOS SET n = GREATEST(n, 1) - 1 WHERE clave = ?', [clave]).catch(() => {});
    next();
  };
}
