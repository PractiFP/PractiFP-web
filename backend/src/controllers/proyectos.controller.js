import * as proyectoService from '../services/proyectoService.js';

// GET /api/alumnos/yo/proyectos
export async function misProyectos(req, res) {
  res.json({ data: await proyectoService.listarDeAlumno(req.usuario.alumnoId) });
}

// POST /api/alumnos/yo/proyectos  (multipart: campos + "imagen" opcional; "tecnologias" como JSON)
export async function crear(req, res) {
  res.status(201).json({ data: await proyectoService.crear(req.usuario.alumnoId, req.body, req.file) });
}

// PUT /api/proyectos/:id  (multipart; "quitarImagen=true" elimina la imagen)
export async function actualizar(req, res) {
  res.json({ data: await proyectoService.actualizar(Number(req.params.id), req.usuario.alumnoId, req.body, req.file) });
}

// DELETE /api/proyectos/:id
export async function eliminar(req, res) {
  await proyectoService.eliminar(Number(req.params.id), req.usuario.alumnoId);
  res.json({ data: { eliminado: true } });
}

// GET /api/proyectos/:id/imagen  (pública)
export async function imagen(req, res) {
  const { buffer, tipo } = await proyectoService.obtenerImagen(Number(req.params.id));
  res.set('Cache-Control', 'public, max-age=300');
  res.set('X-Content-Type-Options', 'nosniff');
  res.type(tipo).send(buffer);
}
