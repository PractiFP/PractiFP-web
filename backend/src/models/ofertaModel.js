// Consultas sobre OFERTAS y OFERTA_TECNOLOGIA (siempre parametrizadas).
import { query } from '../config/db.js';

// Una oferta está "abierta" si está activa y no ha pasado su fecha límite
const ABIERTA = '(o.activa = TRUE AND o.fecha_limite >= CURRENT_DATE)';

const COLUMNAS = `
  o.id, o.titulo, o.descripcion, o.localidad, o.modalidad, o.remunerada, o.salario, o.plazas,
  o.fecha_publicacion AS fechaPublicacion, o.fecha_limite AS fechaLimite, o.activa, ${ABIERTA} AS abierta,
  c.id AS cicloId, c.codigo AS cicloCodigo, c.nombre AS cicloNombre,
  e.id AS empresaId, e.nombre AS empresaNombre, e.localidad AS empresaLocalidad, e.verificada AS empresaVerificada`;

const DESDE = `
  FROM OFERTAS o
  JOIN CICLOS c   ON c.id = o.ciclo_id
  JOIN EMPRESAS e ON e.id = o.empresa_id
  JOIN USUARIOS u ON u.id = e.usuario_id`;

function aOferta(f) {
  return {
    id: f.id, titulo: f.titulo, descripcion: f.descripcion, localidad: f.localidad, modalidad: f.modalidad,
    remunerada: Boolean(f.remunerada), salario: f.salario, plazas: f.plazas,
    fechaPublicacion: f.fechaPublicacion, fechaLimite: f.fechaLimite, activa: Boolean(f.activa), abierta: Boolean(f.abierta),
    ciclo: { id: f.cicloId, codigo: f.cicloCodigo, nombre: f.cicloNombre },
    empresa: { id: f.empresaId, nombre: f.empresaNombre, localidad: f.empresaLocalidad, verificada: Boolean(f.empresaVerificada) },
  };
}

/** Añade a cada oferta su lista de tecnologías (una sola consulta para todas). */
async function conTecnologias(ofertas) {
  if (!ofertas.length) return ofertas;
  const filas = await query(
    `SELECT ot.oferta_id AS ofertaId, t.id, t.nombre, ot.obligatoria
       FROM OFERTA_TECNOLOGIA ot JOIN TECNOLOGIAS t ON t.id = ot.tecnologia_id
      WHERE ot.oferta_id IN (?)
      ORDER BY ot.obligatoria DESC, t.nombre`,
    [ofertas.map((o) => o.id)]
  );
  return ofertas.map((o) => ({
    ...o,
    tecnologias: filas.filter((f) => f.ofertaId === o.id).map((f) => ({ id: f.id, nombre: f.nombre, obligatoria: Boolean(f.obligatoria) })),
  }));
}

