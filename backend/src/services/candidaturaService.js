// Inscripción en ofertas y gestión del estado de las candidaturas.
import { HttpError } from '../utils/HttpError.js';
import * as Candidatura from '../models/candidaturaModel.js';
import * as Oferta from '../models/ofertaModel.js';
import * as Fase from '../models/faseModel.js';

export async function inscribir(alumnoId, ofertaId) {
  const oferta = await Oferta.obtener(ofertaId);
  if (!oferta || !oferta.empresaActiva) throw new HttpError(404, 'No se ha encontrado la oferta.');
  if (!oferta.abierta) throw new HttpError(409, 'Esta oferta ya no admite inscripciones.');
  if (await Candidatura.deAlumnoEnOferta(alumnoId, ofertaId)) throw new HttpError(409, 'Ya estás inscrito en esta oferta.');
  try {
    await Candidatura.crear(alumnoId, ofertaId);
  } catch (err) {
    // Dos peticiones a la vez: la restricción UNIQUE (alumno, oferta) impide el duplicado
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya estás inscrito en esta oferta.');
    throw err;
  }
  return Candidatura.deAlumnoEnOferta(alumnoId, ofertaId);
}

export const listarDeAlumno = (alumnoId) => Candidatura.listarDeAlumno(alumnoId);

export async function listarDeEmpresa(empresaId, q = {}) {
  const ofertaId = Number.isInteger(Number(q.oferta)) && Number(q.oferta) > 0 ? Number(q.oferta) : null;
  const estado = Candidatura.ESTADOS.includes(q.estado) ? q.estado : null;
  const candidaturas = await Candidatura.listarDeEmpresa(empresaId, { ofertaId, estado });
  // Cada candidatura lleva las fases de su oferta para poder elegir la fase actual
  const fases = await Fase.listarDeOfertas([...new Set(candidaturas.map((c) => c.oferta.id))]);
  return candidaturas.map((c) => ({ ...c, fases: fases[c.oferta.id] ?? [] }));
}

export async function cambiarFase(candidaturaId, empresaId, faseId) {
  const candidatura = await Candidatura.obtener(candidaturaId);
  if (!candidatura) throw new HttpError(404, 'No se ha encontrado la candidatura.');
  if (candidatura.empresaId !== empresaId) throw new HttpError(403, 'Esta candidatura no es de una oferta de tu empresa.');
  const id = faseId === null || faseId === '' || faseId === undefined ? null : Number(faseId);
  if (id !== null && !(await Fase.perteneceAOferta(id, candidatura.ofertaId))) {
    throw new HttpError(400, 'Esa fase no pertenece a la oferta de la candidatura.');
  }
  await Candidatura.cambiarFase(candidaturaId, id);
  return { id: candidaturaId, faseActualId: id };
}

export async function cambiarEstado(candidaturaId, empresaId, estado) {
  if (!Candidatura.ESTADOS.includes(estado)) {
    throw new HttpError(400, `Estado no válido. Usa uno de: ${Candidatura.ESTADOS.join(', ')}.`);
  }
  const candidatura = await Candidatura.obtener(candidaturaId);
  if (!candidatura) throw new HttpError(404, 'No se ha encontrado la candidatura.');
  if (candidatura.empresaId !== empresaId) throw new HttpError(403, 'Esta candidatura no es de una oferta de tu empresa.');
  await Candidatura.cambiarEstado(candidaturaId, estado);
  return { ...candidatura, estado };
}
