import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { limitarIntentos } from '../middlewares/limitarIntentos.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', limitarIntentos({ maximo: 10, ventanaMin: 15 }), asyncHandler(auth.registro));
router.post('/login', limitarIntentos({ maximo: 10, ventanaMin: 15 }), asyncHandler(auth.login));
router.get('/yo', requireAuth, auth.yo);

// Recuperación de contraseña. Pedir el enlace cuenta siempre como intento (envía correos).
router.post('/recuperar', limitarIntentos({ maximo: 5, ventanaMin: 15, contarTodos: true }), asyncHandler(auth.solicitarRecuperacion));
router.post('/restablecer', limitarIntentos({ maximo: 10, ventanaMin: 15 }), asyncHandler(auth.restablecerPassword));

export default router;
