import { api } from './api.js';

export const inscribirse = (ofertaId) => api.post(`/ofertas/${ofertaId}/candidaturas`);
export const misCandidaturas = (opciones) => api.get('/alumnos/yo/candidaturas', opciones);

/** @param {URLSearchParams|string} filtros  oferta=&estado= */
export const candidatosEmpresa = (filtros, opciones) => api.get(`/empresas/yo/candidaturas?${filtros}`, opciones);
export const cambiarEstadoCandidatura = (id, estado) => api.patch(`/candidaturas/${id}/estado`, { estado });
export const cambiarFaseCandidatura = (id, faseId) => api.patch(`/candidaturas/${id}/fase`, { faseId });
