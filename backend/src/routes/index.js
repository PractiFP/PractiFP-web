// Punto central donde se registran todas las rutas de la API.
import { Router } from 'express';
import saludRoutes from './salud.routes.js';
import authRoutes from './auth.routes.js';
import ciclosRoutes from './ciclos.routes.js';
import panelRoutes from './panel.routes.js';
import alumnosRoutes from './alumnos.routes.js';
import empresasRoutes from './empresas.routes.js';
import cuentaRoutes from './cuenta.routes.js';
import tecnologiasRoutes from './tecnologias.routes.js';
import ofertasRoutes from './ofertas.routes.js';
import candidaturasRoutes from './candidaturas.routes.js';
import proyectosRoutes from './proyectos.routes.js';
import adminRoutes from './admin.routes.js';
import instalacionRoutes from './instalacion.routes.js';

const router = Router();

router.use('/salud', saludRoutes);
router.use('/auth', authRoutes);
router.use('/ciclos', ciclosRoutes);
router.use('/panel', panelRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/empresas', empresasRoutes);
router.use('/cuenta', cuentaRoutes);
router.use('/tecnologias', tecnologiasRoutes);
router.use('/ofertas', ofertasRoutes);
router.use('/candidaturas', candidaturasRoutes);
router.use('/proyectos', proyectosRoutes);
router.use('/admin', adminRoutes);
router.use('/instalacion', instalacionRoutes);

export default router;
