import { api } from './api.js';

/** @param {URLSearchParams|string} filtros */
export const buscarOfertas = (filtros, opciones) => api.get(`/ofertas?${filtros}`, opciones);
export const opcionesBusqueda = (opciones) => api.get('/ofertas/opciones', opciones);
export const obtenerOferta = (id, opciones) => api.get(`/ofertas/${id}`, opciones);

export const misOfertas = (opciones) => api.get('/empresas/yo/ofertas', opciones);
export const crearOferta = (datos) => api.post('/ofertas', datos);
export const actualizarOferta = (id, datos) => api.put(`/ofertas/${id}`, datos);
export const cambiarEstadoOferta = (id, activa) => api.patch(`/ofertas/${id}/estado`, { activa });
export const eliminarOferta = (id) => api.delete(`/ofertas/${id}`);
export const guardarFases = (ofertaId, fases) => api.put(`/ofertas/${ofertaId}/fases`, { fases });
