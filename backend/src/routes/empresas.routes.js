import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import * as empresas from '../controllers/empresas.controller.js';
import * as valoraciones from '../controllers/valoraciones.controller.js';

const router = Router();
const soloEmpresa = [requireAuth, requireRole('EMPRESA')];

router.get('/', asyncHandler(empresas.listar));
router.get('/yo', soloEmpresa, asyncHandler(empresas.miPerfil));
router.get('/yo/ofertas', soloEmpresa, asyncHandler(empresas.misOfertas));
router.get('/yo/candidaturas', soloEmpresa, asyncHandler(empresas.misCandidaturas));
router.get('/yo/valoraciones', soloEmpresa, asyncHandler(valoraciones.recibidas));
router.put('/yo', soloEmpresa, asyncHandler(empresas.actualizarMiPerfil));
router.get('/:id', validarId('id'), optionalAuth, asyncHandler(empresas.perfilPublico));
router.get('/:id/valoraciones', validarId('id'), optionalAuth, asyncHandler(valoraciones.listar));
router.post('/:id/valoraciones', validarId('id'), requireAuth, requireRole('ALUMNO'), asyncHandler(valoraciones.crear));

export default router;
