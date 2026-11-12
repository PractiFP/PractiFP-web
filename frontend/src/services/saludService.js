import { api } from './api.js';

/** Estado de la API y de la base de datos. */
export const obtenerSalud = (opciones) => api.get('/salud', opciones);
