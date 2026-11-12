// Consultas de resumen para los dashboards de cada rol.
import { query } from '../config/db.js';

const ESTADOS = ['ENVIADA', 'REVISADA', 'ENTREVISTA', 'ACEPTADA', 'RECHAZADA'];
const porEstado = (filas) => Object.fromEntries(ESTADOS.map((e) => [e, filas.find((f) => f.estado === e)?.n ?? 0]));

export async function resumenAlumno(alumnoId) {
  const [estados, [cuentas]] = await Promise.all([
    query('SELECT estado, COUNT(*) AS n FROM CANDIDATURAS WHERE alumno_id = ? GROUP BY estado', [alumnoId]),
    query(
      `SELECT (SELECT COUNT(*) FROM FAVORITOS WHERE alumno_id = ?)          AS favoritos,
              (SELECT COUNT(*) FROM PROYECTOS WHERE alumno_id = ?)          AS proyectos,
              (SELECT COUNT(*) FROM ALUMNO_TECNOLOGIA WHERE alumno_id = ?)  AS tecnologias,
              (SELECT cv_ruta IS NOT NULL FROM ALUMNOS WHERE id = ?)        AS tieneCv`,
      [alumnoId, alumnoId, alumnoId, alumnoId]
    ),
  ]);
  const candidaturas = porEstado(estados);
  return {
    candidaturas: { total: Object.values(candidaturas).reduce((s, n) => s + n, 0), porEstado: candidaturas },
    favoritos: cuentas.favoritos,
    proyectos: cuentas.proyectos,
    tecnologias: cuentas.tecnologias,
    tieneCv: Boolean(cuentas.tieneCv),
  };
}

export async function resumenEmpresa(empresaId) {
  const [[ofertas], estados, [valoraciones]] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(activa AND fecha_limite >= CURRENT_DATE), 0) AS abiertas
         FROM OFERTAS WHERE empresa_id = ?`,
      [empresaId]
    ),
    query(
      `SELECT c.estado, COUNT(*) AS n
         FROM CANDIDATURAS c JOIN OFERTAS o ON o.id = c.oferta_id
        WHERE o.empresa_id = ? GROUP BY c.estado`,
      [empresaId]
    ),
    query(
      `SELECT COUNT(*) AS total, ROUND(AVG(puntuacion), 1) AS media
         FROM VALORACIONES WHERE empresa_id = ? AND estado = 'APROBADA'`,
      [empresaId]
    ),
  ]);
  const candidaturas = porEstado(estados);
  return {
    ofertas: { total: ofertas.total, abiertas: Number(ofertas.abiertas) },
    candidaturas: { total: Object.values(candidaturas).reduce((s, n) => s + n, 0), porEstado: candidaturas },
    valoraciones: { total: valoraciones.total, media: valoraciones.media === null ? null : Number(valoraciones.media) },
  };
}

export async function resumenAdmin() {
  const [roles, [cuentas], estados] = await Promise.all([
    query('SELECT rol, COUNT(*) AS n, SUM(activo = FALSE) AS inactivos FROM USUARIOS GROUP BY rol'),
    query(
      `SELECT (SELECT COUNT(*) FROM EMPRESAS WHERE verificada = FALSE)                          AS empresasSinVerificar,
              (SELECT COUNT(*) FROM OFERTAS WHERE activa AND fecha_limite >= CURRENT_DATE)      AS ofertasAbiertas,
              (SELECT COUNT(*) FROM VALORACIONES WHERE estado = 'PENDIENTE')                    AS valoracionesPendientes`
    ),
    query('SELECT estado, COUNT(*) AS n FROM CANDIDATURAS GROUP BY estado'),
  ]);
  const usuarios = Object.fromEntries(['ALUMNO', 'EMPRESA', 'ADMIN'].map((r) => [r, roles.find((f) => f.rol === r)?.n ?? 0]));
  const candidaturas = porEstado(estados);
  return {
    usuarios: {
      total: Object.values(usuarios).reduce((s, n) => s + n, 0),
      porRol: usuarios,
      desactivados: roles.reduce((s, f) => s + Number(f.inactivos || 0), 0),
    },
    empresasSinVerificar: cuentas.empresasSinVerificar,
    ofertasAbiertas: cuentas.ofertasAbiertas,
    valoracionesPendientes: cuentas.valoracionesPendientes,
    candidaturas: { total: Object.values(candidaturas).reduce((s, n) => s + n, 0), porEstado: candidaturas },
  };
}
