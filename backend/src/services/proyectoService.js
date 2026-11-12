// Portfolio del alumno: proyectos con imagen, enlaces y tecnologías.
import { transaction, query } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar, opcional } from '../utils/validadores.js';
import { IMAGEN_TIPOS } from '../config/archivos.js';
import * as almacen from './almacen.js';
import * as Proyecto from '../models/proyectoModel.js';

const MAX_TECNOLOGIAS = 10;
const hoy = () => new Date().toLocaleDateString('sv-SE');
/** Comprueba la "firma" del archivo: no basta con el tipo que declara el navegador. */
function esImagenValida(b) {
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
  return jpg || png || webp;
}

/** Los formularios multipart envían todo como texto: se normaliza aquí. */
async function preparar(cuerpo = {}) {
  let tecnologias = cuerpo.tecnologias ?? [];
  if (typeof tecnologias === 'string') {
    try { tecnologias = JSON.parse(tecnologias); } catch { tecnologias = tecnologias.split(','); }
  }
  const d = {
    titulo: limpiar(cuerpo.titulo),
    descripcion: limpiar(cuerpo.descripcion),
    urlGithub: opcional(cuerpo.urlGithub),
    urlDemo: opcional(cuerpo.urlDemo),
    fechaCreacion: opcional(cuerpo.fechaCreacion) || hoy(),
    tecnologias: (Array.isArray(tecnologias) ? tecnologias : []).map(Number).filter((n) => Number.isInteger(n) && n > 0),
  };
  validar(d, {
    titulo: [reglas.requerido(), reglas.longitudMax(150)],
    descripcion: [reglas.requerido(), reglas.longitudMax(2000)],
    urlGithub: [reglas.longitudMax(255), reglas.url()],
    urlDemo: [reglas.longitudMax(255), reglas.url()],
    fechaCreacion: [
      (v) => (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) ? 'Fecha no válida.' : null),
      (v) => (v > hoy() ? 'La fecha no puede ser futura.' : null),
    ],
    tecnologias: [(v) => (v.length > MAX_TECNOLOGIAS ? `Máximo ${MAX_TECNOLOGIAS} tecnologías.` : null)],
  });
  d.tecnologias = [...new Set(d.tecnologias)];
  if (d.tecnologias.length) {
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM TECNOLOGIAS WHERE id IN (?)', [d.tecnologias]);
    if (n !== d.tecnologias.length) throw new HttpError(400, 'Revisa los datos del formulario.', { tecnologias: 'Alguna tecnología no existe.' });
  }
  return d;
}

/** Valida la imagen subida (si la hay) y la guarda en el almacén. Devuelve su nombre o null. */
async function guardarImagen(alumnoId, archivo) {
  if (!archivo) return null;
  if (!esImagenValida(archivo.buffer)) throw new HttpError(400, 'El archivo no es una imagen válida.', { imagen: 'El archivo no es una imagen válida.' });
  const nombre = almacen.nombreNuevo(`proyecto_${alumnoId}`, IMAGEN_TIPOS[archivo.mimetype]);
  await almacen.guardar(nombre, archivo.buffer);
  return nombre;
}

export const listarDeAlumno = (alumnoId) => Proyecto.listarDeAlumno(alumnoId);

// No se expone el nombre interno del archivo de imagen
const sinRuta = ({ imagenRuta: _r, ...p }) => p;

export async function crear(alumnoId, cuerpo, archivo) {
  const d = await preparar(cuerpo);
  const imagenRuta = await guardarImagen(alumnoId, archivo);
  try {
    const id = await transaction(async (conn) => {
      const nuevo = await Proyecto.crear(conn, alumnoId, { ...d, imagenRuta });
      await Proyecto.guardarTecnologias(conn, nuevo, d.tecnologias);
      return nuevo;
    });
    return sinRuta(await Proyecto.obtener(id));
  } catch (err) {
    await almacen.borrar(imagenRuta);
    throw err;
  }
}

async function comprobarPropiedad(proyectoId, alumnoId) {
  const proyecto = await Proyecto.obtener(proyectoId);
  if (!proyecto) throw new HttpError(404, 'No se ha encontrado el proyecto.');
  if (proyecto.alumnoId !== alumnoId) throw new HttpError(403, 'Este proyecto no es tuyo.');
  return proyecto;
}

/** Edita el proyecto. Con una imagen nueva se reemplaza la anterior; con quitarImagen=true se elimina. */
export async function actualizar(proyectoId, alumnoId, cuerpo = {}, archivo) {
  const anterior = await comprobarPropiedad(proyectoId, alumnoId);
  const d = await preparar(cuerpo);
  const nueva = await guardarImagen(alumnoId, archivo);
  const quitar = cuerpo.quitarImagen === 'true' || cuerpo.quitarImagen === true;
  const imagenRuta = nueva ?? (quitar ? null : anterior.imagenRuta);
  try {
    await transaction(async (conn) => {
      await Proyecto.actualizar(conn, proyectoId, { ...d, imagenRuta });
      await Proyecto.guardarTecnologias(conn, proyectoId, d.tecnologias);
    });
  } catch (err) {
    await almacen.borrar(nueva);
    throw err;
  }
  if (anterior.imagenRuta && anterior.imagenRuta !== imagenRuta) await almacen.borrar(anterior.imagenRuta);
  return sinRuta(await Proyecto.obtener(proyectoId));
}

export async function eliminar(proyectoId, alumnoId) {
  const proyecto = await comprobarPropiedad(proyectoId, alumnoId);
  await Proyecto.eliminar(proyectoId);
  await almacen.borrar(proyecto.imagenRuta);
}

export async function obtenerImagen(proyectoId) {
  const fila = await Proyecto.obtenerImagen(proyectoId);
  const archivo = fila?.ruta && fila.activo ? await almacen.leer(fila.ruta) : null;
  if (!archivo) throw new HttpError(404, 'Este proyecto no tiene imagen.');
  return archivo;
}
