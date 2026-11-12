import * as ofertaService from '../services/ofertaService.js';
import * as candidaturaService from '../services/candidaturaService.js';
import * as faseService from '../services/faseService.js';

// GET /api/ofertas  (público, con filtros en la URL)
export async function buscar(req, res) {
  res.json({ data: await ofertaService.buscar(req.query, req.usuario) });
}

// GET /api/ofertas/opciones  (valores para los filtros)
export async function opciones(req, res) {
  res.json({ data: await ofertaService.opcionesBusqueda() });
}

// GET /api/ofertas/:id
export async function detalle(req, res) {
  res.json({ data: await ofertaService.obtener(Number(req.params.id), req.usuario) });
}

// POST /api/ofertas  (empresa)
export async function crear(req, res) {
  res.status(201).json({ data: await ofertaService.crear(req.usuario.empresaId, req.body) });
}

// PUT /api/ofertas/:id  (empresa propietaria)
export async function actualizar(req, res) {
  res.json({ data: await ofertaService.actualizar(Number(req.params.id), req.usuario.empresaId, req.body) });
}

// PATCH /api/ofertas/:id/estado  { activa }
export async function cambiarEstado(req, res) {
  res.json({ data: await ofertaService.cambiarActiva(Number(req.params.id), req.usuario.empresaId, req.body?.activa) });
}

// DELETE /api/ofertas/:id
export async function eliminar(req, res) {
  res.json({ data: await ofertaService.eliminar(Number(req.params.id), req.usuario.empresaId) });
}

// POST /api/ofertas/:id/candidaturas  (alumno)
export async function inscribirse(req, res) {
  res.status(201).json({ data: await candidaturaService.inscribir(req.usuario.alumnoId, Number(req.params.id)) });
}

// PUT /api/ofertas/:id/fases  { fases: [{ id?, nombre, descripcion, duracionDias, obligatoria }] }  (en orden)
export async function guardarFases(req, res) {
  res.json({ data: await faseService.guardar(Number(req.params.id), req.usuario.empresaId, req.body) });
}
