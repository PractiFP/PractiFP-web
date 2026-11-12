import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { obtenerSalud } from '../controllers/salud.controller.js';

const router = Router();

// GET /api/salud
router.get('/', asyncHandler(obtenerSalud));

export default router;
