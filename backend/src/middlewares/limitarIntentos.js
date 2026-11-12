// Limita las peticiones por IP en una ventana de tiempo (protección básica
// contra ataques de fuerza bruta en login y registro). Solo cuenta los intentos fallidos.
import { HttpError } from '../utils/HttpError.js';

export function limitarIntentos({ maximo = 10, ventanaMin = 15 } = {}) {
  const intentos = new Map(); // ip -> { n, hasta }
  const ventanaMs = ventanaMin * 60 * 1000;

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip;
    let registro = intentos.get(ip);
    if (!registro || registro.hasta < ahora) {
      registro = { n: 0, hasta: ahora + ventanaMs };
      intentos.set(ip, registro);
    }
    if (registro.n >= maximo) {
      const minutos = Math.ceil((registro.hasta - ahora) / 60000);
      res.set('Retry-After', String(Math.ceil((registro.hasta - ahora) / 1000)));
      return next(new HttpError(429, `Demasiados intentos. Vuelve a probar dentro de ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`));
    }
    // Solo se suman los intentos que terminan en error (credenciales o datos incorrectos)
    res.on('finish', () => { if (res.statusCode >= 400) registro.n += 1; });

    // Limpieza periódica para que el mapa no crezca sin límite
    if (intentos.size > 10000) for (const [k, v] of intentos) if (v.hasta < ahora) intentos.delete(k);
    next();
  };
}
