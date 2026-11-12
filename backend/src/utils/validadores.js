// Validadores reutilizables. Cada regla devuelve un mensaje de error o null.
// validar() recorre un esquema y lanza HttpError 400 con { campo: mensaje } en `detalles`.
import { HttpError } from './HttpError.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const reglas = {
  requerido: (msg = 'Este campo es obligatorio.') => (v) =>
    v === undefined || v === null || String(v).trim() === '' ? msg : null,
  email: () => (v) => (v && !EMAIL.test(String(v).trim()) ? 'Introduce un correo electrónico válido.' : null),
  longitudMax: (n) => (v) => (v && String(v).trim().length > n ? `Máximo ${n} caracteres.` : null),
  longitudMin: (n, msg) => (v) => (v && String(v).length < n ? msg || `Mínimo ${n} caracteres.` : null),
  unoDe: (valores, msg = 'Valor no permitido.') => (v) => (v && !valores.includes(v) ? msg : null),
  url: () => (v) => {
    if (!v) return null;
    try {
      const u = new URL(String(v).trim());
      return ['http:', 'https:'].includes(u.protocol) ? null : 'La dirección debe empezar por http:// o https://.';
    } catch {
      return 'Introduce una dirección web válida (https://…).';
    }
  },
  telefono: () => (v) => (v && !/^\+?[0-9\s]{9,15}$/.test(String(v).trim()) ? 'Introduce un teléfono válido (9 a 15 cifras).' : null),
  numeroEntre: (min, max, msg) => (v) =>
    v !== undefined && v !== null && v !== '' && !(Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max) ? msg || `Debe estar entre ${min} y ${max}.` : null,
  enteroPositivo: (msg = 'Debe ser un número entero mayor que 0.') => (v) =>
    v !== undefined && v !== null && v !== '' && !(Number.isInteger(Number(v)) && Number(v) > 0) ? msg : null,
};

/**
 * @param {object} datos  Cuerpo de la petición
 * @param {object} esquema  { campo: [regla, regla, ...] }
 */
export function validar(datos = {}, esquema) {
  const errores = {};
  for (const [campo, lista] of Object.entries(esquema)) {
    for (const regla of lista) {
      const error = regla(datos[campo]);
      if (error) { errores[campo] = error; break; }
    }
  }
  if (Object.keys(errores).length) {
    throw new HttpError(400, 'Revisa los datos del formulario.', errores);
  }
}

export const limpiar = (v) => (typeof v === 'string' ? v.trim() : v);

/** Convierte '' y undefined en null (para campos opcionales). */
export const opcional = (v) => {
  const x = limpiar(v);
  return x === '' || x === undefined ? null : x;
};
