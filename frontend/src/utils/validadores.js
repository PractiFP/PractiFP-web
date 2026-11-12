// Validación en el navegador. Las mismas reglas se aplican de nuevo en el backend.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_MIN = 8;

export const reglas = {
  requerido: (msg = 'Este campo es obligatorio.') => (v) => (v === undefined || v === null || String(v).trim() === '' ? msg : null),
  email: () => (v) => (v && !EMAIL.test(String(v).trim()) ? 'Introduce un correo electrónico válido.' : null),
  longitudMin: (n, msg) => (v) => (v && String(v).length < n ? msg || `Mínimo ${n} caracteres.` : null),
  longitudMax: (n) => (v) => (v && String(v).trim().length > n ? `Máximo ${n} caracteres.` : null),
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
  ambosONinguno: (otro, msg) => (v, datos) => (!v && datos[otro] ? msg : null),
  distintoDe: (otro, msg) => (v, datos) => (v && v === datos[otro] ? msg : null),
  igualA: (otro, msg) => (v, datos) => (v !== datos[otro] ? msg : null),
};

/** Devuelve { campo: mensaje } con el primer error de cada campo (vacío si todo es correcto). */
export function validar(datos, esquema) {
  const errores = {};
  for (const [campo, lista] of Object.entries(esquema)) {
    for (const regla of lista) {
      const error = regla(datos[campo], datos);
      if (error) { errores[campo] = error; break; }
    }
  }
  return errores;
}
