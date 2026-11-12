import * as Panel from '../models/panelModel.js';

// GET /api/panel/alumno
export async function alumno(req, res) {
  res.json({ data: await Panel.resumenAlumno(req.usuario.alumnoId) });
}

// GET /api/panel/empresa
export async function empresa(req, res) {
  res.json({ data: await Panel.resumenEmpresa(req.usuario.empresaId) });
}

// GET /api/panel/admin
export async function admin(req, res) {
  res.json({ data: await Panel.resumenAdmin() });
}
