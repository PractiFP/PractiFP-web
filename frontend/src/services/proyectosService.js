import { api, BASE_URL } from './api.js';

/** Los proyectos se envían como formulario multipart para poder adjuntar la imagen. */
function aFormulario(datos, imagen, quitarImagen) {
  const fd = new FormData();
  for (const [clave, valor] of Object.entries(datos)) fd.append(clave, clave === 'tecnologias' ? JSON.stringify(valor) : valor ?? '');
  if (imagen) fd.append('imagen', imagen);
  if (quitarImagen) fd.append('quitarImagen', 'true');
  return fd;
}

export const misProyectos = (opciones) => api.get('/alumnos/yo/proyectos', opciones);
export const crearProyecto = (datos, imagen) => api.post('/alumnos/yo/proyectos', aFormulario(datos, imagen));
export const actualizarProyecto = (id, datos, imagen, quitarImagen) => api.put(`/proyectos/${id}`, aFormulario(datos, imagen, quitarImagen));
export const eliminarProyecto = (id) => api.delete(`/proyectos/${id}`);
/** `version` fuerza a recargar la imagen después de cambiarla. */
export const urlImagenProyecto = (id, version = '') => `${BASE_URL}/proyectos/${id}/imagen${version ? `?v=${version}` : ''}`;
