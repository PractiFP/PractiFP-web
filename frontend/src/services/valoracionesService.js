import { api } from './api.js';

export const valoracionesEmpresa = (empresaId, opciones) => api.get(`/empresas/${empresaId}/valoraciones`, opciones);
export const valorarEmpresa = (empresaId, puntuacion, comentario) => api.post(`/empresas/${empresaId}/valoraciones`, { puntuacion, comentario });
export const valoracionesRecibidas = (opciones) => api.get('/empresas/yo/valoraciones', opciones);
