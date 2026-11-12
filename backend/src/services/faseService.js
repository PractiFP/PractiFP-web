// Fases del proceso de selección de cada oferta.
import { transaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { limpiar, opcional } from '../utils/validadores.js';
import * as Fase from '../models/faseModel.js';
import * as Oferta from '../models/ofertaModel.js';

const MAX_FASES = 20;

/** Duración estimada: mínimo (solo fases obligatorias) y máximo (todas). */
export function resumen(fases) {
  return {
    total: fases.length,
    diasMinimo: fases.filter((f) => f.obligatoria).reduce((s, f) => s + f.duracionDias, 0),
    diasMaximo: fases.reduce((s, f) => s + f.duracionDias, 0),
  };
}

export async function guardar(ofertaId, empresaId, cuerpo = {}) {
  const oferta = await Oferta.obtenerEmpresaId(ofertaId);
  if (!oferta) throw new HttpError(404, 'No se ha encontrado la oferta.');
  if (oferta.empresaId !== empresaId) throw new HttpError(403, 'Esta oferta no es de tu empresa.');

  if (!Array.isArray(cuerpo.fases)) throw new HttpError(400, 'Envía la lista de fases.');
  if (cuerpo.fases.length > MAX_FASES) throw new HttpError(400, `Como máximo ${MAX_FASES} fases.`);

  const actuales = new Set((await Fase.listar(ofertaId)).map((f) => f.id));
  const errores = {};
  const fases = cuerpo.fases.map((f, i) => {
    const fase = {
      id: f?.id ? Number(f.id) : null,
      nombre: limpiar(f?.nombre) || '',
      descripcion: opcional(f?.descripcion),
      duracionDias: Number(f?.duracionDias),
      obligatoria: f?.obligatoria !== false,
    };
    const err = {};
    if (!fase.nombre) err.nombre = 'Pon un nombre a la fase.';
    else if (fase.nombre.length > 100) err.nombre = 'Máximo 100 caracteres.';
    if (fase.descripcion && fase.descripcion.length > 500) err.descripcion = 'Máximo 500 caracteres.';
    if (!Number.isInteger(fase.duracionDias) || fase.duracionDias < 0 || fase.duracionDias > 365) err.duracionDias = 'Indica un número de días entre 0 y 365.';
    if (fase.id && !actuales.has(fase.id)) err.nombre = 'Esta fase no pertenece a la oferta.';
    if (Object.keys(err).length) errores[i] = err;
    return fase;
  });
  const ids = fases.filter((f) => f.id).map((f) => f.id);
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Hay fases repetidas.');
  if (Object.keys(errores).length) throw new HttpError(400, 'Revisa las fases marcadas.', { fases: errores });

  await transaction((conn) => Fase.guardarTodas(conn, ofertaId, fases));
  const guardadas = await Fase.listar(ofertaId);
  return { fases: guardadas, resumen: resumen(guardadas) };
}
