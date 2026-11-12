import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js';
import { subirCv } from '../middlewares/subirCv.js';
import { validarId } from '../middlewares/validarId.js';
import * as alumnos from '../controllers/alumnos.controller.js';
import * as proyectos from '../controllers/proyectos.controller.js';
import { subirImagen } from '../middlewares/subirImagen.js';

const router = Router();
const soloAlumno = [requireAuth, requireRole('ALUMNO')];

// Rutas del propio alumno (antes que /:id para que "yo" no se tome como id)
router.get('/yo', soloAlumno, asyncHandler(alumnos.miPerfil));
router.put('/yo', soloAlumno, asyncHandler(alumnos.actualizarMiPerfil));
router.post('/yo/cv', soloAlumno, subirCv, asyncHandler(alumnos.subirMiCv));
router.delete('/yo/cv', soloAlumno, asyncHandler(alumnos.eliminarMiCv));
router.put('/yo/tecnologias/:tecnologiaId', soloAlumno, validarId('tecnologiaId'), asyncHandler(alumnos.guardarTecnologia));
router.delete('/yo/tecnologias/:tecnologiaId', soloAlumno, validarId('tecnologiaId'), asyncHandler(alumnos.quitarTecnologia));
router.get('/yo/proyectos', soloAlumno, asyncHandler(proyectos.misProyectos));
router.post('/yo/proyectos', soloAlumno, subirImagen, asyncHandler(proyectos.crear));
router.get('/yo/candidaturas', soloAlumno, asyncHandler(alumnos.misCandidaturas));
router.get('/yo/favoritos', soloAlumno, asyncHandler(alumnos.misFavoritos));
router.put('/yo/favoritos/:ofertaId', soloAlumno, validarId('ofertaId'), asyncHandler(alumnos.guardarFavorito));
router.delete('/yo/favoritos/:ofertaId', soloAlumno, validarId('ofertaId'), asyncHandler(alumnos.quitarFavorito));

// Perfil público y currículum (este último con control de acceso)
router.get('/:id', validarId('id'), optionalAuth, asyncHandler(alumnos.perfilPublico));
router.get('/:id/cv', validarId('id'), requireAuth, asyncHandler(alumnos.verCv));

export default router;
