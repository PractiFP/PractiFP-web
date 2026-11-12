// Ofertas de prácticas: búsqueda pública y gestión por parte de la empresa.
import { transaction, query } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import * as Oferta from '../models/ofertaModel.js';
import * as Candidatura from '../models/candidaturaModel.js';
import { marcar } from './favoritoService.js';
import * as Fase from '../models/faseModel.js';
import { resumen as resumenFases } from './faseService.js';

export const MODALIDADES = ['PRESENCIAL', 'HIBRIDA', 'REMOTA'];
const POR_PAGINA = 12;
const MAX_TECNOLOGIAS = 15;

const hoy = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD en hora local
const esFecha = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const enteroPositivo = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

/** Lee los filtros de la URL (?q=&ciclo=DAW&localidad=&modalidad=&remunerada=si&empresa=3&tecnologias=1,4&abiertas=no&pagina=2). */
export async function buscar(q = {}, usuario = null) {
  const pagina = enteroPositivo(q.pagina) || 1;
  let cicloId = null;
  if (q.ciclo) {
    const [ciclo] = await query('SELECT id FROM CICLOS WHERE codigo = ?', [String(q.ciclo)]);
    if (!ciclo) return { ofertas: [], total: 0, pagina, paginas: 0, porPagina: POR_PAGINA };
    cicloId = ciclo.id;
  }
  const filtros = {
    q: limpiar(q.q)?.slice(0, 100) || null,
    cicloId,
    localidad: limpiar(q.localidad) || null,
    modalidad: MODALIDADES.includes(q.modalidad) ? q.modalidad : null,
    remunerada: q.remunerada === 'si' ? true : q.remunerada === 'no' ? false : null,
    empresaId: enteroPositivo(q.empresa),
    tecnologias: String(q.tecnologias || '').split(',').map(enteroPositivo).filter(Boolean).slice(0, 10),
    soloAbiertas: q.abiertas !== 'no',
    limite: POR_PAGINA,
    desplazamiento: (pagina - 1) * POR_PAGINA,
  };
  const { total, ofertas } = await Oferta.buscar(filtros);
  // Para un alumno se indica qué ofertas tiene en favoritos y en cuáles se ha inscrito
  const lista = usuario?.rol === 'ALUMNO' ? await marcar(usuario.alumnoId, ofertas) : ofertas;
  return { ofertas: lista, total, pagina, paginas: Math.ceil(total / POR_PAGINA), porPagina: POR_PAGINA };
}

export async function opcionesBusqueda() {
  const [localidades, empresas] = await Promise.all([
    Oferta.localidadesConOfertas(),
    query(`SELECT e.id, e.nombre FROM EMPRESAS e JOIN USUARIOS u ON u.id = e.usuario_id WHERE u.activo = TRUE ORDER BY e.nombre`),
  ]);
  return { localidades, empresas };
}

/** Detalle público. Las ofertas de empresas desactivadas solo las ven su empresa y los administradores. */
export async function obtener(id, usuario) {
  const oferta = await Oferta.obtener(id);
  const esPropia = oferta && usuario?.empresaId === oferta.empresa.id;
  if (!oferta || (!oferta.empresaActiva && !esPropia && usuario?.rol !== 'ADMIN')) {
    throw new HttpError(404, 'No se ha encontrado la oferta.');
  }
  const { empresaActiva: _e, ...publica } = oferta;
  const fases = await Fase.listar(oferta.id);
  const resultado = { ...publica, esPropia: Boolean(esPropia), fases, resumenFases: resumenFases(fases) };
  if (usuario?.rol === 'ALUMNO') {
    const [marcada] = await marcar(usuario.alumnoId, [resultado]);
    marcada.miCandidatura = await Candidatura.deAlumnoEnOferta(usuario.alumnoId, oferta.id);
    return marcada;
  }
  return resultado;
}

export const listarDeEmpresa = (empresaId) => Oferta.listarDeEmpresa(empresaId);

