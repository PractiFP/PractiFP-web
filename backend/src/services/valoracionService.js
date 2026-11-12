// Valoraciones de empresas por parte de alumnos con experiencia verificable.
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import * as Valoracion from '../models/valoracionModel.js';
import * as Empresa from '../models/empresaModel.js';

function resumen(valoraciones) {
  const total = valoraciones.length;
  const media = total ? Math.round((valoraciones.reduce((s, v) => s + v.puntuacion, 0) / total) * 10) / 10 : null;
  const distribucion = Object.fromEntries([5, 4, 3, 2, 1].map((n) => [n, valoraciones.filter((v) => v.puntuacion === n).length]));
  return { total, media, distribucion };
}

async function comprobarEmpresa(empresaId) {
  const empresa = await Empresa.obtenerPerfil(empresaId);
  if (!empresa || !empresa.activo) throw new HttpError(404, 'No se ha encontrado la empresa.');
  return empresa;
}

/** Valoraciones públicas (solo aprobadas). Para un alumno indica si puede valorar y su valoración. */
export async function listar(empresaId, usuario) {
  await comprobarEmpresa(empresaId);
  const valoraciones = await Valoracion.listarAprobadas(empresaId);
  const datos = { valoraciones, resumen: resumen(valoraciones) };
  if (usuario?.rol === 'ALUMNO') {
    const mia = await Valoracion.deAlumno(usuario.alumnoId, empresaId);
    datos.miValoracion = mia;
    datos.puedeValorar = !mia && (await Valoracion.tieneExperiencia(usuario.alumnoId, empresaId));
  }
  return datos;
}

export async function crear(alumnoId, empresaId, cuerpo = {}) {
  await comprobarEmpresa(empresaId);
  const d = { puntuacion: cuerpo.puntuacion, comentario: limpiar(cuerpo.comentario) };
  validar(d, {
    puntuacion: [reglas.requerido('Elige una puntuación del 1 al 5.'), (v) => (![1, 2, 3, 4, 5].includes(Number(v)) || !Number.isInteger(Number(v)) ? 'La puntuación debe ser un número del 1 al 5.' : null)],
    comentario: [reglas.requerido('Escribe un comentario.'), reglas.longitudMin(10, 'Escribe al menos 10 caracteres.'), reglas.longitudMax(1000)],
  });
  if (await Valoracion.deAlumno(alumnoId, empresaId)) throw new HttpError(409, 'Ya has valorado esta empresa.');
  if (!(await Valoracion.tieneExperiencia(alumnoId, empresaId))) {
    throw new HttpError(403, 'Solo pueden valorar los alumnos con una candidatura aceptada en esta empresa.');
  }
  try {
    await Valoracion.crear(alumnoId, empresaId, Number(d.puntuacion), d.comentario);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya has valorado esta empresa.');
    throw err;
  }
  return Valoracion.deAlumno(alumnoId, empresaId);
}
