// Gestión de la plataforma por parte del administrador.
import { HttpError } from '../utils/HttpError.js';
import { limpiar } from '../utils/validadores.js';
import * as Admin from '../models/adminModel.js';
import * as Oferta from '../models/ofertaModel.js';

const booleano = (v) => (v === 'si' || v === 'true' || v === true ? true : v === 'no' || v === 'false' || v === false ? false : null);
const texto = (v) => limpiar(v)?.slice(0, 100) || null;
const exigirBooleano = (v, campo) => {
  if (typeof v !== 'boolean') throw new HttpError(400, `Indica ${campo} con true o false.`);
  return v;
};

export function listarUsuarios(q = {}) {
  return Admin.listarUsuarios({ q: texto(q.q), rol: ['ALUMNO', 'EMPRESA', 'ADMIN'].includes(q.rol) ? q.rol : null, activo: booleano(q.activo) });
}

export async function cambiarActivo(usuarioId, activo, admin) {
  exigirBooleano(activo, 'si la cuenta está activa');
  const usuario = await Admin.obtenerUsuario(usuarioId);
  if (!usuario) throw new HttpError(404, 'No se ha encontrado el usuario.');
  if (usuario.id === admin.id) throw new HttpError(400, 'No puedes desactivar tu propia cuenta.');
  if (usuario.rol === 'ADMIN') throw new HttpError(403, 'Las cuentas de administrador no se gestionan desde aquí.');
  await Admin.cambiarActivo(usuarioId, activo);
  return { id: usuarioId, activo };
}

export function listarEmpresas(q = {}) {
  return Admin.listarEmpresas({ q: texto(q.q), verificada: booleano(q.verificada) });
}

export async function cambiarVerificada(empresaId, verificada) {
  exigirBooleano(verificada, 'si la empresa está verificada');
  if (!(await Admin.cambiarVerificada(empresaId, verificada))) throw new HttpError(404, 'No se ha encontrado la empresa.');
  return { id: empresaId, verificada };
}

export function listarOfertas(q = {}) {
  return Admin.listarOfertas({ q: texto(q.q), estado: ['abiertas', 'cerradas', 'inactivas'].includes(q.estado) ? q.estado : null });
}

export async function cambiarActivaOferta(ofertaId, activa) {
  exigirBooleano(activa, 'si la oferta está activa');
  if (!(await Oferta.obtenerEmpresaId(ofertaId))) throw new HttpError(404, 'No se ha encontrado la oferta.');
  await Oferta.cambiarActiva(ofertaId, activa);
  return { id: ofertaId, activa };
}

export async function eliminarOferta(ofertaId) {
  if (!(await Oferta.obtenerEmpresaId(ofertaId))) throw new HttpError(404, 'No se ha encontrado la oferta.');
  const candidaturas = await Oferta.contarCandidaturas(ofertaId);
  await Oferta.eliminar(ofertaId);
  return { eliminada: true, candidaturasEliminadas: candidaturas };
}

const ESTADOS_VALORACION = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

export async function listarValoraciones(q = {}) {
  const estado = ESTADOS_VALORACION.includes(q.estado) ? q.estado : 'PENDIENTE';
  const [valoraciones, totales] = await Promise.all([Admin.listarValoraciones({ estado }), Admin.contarValoraciones()]);
  return { estado, valoraciones, totales };
}

export async function moderarValoracion(id, estado) {
  if (!ESTADOS_VALORACION.includes(estado)) throw new HttpError(400, `Estado no válido. Usa uno de: ${ESTADOS_VALORACION.join(', ')}.`);
  if (!(await Admin.cambiarEstadoValoracion(id, estado))) throw new HttpError(404, 'No se ha encontrado la valoración.');
  return { id, estado };
}

export async function eliminarValoracion(id) {
  if (!(await Admin.eliminarValoracion(id))) throw new HttpError(404, 'No se ha encontrado la valoración.');
  return { eliminada: true };
}
