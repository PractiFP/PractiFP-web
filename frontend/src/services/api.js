// Cliente HTTP común para hablar con la API REST.
// - Añade el token JWT si existe.
// - Devuelve directamente `data` o lanza un ApiError con el mensaje del backend.

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CLAVE_TOKEN = 'practifp_token';

export class ApiError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export const EVENTO_SESION_CADUCADA = 'practifp:sesion-caducada';

export function obtenerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}
export function guardarToken(token) {
  try { localStorage.setItem(CLAVE_TOKEN, token); } catch { /* almacenamiento no disponible */ }
}
export function borrarToken() {
  try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* almacenamiento no disponible */ }
}

export async function peticion(ruta, { metodo = 'GET', cuerpo, cabeceras = {}, signal } = {}) {
  const headers = { Accept: 'application/json', ...cabeceras };
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const esFormData = cuerpo instanceof FormData;
  if (cuerpo !== undefined && !esFormData) headers['Content-Type'] = 'application/json';

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esFormData ? cuerpo : JSON.stringify(cuerpo),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'No se puede conectar con el servidor. Comprueba que el backend está arrancado.');
  }

  const json = await respuesta.json().catch(() => null);
  // Si la petición se canceló mientras se leía la respuesta, no se devuelve nada a medias
  if (signal?.aborted) throw new DOMException('Petición cancelada', 'AbortError');
  // Respuesta sin el formato de nuestra API (p. ej. el proxy no alcanza el backend)
  if (!respuesta.ok && !json?.error) {
    throw new ApiError(0, 'No se puede conectar con el servidor. Comprueba que el backend está arrancado.');
  }
  if (!respuesta.ok) {
    // Token caducado o no válido: se avisa a AuthContext para cerrar la sesión
    if (respuesta.status === 401 && token) window.dispatchEvent(new CustomEvent(EVENTO_SESION_CADUCADA, { detail: json?.error?.mensaje }));
    throw new ApiError(respuesta.status, json?.error?.mensaje || `Error ${respuesta.status}`, json?.error?.detalles);
  }
  return json?.data;
}

/** Descarga un archivo protegido (p. ej. un currículum) y lo devuelve como Blob. */
export async function obtenerArchivo(ruta) {
  const token = obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(0, 'No se puede conectar con el servidor.');
  }
  if (!respuesta.ok) {
    const json = await respuesta.json().catch(() => null);
    if (respuesta.status === 401 && token) window.dispatchEvent(new CustomEvent(EVENTO_SESION_CADUCADA, { detail: json?.error?.mensaje }));
    throw new ApiError(respuesta.status, json?.error?.mensaje || `Error ${respuesta.status}`);
  }
  return respuesta.blob();
}

export const api = {
  get: (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'GET' }),
  post: (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'PATCH', cuerpo }),
  delete: (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'DELETE' }),
};
