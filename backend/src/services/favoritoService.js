// Ofertas guardadas por el alumno.
import { HttpError } from '../utils/HttpError.js';
import * as Favorito from '../models/favoritoModel.js';
import * as Oferta from '../models/ofertaModel.js';
import * as Candidatura from '../models/candidaturaModel.js';

export async function listar(alumnoId) {
  const ofertas = await Oferta.obtenerVarias(await Favorito.listarIds(alumnoId));
  const estados = await Candidatura.estadosDeAlumno(alumnoId, ofertas.map((o) => o.id));
  return ofertas.map((o) => ({ ...o, esFavorita: true, miEstado: estados[o.id] ?? null }));
}

export async function guardar(alumnoId, ofertaId) {
  const oferta = await Oferta.obtener(ofertaId);
  if (!oferta || !oferta.empresaActiva) throw new HttpError(404, 'No se ha encontrado la oferta.');
  const nueva = await Favorito.guardar(alumnoId, ofertaId);
  return { esFavorita: true, yaEstaba: !nueva };
}

export async function quitar(alumnoId, ofertaId) {
  if (!(await Favorito.quitar(alumnoId, ofertaId))) throw new HttpError(404, 'Esta oferta no estaba en tus favoritos.');
  return { esFavorita: false };
}

/** Añade a cada oferta si es favorita del alumno y el estado de su candidatura (si la tiene). */
export async function marcar(alumnoId, ofertas) {
  const ids = ofertas.map((o) => o.id);
  const [favoritas, estados] = await Promise.all([Favorito.idsDeAlumno(alumnoId, ids), Candidatura.estadosDeAlumno(alumnoId, ids)]);
  return ofertas.map((o) => ({ ...o, esFavorita: favoritas.has(o.id), miEstado: estados[o.id] ?? null }));
}
