import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as tecnologias from '../controllers/tecnologias.controller.js';

const router = Router();

router.get('/', asyncHandler(tecnologias.listar));

export default router;
