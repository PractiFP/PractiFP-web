import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import * as ofertas from '../controllers/ofertas.controller.js';

const router = Router();
const soloEmpresa = [requireAuth, requireRole('EMPRESA')];

router.get('/', optionalAuth, asyncHandler(ofertas.buscar));
router.get('/opciones', asyncHandler(ofertas.opciones));
router.get('/:id', validarId('id'), optionalAuth, asyncHandler(ofertas.detalle));

router.post('/', soloEmpresa, asyncHandler(ofertas.crear));
router.put('/:id', validarId('id'), soloEmpresa, asyncHandler(ofertas.actualizar));
router.patch('/:id/estado', validarId('id'), soloEmpresa, asyncHandler(ofertas.cambiarEstado));
router.delete('/:id', validarId('id'), soloEmpresa, asyncHandler(ofertas.eliminar));
router.put('/:id/fases', validarId('id'), soloEmpresa, asyncHandler(ofertas.guardarFases));

router.post('/:id/candidaturas', validarId('id'), requireAuth, requireRole('ALUMNO'), asyncHandler(ofertas.inscribirse));

export default router;
