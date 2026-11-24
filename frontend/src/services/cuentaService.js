import { api, peticion } from './api.js';

export const cambiarEmail = (email, password) => api.put('/cuenta/email', { email, password });
// Devuelve { token } nuevo: las sesiones abiertas en otros dispositivos se cierran
export const cambiarPassword = (actual, nueva) => api.put('/cuenta/password', { actual, nueva });
export const descargarDatos = () => api.get('/cuenta/datos');
export const eliminarCuenta = (password) => peticion('/cuenta', { metodo: 'DELETE', cuerpo: { password } });
