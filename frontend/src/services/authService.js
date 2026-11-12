import { api } from './api.js';

export const registrar = (datos) => api.post('/auth/registro', datos);
export const iniciarSesion = (email, password) => api.post('/auth/login', { email, password });
export const obtenerSesion = (opciones) => api.get('/auth/yo', opciones);
