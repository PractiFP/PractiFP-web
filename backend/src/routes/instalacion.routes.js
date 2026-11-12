// Instalación desde la web (para plataformas como Vercel, donde no se pueden ejecutar comandos).
// POST /api/instalacion  con la cabecera X-Token-Instalacion  y  { "datosDePrueba": true|false }
//
// Medidas de seguridad:
//  - Solo existe si la variable de entorno INSTALACION_TOKEN está definida (mínimo 32 caracteres).
//  - El token se compara en tiempo constante.
//  - Solo funciona con la base de datos vacía: nunca borra datos de una instalación existente.
//  - Límite de intentos fallidos.
// Tras instalar, se debe borrar INSTALACION_TOKEN de la configuración.
import crypto from 'node:crypto';
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/HttpError.js';
import { limitarIntentos } from '../middlewares/limitarIntentos.js';
import { reiniciarBaseDatos, estaInstalada } from '../../scripts/reiniciarBaseDatos.js';

const router = Router();

function tokenValido(recibido) {
  const esperado = process.env.INSTALACION_TOKEN || '';
  if (esperado.length < 32 || typeof recibido !== 'string') return false;
  const a = crypto.createHash('sha256').update(recibido).digest();
  const b = crypto.createHash('sha256').update(esperado).digest();
  return crypto.timingSafeEqual(a, b);
}

router.post('/', limitarIntentos({ maximo: 5, ventanaMin: 15 }), asyncHandler(async (req, res) => {
  if ((process.env.INSTALACION_TOKEN || '').length < 32) throw new HttpError(404, `No existe la ruta POST ${req.originalUrl}`);
  if (!tokenValido(req.get('x-token-instalacion'))) throw new HttpError(403, 'Token de instalación incorrecto.');
  if (await estaInstalada()) throw new HttpError(409, 'La base de datos ya está instalada. Por seguridad, la instalación desde la web no borra datos.');

  const mensajes = [];
  const datosDePrueba = req.body?.datosDePrueba !== false;
  const log = console.log;
  console.log = (...a) => mensajes.push(a.join(' '));
  try {
    await reiniciarBaseDatos({ conDatos: datosDePrueba });
  } finally {
    console.log = log;
  }
  res.status(201).json({ data: { instalada: true, datosDePrueba, mensajes } });
}));

export default router;
