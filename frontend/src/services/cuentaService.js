import { api } from './api.js';

export const cambiarEmail = (email, password) => api.put('/cuenta/email', { email, password });
export const cambiarPassword = (actual, nueva) => api.put('/cuenta/password', { actual, nueva });
