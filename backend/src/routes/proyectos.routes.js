import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import { subirImagen } from '../middlewares/subirImagen.js';
import * as proyectos from '../controllers/proyectos.controller.js';

const router = Router();
const soloAlumno = [requireAuth, requireRole('ALUMNO')];

router.get('/:id/imagen', validarId('id'), asyncHandler(proyectos.imagen));
router.put('/:id', validarId('id'), soloAlumno, subirImagen, asyncHandler(proyectos.actualizar));
router.delete('/:id', validarId('id'), soloAlumno, asyncHandler(proyectos.eliminar));

export default router;
