import * as candidaturaService from '../services/candidaturaService.js';

// PATCH /api/candidaturas/:id/estado  { estado }  (empresa propietaria de la oferta)
export async function cambiarEstado(req, res) {
  res.json({ data: await candidaturaService.cambiarEstado(Number(req.params.id), req.usuario.empresaId, req.body?.estado) });
}

// PATCH /api/candidaturas/:id/fase  { faseId }  (null = sin fase)
export async function cambiarFase(req, res) {
  res.json({ data: await candidaturaService.cambiarFase(Number(req.params.id), req.usuario.empresaId, req.body?.faseId) });
}
