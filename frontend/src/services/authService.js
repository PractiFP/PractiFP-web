import { api } from './api.js';

export const registrar = (datos) => api.post('/auth/registro', datos);
export const iniciarSesion = (email, password) => api.post('/auth/login', { email, password });
export const obtenerSesion = (opciones) => api.get('/auth/yo', opciones);
export const solicitarRecuperacion = (email) => api.post('/auth/recuperar', { email });
export const restablecerPassword = (token, password) => api.post('/auth/restablecer', { token, password });
