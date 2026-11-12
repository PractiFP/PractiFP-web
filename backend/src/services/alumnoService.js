// Perfil del alumno, currículum y tecnologías.
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar, opcional } from '../utils/validadores.js';
import * as almacen from './almacen.js';
import * as Alumno from '../models/alumnoModel.js';
import * as Ciclo from '../models/cicloModel.js';
import * as Tecnologia from '../models/tecnologiaModel.js';
import * as Proyecto from '../models/proyectoModel.js';

const NIVELES = ['BASICO', 'INTERMEDIO', 'AVANZADO'];

export async function obtenerPerfil(alumnoId) {
  const perfil = await Alumno.obtenerPerfil(alumnoId);
  if (!perfil) throw new HttpError(404, 'No se ha encontrado el alumno.');
  return perfil;
}

/** Perfil público: oculta las cuentas desactivadas e indica si quien mira puede ver el CV. */
export async function obtenerPerfilPublico(alumnoId, usuario) {
  const perfil = await Alumno.obtenerPerfil(alumnoId);
  const esPropio = usuario?.alumnoId === perfil?.id;
  if (!perfil || (!perfil.activo && !esPropio && usuario?.rol !== 'ADMIN')) {
    throw new HttpError(404, 'No se ha encontrado el perfil.');
  }
  const { usuarioId: _u, activo: _a, ...publico } = perfil;
  return {
    ...publico,
    puedeVerCv: perfil.tieneCv && (await puedeVerCv(perfil.id, usuario)),
    proyectos: await Proyecto.listarDeAlumno(perfil.id),
  };
}

export async function actualizarPerfil(alumnoId, cuerpo = {}) {
  const d = {
    nombre: limpiar(cuerpo.nombre),
    apellidos: limpiar(cuerpo.apellidos),
    cicloId: opcional(cuerpo.cicloId),
    curso: opcional(cuerpo.curso),
    centro: opcional(cuerpo.centro),
    localidad: opcional(cuerpo.localidad),
    descripcion: opcional(cuerpo.descripcion),
  };
  validar(d, {
    nombre: [reglas.requerido(), reglas.longitudMax(80)],
    apellidos: [reglas.requerido(), reglas.longitudMax(120)],
    cicloId: [reglas.requerido('Elige tu ciclo formativo.'), reglas.enteroPositivo('Ciclo no válido.')],
    curso: [reglas.unoDe(['1', '2', 1, 2], 'El curso debe ser 1.º o 2.º.')],
    centro: [reglas.longitudMax(150)],
    localidad: [reglas.longitudMax(100)],
    descripcion: [reglas.longitudMax(1000)],
  });
  if (!(await Ciclo.existe(d.cicloId))) {
    throw new HttpError(400, 'Revisa los datos del formulario.', { cicloId: 'El ciclo elegido no existe.' });
  }
  await Alumno.actualizar(alumnoId, { ...d, cicloId: Number(d.cicloId), curso: d.curso === null ? null : Number(d.curso) });
  return Alumno.obtenerPerfil(alumnoId);
}

/** Comprueba que el archivo empieza como un PDF real (no basta con la extensión ni con el tipo declarado). */
const esPdf = (buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

export async function guardarCv(alumnoId, archivo) {
  if (!archivo) throw new HttpError(400, 'Selecciona un archivo PDF.', { cv: 'Selecciona un archivo PDF.' });
  if (!esPdf(archivo.buffer)) throw new HttpError(400, 'El archivo no es un PDF válido.', { cv: 'El archivo no es un PDF válido.' });
  const nombre = almacen.nombreNuevo(`cv_${alumnoId}`, '.pdf');
  await almacen.guardar(nombre, archivo.buffer);
  const anterior = await Alumno.obtenerCvRuta(alumnoId);
  await Alumno.guardarCvRuta(alumnoId, nombre);
  await almacen.borrar(anterior);
}

export async function eliminarCv(alumnoId) {
  const anterior = await Alumno.obtenerCvRuta(alumnoId);
  if (!anterior) throw new HttpError(404, 'No tienes ningún currículum subido.');
  await Alumno.guardarCvRuta(alumnoId, null);
  await almacen.borrar(anterior);
}

/**
 * Quién puede ver un currículum: el propio alumno, un administrador
 * o una empresa en cuyas ofertas se haya inscrito el alumno.
 */
export async function puedeVerCv(alumnoId, usuario) {
  if (!usuario) return false;
  if (usuario.rol === 'ADMIN') return true;
  if (usuario.rol === 'ALUMNO') return usuario.alumnoId === Number(alumnoId);
  if (usuario.rol === 'EMPRESA') return Alumno.tieneCandidaturaEnEmpresa(alumnoId, usuario.empresaId);
  return false;
}

export async function obtenerCv(alumnoId, usuario) {
  const perfil = await Alumno.obtenerPerfil(alumnoId);
  if (!perfil) throw new HttpError(404, 'No se ha encontrado el alumno.');
  if (!(await puedeVerCv(alumnoId, usuario))) throw new HttpError(403, 'No tienes permiso para ver este currículum.');
  const nombre = await Alumno.obtenerCvRuta(alumnoId);
  const archivo = nombre && (await almacen.leer(nombre));
  if (!archivo) throw new HttpError(404, 'Este alumno no ha subido su currículum.');
  const descarga = `CV_${perfil.nombre}_${perfil.apellidos}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_');
  return { ...archivo, descarga: `${descarga}.pdf` };
}

export async function guardarTecnologia(alumnoId, tecnologiaId, nivel) {
  validar({ tecnologiaId, nivel }, {
    tecnologiaId: [reglas.enteroPositivo('Tecnología no válida.')],
    nivel: [reglas.requerido('Indica tu nivel.'), reglas.unoDe(NIVELES, 'Nivel no válido.')],
  });
  if (!(await Tecnologia.existe(tecnologiaId))) throw new HttpError(404, 'La tecnología no existe.');
  await Alumno.guardarTecnologia(alumnoId, Number(tecnologiaId), nivel);
  return Alumno.listarTecnologias(alumnoId);
}

export async function quitarTecnologia(alumnoId, tecnologiaId) {
  if (!(await Alumno.quitarTecnologia(alumnoId, Number(tecnologiaId)))) {
    throw new HttpError(404, 'No tenías esa tecnología en tu perfil.');
  }
  return Alumno.listarTecnologias(alumnoId);
}
