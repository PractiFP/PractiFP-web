import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as ciclos from '../controllers/ciclos.controller.js';

const router = Router();

router.get('/', asyncHandler(ciclos.listar));

export default router;
