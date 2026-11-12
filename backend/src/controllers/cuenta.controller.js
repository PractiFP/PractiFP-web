import * as cuentaService from '../services/cuentaService.js';

// PUT /api/cuenta/email  { email, password }
export async function cambiarEmail(req, res) {
  res.json({ data: await cuentaService.cambiarEmail(req.usuario.id, req.body) });
}

// PUT /api/cuenta/password  { actual, nueva }
export async function cambiarPassword(req, res) {
  await cuentaService.cambiarPassword(req.usuario.id, req.body);
  res.json({ data: { actualizada: true } });
}
