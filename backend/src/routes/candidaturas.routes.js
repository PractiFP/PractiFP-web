import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import * as candidaturas from '../controllers/candidaturas.controller.js';

const router = Router();

router.patch('/:id/estado', validarId('id'), requireAuth, requireRole('EMPRESA'), asyncHandler(candidaturas.cambiarEstado));
router.patch('/:id/fase', validarId('id'), requireAuth, requireRole('EMPRESA'), asyncHandler(candidaturas.cambiarFase));

export default router;
