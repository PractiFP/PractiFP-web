import * as cuentaService from '../services/cuentaService.js';

// PUT /api/cuenta/email  { email, password }
export async function cambiarEmail(req, res) {
  const sesion = await cuentaService.cambiarEmail(req.usuario.id, req.body);
  await req.intentoValido?.();
  res.json({ data: sesion });
}

// PUT /api/cuenta/password  { actual, nueva }  →  { token } nuevo (las demás sesiones se cierran)
export async function cambiarPassword(req, res) {
  const { token } = await cuentaService.cambiarPassword(req.usuario.id, req.body);
  await req.intentoValido?.();
  res.json({ data: { actualizada: true, token } });
}

// GET /api/cuenta/datos  →  todos los datos del usuario (JSON descargable)
export async function descargarDatos(req, res) {
  const datos = await cuentaService.exportarDatos(req.usuario);
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Disposition', 'attachment; filename="practifp-mis-datos.json"');
  res.json({ data: datos });
}

// DELETE /api/cuenta  { password }
export async function eliminar(req, res) {
  await cuentaService.eliminarCuenta(req.usuario, req.body);
  res.json({ data: { eliminada: true } });
}
