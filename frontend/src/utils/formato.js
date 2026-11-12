// Textos y formatos comunes.
export const NIVELES = [
  { valor: 'BASICO', texto: 'Básico' },
  { valor: 'INTERMEDIO', texto: 'Intermedio' },
  { valor: 'AVANZADO', texto: 'Avanzado' },
];
export const textoNivel = (nivel) => NIVELES.find((n) => n.valor === nivel)?.texto ?? nivel;

export const textoCurso = (curso) => (curso ? `${curso}.º curso` : null);

export const iniciales = (texto = '') => texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const MB = 1024 * 1024;

export const MODALIDADES = [
  { valor: 'PRESENCIAL', texto: 'Presencial' },
  { valor: 'HIBRIDA', texto: 'Híbrida' },
  { valor: 'REMOTA', texto: 'Remota' },
];
export const textoModalidad = (m) => MODALIDADES.find((x) => x.valor === m)?.texto ?? m;

const fecha = (f) => new Date(`${f}T00:00:00`);
export const formatearFecha = (f, corta = false) =>
  f ? fecha(f).toLocaleDateString('es-ES', corta ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const hoyISO = () => new Date().toLocaleDateString('sv-SE');

/** Días que faltan hasta una fecha (0 = hoy, negativo = ya pasó). */
export const diasHasta = (f) => Math.round((fecha(f) - fecha(hoyISO())) / 864e5);

export const textoSalario = (oferta) =>
  oferta.remunerada ? `${Number(oferta.salario).toLocaleString('es-ES')} €/mes` : 'No remunerada';

export const textoPlazas = (n) => `${n} ${n === 1 ? 'plaza' : 'plazas'}`;

// Color estable para el logotipo de cada empresa
const COLORES_EMPRESA = ['#0E5E5B', '#B4532A', '#2E5AAC', '#7A4FA0', '#3F7D3A', '#A23B5B', '#8A6A12', '#24707F'];
export const colorEmpresa = (id) => COLORES_EMPRESA[(Number(id) || 0) % COLORES_EMPRESA.length];

export const ESTADOS_CANDIDATURA = [
  { valor: 'ENVIADA', texto: 'Enviada' },
  { valor: 'REVISADA', texto: 'Revisada' },
  { valor: 'ENTREVISTA', texto: 'Entrevista' },
  { valor: 'ACEPTADA', texto: 'Aceptada' },
  { valor: 'RECHAZADA', texto: 'Rechazada' },
];

/** Fecha y hora (DATETIME de MariaDB: 'YYYY-MM-DD HH:MM:SS'). */
export const formatearFechaHora = (f) => (f ? formatearFecha(String(f).slice(0, 10)) : '');
