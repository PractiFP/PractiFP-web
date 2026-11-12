import { api, obtenerArchivo } from './api.js';

export const miPerfil = (opciones) => api.get('/alumnos/yo', opciones);
export const actualizarMiPerfil = (datos) => api.put('/alumnos/yo', datos);

export function subirCv(archivo) {
  const datos = new FormData();
  datos.append('cv', archivo);
  return api.post('/alumnos/yo/cv', datos);
}
export const eliminarCv = () => api.delete('/alumnos/yo/cv');
export const obtenerCv = (alumnoId) => obtenerArchivo(`/alumnos/${alumnoId}/cv`);

export const guardarTecnologia = (tecnologiaId, nivel) => api.put(`/alumnos/yo/tecnologias/${tecnologiaId}`, { nivel });
export const quitarTecnologia = (tecnologiaId) => api.delete(`/alumnos/yo/tecnologias/${tecnologiaId}`);

export const perfilPublico = (id, opciones) => api.get(`/alumnos/${id}`, opciones);
