// Perfil de la empresa.
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar, opcional } from '../utils/validadores.js';
import * as Empresa from '../models/empresaModel.js';

export async function obtenerPerfil(empresaId) {
  const perfil = await Empresa.obtenerPerfil(empresaId);
  if (!perfil) throw new HttpError(404, 'No se ha encontrado la empresa.');
  return perfil;
}

export async function obtenerPerfilPublico(empresaId, usuario) {
  const perfil = await Empresa.obtenerPerfil(empresaId);
  const esPropia = usuario?.empresaId === perfil?.id;
  if (!perfil || (!perfil.activo && !esPropia && usuario?.rol !== 'ADMIN')) {
    throw new HttpError(404, 'No se ha encontrado la empresa.');
  }
  const { usuarioId: _u, activo: _a, ...publico } = perfil;
  return publico;
}

export async function actualizarPerfil(empresaId, cuerpo = {}) {
  const d = {
    nombre: limpiar(cuerpo.nombre),
    descripcion: opcional(cuerpo.descripcion),
    web: opcional(cuerpo.web),
    telefono: opcional(cuerpo.telefono),
    direccion: opcional(cuerpo.direccion),
    localidad: limpiar(cuerpo.localidad),
    latitud: opcional(cuerpo.latitud),
    longitud: opcional(cuerpo.longitud),
  };
  validar(d, {
    nombre: [reglas.requerido(), reglas.longitudMax(150)],
    descripcion: [reglas.longitudMax(2000)],
    web: [reglas.longitudMax(255), reglas.url()],
    telefono: [reglas.telefono()],
    direccion: [reglas.longitudMax(200)],
    localidad: [reglas.requerido(), reglas.longitudMax(100)],
    latitud: [reglas.numeroEntre(-90, 90, 'La latitud debe estar entre -90 y 90.')],
    longitud: [reglas.numeroEntre(-180, 180, 'La longitud debe estar entre -180 y 180.')],
  });
  if ((d.latitud === null) !== (d.longitud === null)) {
    const campo = d.latitud === null ? 'latitud' : 'longitud';
    throw new HttpError(400, 'Revisa los datos del formulario.', { [campo]: 'Indica latitud y longitud, o deja las dos vacías.' });
  }
  await Empresa.actualizar(empresaId, {
    ...d,
    telefono: d.telefono?.replace(/\s+/g, ' '),
    latitud: d.latitud === null ? null : Number(d.latitud),
    longitud: d.longitud === null ? null : Number(d.longitud),
  });
  return Empresa.obtenerPerfil(empresaId);
}

export async function listar(q = {}) {
  const [empresas, localidades] = await Promise.all([
    Empresa.listar({ q: limpiar(q.q)?.slice(0, 100) || null, localidad: limpiar(q.localidad) || null }),
    Empresa.localidades(),
  ]);
  return { empresas, localidades: localidades.map((l) => l.nombre) };
}