const escaparLike = (texto) => `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * Búsqueda pública con filtros combinables. Solo ofertas de empresas con la cuenta activa.
 * @param {object} f { q, cicloId, localidad, modalidad, remunerada, empresaId, tecnologias[], soloAbiertas, limite, desplazamiento }
 */
export async function buscar(f) {
  const condiciones = ['u.activo = TRUE'];
  const params = [];

  if (f.soloAbiertas) condiciones.push(ABIERTA);
  if (f.q) {
    condiciones.push('(o.titulo LIKE ? OR o.descripcion LIKE ? OR e.nombre LIKE ?)');
    const patron = escaparLike(f.q);
    params.push(patron, patron, patron);
  }
  if (f.cicloId) { condiciones.push('o.ciclo_id = ?'); params.push(f.cicloId); }
  if (f.localidad) { condiciones.push('o.localidad = ?'); params.push(f.localidad); }
  if (f.modalidad) { condiciones.push('o.modalidad = ?'); params.push(f.modalidad); }
  if (f.remunerada !== null && f.remunerada !== undefined) { condiciones.push('o.remunerada = ?'); params.push(f.remunerada); }
  if (f.empresaId) { condiciones.push('o.empresa_id = ?'); params.push(f.empresaId); }
  // Cada tecnología elegida debe estar en la oferta (se combinan con "y")
  for (const tecnologiaId of f.tecnologias || []) {
    condiciones.push('EXISTS (SELECT 1 FROM OFERTA_TECNOLOGIA ot WHERE ot.oferta_id = o.id AND ot.tecnologia_id = ?)');
    params.push(tecnologiaId);
  }

  const donde = `WHERE ${condiciones.join(' AND ')}`;
  const [{ total }] = await query(`SELECT COUNT(*) AS total ${DESDE} ${donde}`, params);
  const filas = await query(
    `SELECT ${COLUMNAS} ${DESDE} ${donde}
      ORDER BY ${ABIERTA} DESC, o.fecha_publicacion DESC, o.id DESC
      LIMIT ? OFFSET ?`,
    [...params, f.limite, f.desplazamiento]
  );
  return { total, ofertas: await conTecnologias(filas.map(aOferta)) };
}

/** Una oferta con sus tecnologías, o null. Incluye si la cuenta de la empresa está activa. */
export async function obtener(id) {
  const [fila] = await query(`SELECT ${COLUMNAS}, u.activo AS empresaActiva ${DESDE} WHERE o.id = ?`, [id]);
  if (!fila) return null;
  const [oferta] = await conTecnologias([aOferta(fila)]);
  return { ...oferta, empresaActiva: Boolean(fila.empresaActiva) };
}

/** Todas las ofertas de una empresa (también inactivas), con su número de candidaturas. */
export async function listarDeEmpresa(empresaId) {
  const filas = await query(
    `SELECT ${COLUMNAS},
            (SELECT COUNT(*) FROM CANDIDATURAS ca WHERE ca.oferta_id = o.id) AS candidaturas,
            (SELECT COUNT(*) FROM CANDIDATURAS ca WHERE ca.oferta_id = o.id AND ca.estado = 'ENVIADA') AS sinRevisar
       ${DESDE} WHERE o.empresa_id = ?
      ORDER BY o.fecha_publicacion DESC, o.id DESC`,
    [empresaId]
  );
  const ofertas = await conTecnologias(filas.map(aOferta));
  return ofertas.map((o, i) => ({ ...o, candidaturas: filas[i].candidaturas, sinRevisar: filas[i].sinRevisar }));
}

export async function contarCandidaturas(ofertaId) {
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM CANDIDATURAS WHERE oferta_id = ?', [ofertaId]);
  return n;
}

export async function obtenerEmpresaId(ofertaId) {
  const [fila] = await query('SELECT empresa_id AS empresaId, fecha_publicacion AS fechaPublicacion FROM OFERTAS WHERE id = ?', [ofertaId]);
  return fila || null;
}

export async function crear(conn, empresaId, d) {
  const r = await conn.query(
    `INSERT INTO OFERTAS (empresa_id, titulo, descripcion, ciclo_id, localidad, modalidad, remunerada, salario, plazas, fecha_limite, activa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [empresaId, d.titulo, d.descripcion, d.cicloId, d.localidad, d.modalidad, d.remunerada, d.salario, d.plazas, d.fechaLimite, d.activa]
  );
  return r.insertId;
}

export async function actualizar(conn, id, d) {
  await conn.query(
    `UPDATE OFERTAS SET titulo = ?, descripcion = ?, ciclo_id = ?, localidad = ?, modalidad = ?, remunerada = ?, salario = ?,
            plazas = ?, fecha_limite = ?, activa = ?
      WHERE id = ?`,
    [d.titulo, d.descripcion, d.cicloId, d.localidad, d.modalidad, d.remunerada, d.salario, d.plazas, d.fechaLimite, d.activa, id]
  );
}

/** Sustituye las tecnologías de la oferta por la lista indicada. */
export async function guardarTecnologias(conn, ofertaId, tecnologias) {
  await conn.query('DELETE FROM OFERTA_TECNOLOGIA WHERE oferta_id = ?', [ofertaId]);
  if (tecnologias.length) {
    await conn.batch(
      'INSERT INTO OFERTA_TECNOLOGIA (oferta_id, tecnologia_id, obligatoria) VALUES (?, ?, ?)',
      tecnologias.map((t) => [ofertaId, t.id, t.obligatoria])
    );
  }
}

export async function cambiarActiva(id, activa) {
  await query('UPDATE OFERTAS SET activa = ? WHERE id = ?', [activa, id]);
}

/** Elimina la oferta; las claves foráneas borran en cascada sus tecnologías, fases, candidaturas y favoritos. */
export async function eliminar(id) {
  await query('DELETE FROM OFERTAS WHERE id = ?', [id]);
}

/** Localidades con ofertas abiertas (para el filtro de búsqueda). */
export function localidadesConOfertas() {
  return query(
    `SELECT o.localidad AS nombre, COUNT(*) AS ofertas ${DESDE}
      WHERE u.activo = TRUE AND ${ABIERTA}
      GROUP BY o.localidad ORDER BY o.localidad`
  );
}

/** Varias ofertas por id (con tecnologías), en el orden indicado. Solo de empresas con la cuenta activa. */
export async function obtenerVarias(ids) {
  if (!ids.length) return [];
  const filas = await query(`SELECT ${COLUMNAS} ${DESDE} WHERE o.id IN (?) AND u.activo = TRUE`, [ids]);
  const ofertas = await conTecnologias(filas.map(aOferta));
  return ids.map((id) => ofertas.find((o) => o.id === id)).filter(Boolean);
}
