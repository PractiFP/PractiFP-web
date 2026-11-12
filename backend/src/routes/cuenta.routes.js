// Datos de acceso de la cuenta (cualquier rol).
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { limitarIntentos } from '../middlewares/limitarIntentos.js';
import * as cuenta from '../controllers/cuenta.controller.js';

const router = Router();

router.use(requireAuth);
// Se exige la contraseña actual, así que se limita también el número de intentos fallidos
router.put('/email', limitarIntentos({ maximo: 10, ventanaMin: 15 }), asyncHandler(cuenta.cambiarEmail));
router.put('/password', limitarIntentos({ maximo: 10, ventanaMin: 15 }), asyncHandler(cuenta.cambiarPassword));

export default router;
