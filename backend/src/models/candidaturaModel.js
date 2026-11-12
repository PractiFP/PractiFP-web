// Consultas sobre CANDIDATURAS.
import { query } from '../config/db.js';

export const ESTADOS = ['ENVIADA', 'REVISADA', 'ENTREVISTA', 'ACEPTADA', 'RECHAZADA'];

export async function crear(alumnoId, ofertaId) {
  const r = await query('INSERT INTO CANDIDATURAS (alumno_id, oferta_id) VALUES (?, ?)', [alumnoId, ofertaId]);
  return r.insertId;
}

export async function obtener(id) {
  const [fila] = await query(
    `SELECT c.id, c.alumno_id AS alumnoId, c.oferta_id AS ofertaId, c.estado, c.fecha_inscripcion AS fecha, o.empresa_id AS empresaId
       FROM CANDIDATURAS c JOIN OFERTAS o ON o.id = c.oferta_id
      WHERE c.id = ?`,
    [id]
  );
  return fila || null;
}

export async function deAlumnoEnOferta(alumnoId, ofertaId) {
  const [fila] = await query(
    'SELECT id, estado, fecha_inscripcion AS fecha FROM CANDIDATURAS WHERE alumno_id = ? AND oferta_id = ?',
    [alumnoId, ofertaId]
  );
  return fila || null;
}

/** Estado de las candidaturas del alumno en varias ofertas: { ofertaId: estado } */
export async function estadosDeAlumno(alumnoId, ofertaIds) {
  if (!ofertaIds.length) return {};
  const filas = await query('SELECT oferta_id AS ofertaId, estado FROM CANDIDATURAS WHERE alumno_id = ? AND oferta_id IN (?)', [alumnoId, ofertaIds]);
  return Object.fromEntries(filas.map((f) => [f.ofertaId, f.estado]));
}

/** Candidaturas del alumno con los datos de la oferta, la empresa y la fase actual. */
export function listarDeAlumno(alumnoId) {
  return query(
    `SELECT c.id, c.estado, c.fecha_inscripcion AS fecha,
            o.id AS ofertaId, o.titulo, o.localidad, o.modalidad, o.activa, o.fecha_limite AS fechaLimite,
            ci.codigo AS ciclo,
            e.id AS empresaId, e.nombre AS empresaNombre, e.verificada AS empresaVerificada,
            f.nombre AS faseNombre, f.orden AS faseOrden,
            (SELECT COUNT(*) FROM FASES_SELECCION fs WHERE fs.oferta_id = o.id) AS totalFases,
            (SELECT v.estado FROM VALORACIONES v WHERE v.alumno_id = c.alumno_id AND v.empresa_id = e.id) AS miValoracion
       FROM CANDIDATURAS c
       JOIN OFERTAS o   ON o.id = c.oferta_id
       JOIN CICLOS ci   ON ci.id = o.ciclo_id
       JOIN EMPRESAS e  ON e.id = o.empresa_id
       LEFT JOIN FASES_SELECCION f ON f.id = c.fase_actual_id
      WHERE c.alumno_id = ?
      ORDER BY c.fecha_inscripcion DESC`,
    [alumnoId]
  ).then((filas) => filas.map((f) => ({
    id: f.id, estado: f.estado, fecha: f.fecha,
    oferta: { id: f.ofertaId, titulo: f.titulo, localidad: f.localidad, modalidad: f.modalidad, activa: Boolean(f.activa), fechaLimite: f.fechaLimite, ciclo: f.ciclo },
    empresa: { id: f.empresaId, nombre: f.empresaNombre, verificada: Boolean(f.empresaVerificada) },
    faseActual: f.faseNombre ? { nombre: f.faseNombre, orden: f.faseOrden } : null,
    totalFases: f.totalFases,
    miValoracion: f.miValoracion,
  })));
}

/**
 * Candidatos de las ofertas de una empresa. Incluye cuántas tecnologías obligatorias
 * de la oferta conoce cada alumno.
 */
export async function listarDeEmpresa(empresaId, { ofertaId, estado } = {}) {
  const condiciones = ['o.empresa_id = ?'];
  const params = [empresaId];
  if (ofertaId) { condiciones.push('o.id = ?'); params.push(ofertaId); }
  if (estado) { condiciones.push('c.estado = ?'); params.push(estado); }
  const filas = await query(
    `SELECT c.id, c.estado, c.fecha_inscripcion AS fecha, c.fase_actual_id AS faseActualId,
            o.id AS ofertaId, o.titulo AS ofertaTitulo,
            a.id AS alumnoId, a.nombre, a.apellidos, a.localidad, a.cv_ruta IS NOT NULL AS tieneCv, ci.codigo AS ciclo,
            (SELECT COUNT(*) FROM OFERTA_TECNOLOGIA ot WHERE ot.oferta_id = o.id AND ot.obligatoria = TRUE) AS obligatorias,
            (SELECT COUNT(*) FROM OFERTA_TECNOLOGIA ot
               JOIN ALUMNO_TECNOLOGIA at ON at.tecnologia_id = ot.tecnologia_id AND at.alumno_id = a.id
              WHERE ot.oferta_id = o.id AND ot.obligatoria = TRUE) AS obligatoriasQueTiene
       FROM CANDIDATURAS c
       JOIN OFERTAS o  ON o.id = c.oferta_id
       JOIN ALUMNOS a  ON a.id = c.alumno_id
       LEFT JOIN CICLOS ci ON ci.id = a.ciclo_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY FIELD(c.estado, 'ENVIADA', 'REVISADA', 'ENTREVISTA', 'ACEPTADA', 'RECHAZADA'), c.fecha_inscripcion DESC`,
    params
  );
  return filas.map((f) => ({
    id: f.id, estado: f.estado, fecha: f.fecha, faseActualId: f.faseActualId,
    oferta: { id: f.ofertaId, titulo: f.ofertaTitulo },
    alumno: { id: f.alumnoId, nombre: f.nombre, apellidos: f.apellidos, localidad: f.localidad, ciclo: f.ciclo, tieneCv: Boolean(f.tieneCv) },
    coincidencia: { obligatorias: f.obligatorias, tiene: f.obligatoriasQueTiene },
  }));
}

export async function cambiarEstado(id, estado) {
  await query('UPDATE CANDIDATURAS SET estado = ? WHERE id = ?', [estado, id]);
}

export async function cambiarFase(id, faseId) {
  await query('UPDATE CANDIDATURAS SET fase_actual_id = ? WHERE id = ?', [faseId, id]);
}
