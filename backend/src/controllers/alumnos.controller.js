import * as alumnoService from '../services/alumnoService.js';
import * as candidaturaService from '../services/candidaturaService.js';
import * as favoritoService from '../services/favoritoService.js';

// GET /api/alumnos/yo
export async function miPerfil(req, res) {
  const { usuarioId: _u, ...perfil } = await alumnoService.obtenerPerfil(req.usuario.alumnoId);
  res.json({ data: perfil });
}

// PUT /api/alumnos/yo
export async function actualizarMiPerfil(req, res) {
  const { usuarioId: _u, ...perfil } = await alumnoService.actualizarPerfil(req.usuario.alumnoId, req.body);
  res.json({ data: perfil });
}

// POST /api/alumnos/yo/cv  (multipart/form-data, campo "cv")
export async function subirMiCv(req, res) {
  await alumnoService.guardarCv(req.usuario.alumnoId, req.file);
  res.status(201).json({ data: { tieneCv: true } });
}

// DELETE /api/alumnos/yo/cv
export async function eliminarMiCv(req, res) {
  await alumnoService.eliminarCv(req.usuario.alumnoId);
  res.json({ data: { tieneCv: false } });
}

// PUT /api/alumnos/yo/tecnologias/:tecnologiaId  { nivel }
export async function guardarTecnologia(req, res) {
  res.json({ data: await alumnoService.guardarTecnologia(req.usuario.alumnoId, req.params.tecnologiaId, req.body?.nivel) });
}

// DELETE /api/alumnos/yo/tecnologias/:tecnologiaId
export async function quitarTecnologia(req, res) {
  res.json({ data: await alumnoService.quitarTecnologia(req.usuario.alumnoId, req.params.tecnologiaId) });
}

// GET /api/alumnos/:id  (público)
export async function perfilPublico(req, res) {
  res.json({ data: await alumnoService.obtenerPerfilPublico(Number(req.params.id), req.usuario) });
}

// GET /api/alumnos/:id/cv  (con permiso)
export async function verCv(req, res) {
  const { buffer, tipo, descarga } = await alumnoService.obtenerCv(Number(req.params.id), req.usuario);
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Disposition', `inline; filename="${descarga}"`);
  res.type(tipo).send(buffer);
}

// GET /api/alumnos/yo/candidaturas
export async function misCandidaturas(req, res) {
  res.json({ data: await candidaturaService.listarDeAlumno(req.usuario.alumnoId) });
}

// GET /api/alumnos/yo/favoritos
export async function misFavoritos(req, res) {
  res.json({ data: await favoritoService.listar(req.usuario.alumnoId) });
}

// PUT /api/alumnos/yo/favoritos/:ofertaId
export async function guardarFavorito(req, res) {
  res.json({ data: await favoritoService.guardar(req.usuario.alumnoId, Number(req.params.ofertaId)) });
}

// DELETE /api/alumnos/yo/favoritos/:ofertaId
export async function quitarFavorito(req, res) {
  res.json({ data: await favoritoService.quitar(req.usuario.alumnoId, Number(req.params.ofertaId)) });
}
