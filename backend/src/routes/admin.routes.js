// Panel de administración: todas las rutas exigen el rol ADMIN.
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import * as admin from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/usuarios', asyncHandler(admin.usuarios));
router.patch('/usuarios/:id/activo', validarId('id'), asyncHandler(admin.cambiarActivoUsuario));

router.get('/empresas', asyncHandler(admin.empresas));
router.patch('/empresas/:id/verificada', validarId('id'), asyncHandler(admin.cambiarVerificada));

router.get('/ofertas', asyncHandler(admin.ofertas));
router.patch('/ofertas/:id/activa', validarId('id'), asyncHandler(admin.cambiarActivaOferta));
router.delete('/ofertas/:id', validarId('id'), asyncHandler(admin.eliminarOferta));

router.get('/valoraciones', asyncHandler(admin.valoraciones));
router.patch('/valoraciones/:id', validarId('id'), asyncHandler(admin.moderarValoracion));
router.delete('/valoraciones/:id', validarId('id'), asyncHandler(admin.eliminarValoracion));

export default router;
