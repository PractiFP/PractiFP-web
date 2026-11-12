import { api } from './api.js';

const consulta = (filtros) => new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== '' && v != null)).toString();

export const usuarios = (filtros, opciones) => api.get(`/admin/usuarios?${consulta(filtros)}`, opciones);
export const cambiarActivoUsuario = (id, activo) => api.patch(`/admin/usuarios/${id}/activo`, { activo });

export const empresas = (filtros, opciones) => api.get(`/admin/empresas?${consulta(filtros)}`, opciones);
export const cambiarVerificada = (id, verificada) => api.patch(`/admin/empresas/${id}/verificada`, { verificada });

export const ofertas = (filtros, opciones) => api.get(`/admin/ofertas?${consulta(filtros)}`, opciones);
export const cambiarActivaOferta = (id, activa) => api.patch(`/admin/ofertas/${id}/activa`, { activa });
export const eliminarOferta = (id) => api.delete(`/admin/ofertas/${id}`);

export const valoraciones = (estado, opciones) => api.get(`/admin/valoraciones?estado=${estado}`, opciones);
export const moderarValoracion = (id, estado) => api.patch(`/admin/valoraciones/${id}`, { estado });
export const eliminarValoracion = (id) => api.delete(`/admin/valoraciones/${id}`);
