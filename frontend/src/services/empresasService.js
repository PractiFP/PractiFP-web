import { api } from './api.js';

export const miPerfil = (opciones) => api.get('/empresas/yo', opciones);
export const actualizarMiPerfil = (datos) => api.put('/empresas/yo', datos);
export const perfilPublico = (id, opciones) => api.get(`/empresas/${id}`, opciones);
export const listarEmpresas = (filtros, opciones) => api.get(`/empresas?${filtros}`, opciones);
