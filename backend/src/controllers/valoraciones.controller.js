import * as valoracionService from '../services/valoracionService.js';

// GET /api/empresas/:id/valoraciones  (pública; con sesión de alumno añade puedeValorar y miValoracion)
export async function listar(req, res) {
  res.json({ data: await valoracionService.listar(Number(req.params.id), req.usuario) });
}

// POST /api/empresas/:id/valoraciones  { puntuacion, comentario }  (alumno con candidatura aceptada)
export async function crear(req, res) {
  res.status(201).json({ data: await valoracionService.crear(req.usuario.alumnoId, Number(req.params.id), req.body) });
}

// GET /api/empresas/yo/valoraciones  (empresa: las suyas aprobadas)
export async function recibidas(req, res) {
  res.json({ data: await valoracionService.listar(req.usuario.empresaId, null) });
}