/** Valida y normaliza los datos del formulario de oferta. */
async function preparar(cuerpo = {}, { fechaPublicacion } = {}) {
  const remunerada = cuerpo.remunerada === true || cuerpo.remunerada === 'true';
  const d = {
    titulo: limpiar(cuerpo.titulo),
    descripcion: limpiar(cuerpo.descripcion),
    cicloId: cuerpo.cicloId,
    localidad: limpiar(cuerpo.localidad),
    modalidad: cuerpo.modalidad,
    remunerada,
    salario: remunerada ? cuerpo.salario : null,
    plazas: cuerpo.plazas,
    fechaLimite: limpiar(cuerpo.fechaLimite),
    activa: cuerpo.activa === undefined ? true : cuerpo.activa === true || cuerpo.activa === 'true',
    tecnologias: Array.isArray(cuerpo.tecnologias) ? cuerpo.tecnologias : [],
  };
  const minimaFecha = fechaPublicacion || hoy();

  validar(d, {
    titulo: [reglas.requerido(), reglas.longitudMax(150)],
    descripcion: [reglas.requerido(), reglas.longitudMin(20, 'Describe la oferta con al menos 20 caracteres.'), reglas.longitudMax(5000)],
    cicloId: [reglas.requerido('Elige el ciclo formativo.'), reglas.enteroPositivo('Ciclo no válido.')],
    localidad: [reglas.requerido(), reglas.longitudMax(100)],
    modalidad: [reglas.requerido('Elige la modalidad.'), reglas.unoDe(MODALIDADES, 'Modalidad no válida.')],
    salario: remunerada
      ? [reglas.requerido('Indica el salario mensual.'), reglas.numeroEntre(0, 99999, 'El salario debe estar entre 0 y 99 999 €.')]
      : [],
    plazas: [reglas.requerido(), reglas.enteroPositivo('Las plazas deben ser un número entero mayor que 0.'), reglas.numeroEntre(1, 999, 'Máximo 999 plazas.')],
    fechaLimite: [
      reglas.requerido('Indica la fecha límite de inscripción.'),
      (v) => (v && !esFecha(v) ? 'Fecha no válida.' : null),
      (v) => (v && esFecha(v) && v < minimaFecha ? (fechaPublicacion ? 'No puede ser anterior a la fecha de publicación.' : 'No puede ser anterior a hoy.') : null),
    ],
    tecnologias: [
      (v) => (!v.length ? 'Añade al menos una tecnología.' : null),
      (v) => (v.length > MAX_TECNOLOGIAS ? `Máximo ${MAX_TECNOLOGIAS} tecnologías.` : null),
    ],
  });

  const tecnologias = d.tecnologias.map((t) => ({ id: enteroPositivo(t?.id), obligatoria: t?.obligatoria !== false }));
  const ids = tecnologias.map((t) => t.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new HttpError(400, 'Revisa los datos del formulario.', { tecnologias: 'La lista de tecnologías no es válida o tiene repetidas.' });
  }
  const [{ n: existentes }] = await query('SELECT COUNT(*) AS n FROM TECNOLOGIAS WHERE id IN (?)', [ids]);
  if (existentes !== ids.length) throw new HttpError(400, 'Revisa los datos del formulario.', { tecnologias: 'Alguna tecnología no existe.' });
  const [ciclo] = await query('SELECT id FROM CICLOS WHERE id = ?', [d.cicloId]);
  if (!ciclo) throw new HttpError(400, 'Revisa los datos del formulario.', { cicloId: 'El ciclo elegido no existe.' });

  return {
    ...d,
    cicloId: Number(d.cicloId),
    plazas: Number(d.plazas),
    salario: remunerada ? Math.round(Number(d.salario) * 100) / 100 : null,
    tecnologias,
  };
}

/** Comprueba que la oferta existe y pertenece a la empresa. */
async function comprobarPropiedad(ofertaId, empresaId) {
  const oferta = await Oferta.obtenerEmpresaId(ofertaId);
  if (!oferta) throw new HttpError(404, 'No se ha encontrado la oferta.');
  if (oferta.empresaId !== empresaId) throw new HttpError(403, 'Esta oferta no es de tu empresa.');
  return oferta;
}

export async function crear(empresaId, cuerpo) {
  const d = await preparar(cuerpo);
  const id = await transaction(async (conn) => {
    const nuevaId = await Oferta.crear(conn, empresaId, d);
    await Oferta.guardarTecnologias(conn, nuevaId, d.tecnologias);
    return nuevaId;
  });
  return Oferta.obtener(id);
}

export async function actualizar(ofertaId, empresaId, cuerpo) {
  const { fechaPublicacion } = await comprobarPropiedad(ofertaId, empresaId);
  const d = await preparar(cuerpo, { fechaPublicacion });
  await transaction(async (conn) => {
    await Oferta.actualizar(conn, ofertaId, d);
    await Oferta.guardarTecnologias(conn, ofertaId, d.tecnologias);
  });
  return Oferta.obtener(ofertaId);
}

export async function cambiarActiva(ofertaId, empresaId, activa) {
  if (typeof activa !== 'boolean') throw new HttpError(400, 'Indica si la oferta está activa (true o false).');
  await comprobarPropiedad(ofertaId, empresaId);
  await Oferta.cambiarActiva(ofertaId, activa);
  return Oferta.obtener(ofertaId);
}

export async function eliminar(ofertaId, empresaId) {
  await comprobarPropiedad(ofertaId, empresaId);
  const candidaturas = await Oferta.contarCandidaturas(ofertaId);
  await Oferta.eliminar(ofertaId);
  return { eliminada: true, candidaturasEliminadas: candidaturas };
}
