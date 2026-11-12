// Resúmenes para el dashboard de cada rol. Cada ruta exige su rol.
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as panel from '../controllers/panel.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/alumno', requireRole('ALUMNO'), asyncHandler(panel.alumno));
router.get('/empresa', requireRole('EMPRESA'), asyncHandler(panel.empresa));
router.get('/admin', requireRole('ADMIN'), asyncHandler(panel.admin));

export default router;
