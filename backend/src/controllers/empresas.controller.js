import * as empresaService from '../services/empresaService.js';
import * as ofertaService from '../services/ofertaService.js';
import * as candidaturaService from '../services/candidaturaService.js';

// GET /api/empresas/yo
export async function miPerfil(req, res) {
  const { usuarioId: _u, ...perfil } = await empresaService.obtenerPerfil(req.usuario.empresaId);
  res.json({ data: perfil });
}

// PUT /api/empresas/yo
export async function actualizarMiPerfil(req, res) {
  const { usuarioId: _u, ...perfil } = await empresaService.actualizarPerfil(req.usuario.empresaId, req.body);
  res.json({ data: perfil });
}

// GET /api/empresas/:id  (público)
export async function perfilPublico(req, res) {
  res.json({ data: await empresaService.obtenerPerfilPublico(Number(req.params.id), req.usuario) });
}

// GET /api/empresas  (público: ?q=&localidad=)
export async function listar(req, res) {
  res.json({ data: await empresaService.listar(req.query) });
}

// GET /api/empresas/yo/ofertas  (todas las ofertas de la empresa, también inactivas)
export async function misOfertas(req, res) {
  res.json({ data: await ofertaService.listarDeEmpresa(req.usuario.empresaId) });
}

// GET /api/empresas/yo/candidaturas?oferta=&estado=
export async function misCandidaturas(req, res) {
  res.json({ data: await candidaturaService.listarDeEmpresa(req.usuario.empresaId, req.query) });
}
