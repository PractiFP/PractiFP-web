import { pool } from './db.js';

export const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];
export const MODALIDADES = ['Presencial', 'Híbrida', 'Remota'];
export const ESTADOS = ['Pendiente', 'En revisión', 'Entrevista', 'Aceptada', 'Rechazada'];

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (m) => new HttpError(400, m);

// "Java, java, SQL" -> ['Java', 'SQL'] (sin duplicados, máx. 30)
export function limpiar(v) {
  const m = new Map();
  (Array.isArray(v) ? v : String(v || '').split(','))
    .map((x) => String(x).trim().slice(0, 40))
    .filter(Boolean)
    .forEach((x) => { if (!m.has(x.toLowerCase())) m.set(x.toLowerCase(), x); });
  return [...m.values()].slice(0, 30);
}

// Ejecuta fn dentro de una transacción
export async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const r = await fn(c);
    await c.commit();
    return r;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

// Reemplaza las tecnologías de una oferta/alumno (tabla N:M). tabla/colId son constantes internas.
export async function guardarTecnologias(c, tabla, colId, id, nombres) {
  await c.query(`DELETE FROM ${tabla} WHERE ${colId} = ?`, [id]);
  for (const n of limpiar(nombres)) {
    await c.query('INSERT IGNORE INTO tecnologia (nombre) VALUES (?)', [n]);
    await c.query(
      `INSERT INTO ${tabla} (${colId}, id_tecnologia) SELECT ?, id FROM tecnologia WHERE nombre = ?`,
      [id, n]
    );
  }
}

export async function techsAlumno(id) {
  const [r] = await pool.query(
    'SELECT t.nombre FROM alumno_tecnologia x JOIN tecnologia t ON t.id = x.id_tecnologia WHERE x.id_alumno = ? ORDER BY t.nombre',
    [id]
  );
  return r.map((x) => x.nombre);
}

// Usuario + datos de su perfil (alumno o empresa)
export async function usuarioCompleto(id) {
  const [[u]] = await pool.query('SELECT id, nombre, email, rol, bloqueado FROM usuario WHERE id = ?', [id]);
  if (!u) return null;
  if (u.rol === 'alumno') {
    const [[a]] = await pool.query('SELECT ciclo, curso, centro, cv_nombre FROM alumno WHERE id_usuario = ?', [id]);
    Object.assign(u, a, { tecnologias: await techsAlumno(id) });
  }
  if (u.rol === 'empresa') {
    const [[e]] = await pool.query('SELECT descripcion, web, localidad, latitud, longitud FROM empresa WHERE id_usuario = ?', [id]);
    const [c] = await pool.query('SELECT ciclo FROM empresa_ciclo WHERE id_empresa = ?', [id]);
    Object.assign(u, e, { ciclos: c.map((x) => x.ciclo) });
  }
  return u;
}

// SELECT base de ofertas (las tecnologías se agrupan con una subconsulta)
export const selOferta = (extra = '') => `
  SELECT o.id, o.id_empresa, u.nombre AS empresa, o.titulo, o.descripcion, o.ciclo, o.localidad,
         o.remunerada, o.modalidad, o.plazas, o.activa, o.fecha_publicacion,
         o.fases_seleccion, o.duracion_proceso, o.proceso_cerrado,
         (SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ',')
            FROM oferta_tecnologia ot JOIN tecnologia t ON t.id = ot.id_tecnologia
           WHERE ot.id_oferta = o.id) AS techs ${extra}
    FROM oferta o JOIN usuario u ON u.id = o.id_empresa`;

// Extra para alumnos: ¿la tiene en favoritos? ¿ya se ha inscrito? (2 parámetros: id_alumno x2)
export const FLAGS = `,
  EXISTS(SELECT 1 FROM favorito f WHERE f.id_alumno = ? AND f.id_oferta = o.id) AS favorita,
  EXISTS(SELECT 1 FROM candidatura c WHERE c.id_alumno = ? AND c.id_oferta = o.id) AS inscrita`;

// Compatibilidad = % de tecnologías de la oferta que el alumno conoce
export function fmtOferta(r, mine = []) {
  const techs = r.techs ? r.techs.split(',') : [];
  const set = new Set(mine.map((x) => x.toLowerCase()));
  return {
    ...r,
    techs,
    remunerada: !!r.remunerada,
    activa: !!r.activa,
    proceso_cerrado: !!r.proceso_cerrado,
    favorita: !!r.favorita,
    inscrita: !!r.inscrita,
    compatibilidad: techs.length
      ? Math.round((techs.filter((t) => set.has(t.toLowerCase())).length / techs.length) * 100)
      : 0,
  };
}
