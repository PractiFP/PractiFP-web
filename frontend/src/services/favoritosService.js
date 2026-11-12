import { api } from './api.js';

export const misFavoritos = (opciones) => api.get('/alumnos/yo/favoritos', opciones);
export const guardarFavorito = (ofertaId) => api.put(`/alumnos/yo/favoritos/${ofertaId}`);
export const quitarFavorito = (ofertaId) => api.delete(`/alumnos/yo/favoritos/${ofertaId}`);
