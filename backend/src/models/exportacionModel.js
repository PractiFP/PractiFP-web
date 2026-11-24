// Consultas para "Descargar mis datos" (derecho de acceso y portabilidad del RGPD).
// Solo se incluyen los datos del propio usuario, nunca los de otras personas.
import { query } from '../config/db.js';

export async function cuenta(usuarioId) {
  const [fila] = await query(
    `SELECT email, rol, activo, fecha_registro AS fechaRegistro, privacidad_aceptada AS privacidadAceptada
       FROM USUARIOS WHERE id = ?`,
    [usuarioId]
  );
  return fila ? { ...fila, activo: Boolean(fila.activo) } : null;
}

export async function alumno(alumnoId) {
  const [perfil] = await query(
    `SELECT a.nombre, a.apellidos, c.codigo AS ciclo, c.nombre AS cicloNombre, a.curso, a.centro, a.localidad,
            a.descripcion, a.cv_ruta IS NOT NULL AS tieneCv
       FROM ALUMNOS a LEFT JOIN CICLOS c ON c.id = a.ciclo_id WHERE a.id = ?`,
    [alumnoId]
  );
  const tecnologias = await query(
    `SELECT t.nombre, at.nivel FROM ALUMNO_TECNOLOGIA at JOIN TECNOLOGIAS t ON t.id = at.tecnologia_id
      WHERE at.alumno_id = ? ORDER BY t.nombre`,
    [alumnoId]
  );
  const proyectos = await query(
    `SELECT p.titulo, p.descripcion, p.url_github AS urlGithub, p.url_demo AS urlDemo, p.fecha_creacion AS fechaCreacion,
            p.imagen_ruta IS NOT NULL AS tieneImagen,
            (SELECT GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ', ')
               FROM PROYECTO_TECNOLOGIA pt JOIN TECNOLOGIAS t ON t.id = pt.tecnologia_id WHERE pt.proyecto_id = p.id) AS tecnologias
       FROM PROYECTOS p WHERE p.alumno_id = ? ORDER BY p.fecha_creacion DESC`,
    [alumnoId]
  );
  const candidaturas = await query(
    `SELECT o.titulo AS oferta, e.nombre AS empresa, c.fecha_inscripcion AS fechaInscripcion, c.estado,
            f.nombre AS faseActual
       FROM CANDIDATURAS c
       JOIN OFERTAS o ON o.id = c.oferta_id
       JOIN EMPRESAS e ON e.id = o.empresa_id
       LEFT JOIN FASES_SELECCION f ON f.id = c.fase_actual_id
      WHERE c.alumno_id = ? ORDER BY c.fecha_inscripcion DESC`,
    [alumnoId]
  );
  const favoritos = await query(
    `SELECT o.titulo AS oferta, e.nombre AS empresa, fv.fecha_guardado AS fechaGuardado
       FROM FAVORITOS fv JOIN OFERTAS o ON o.id = fv.oferta_id JOIN EMPRESAS e ON e.id = o.empresa_id
      WHERE fv.alumno_id = ? ORDER BY fv.fecha_guardado DESC`,
    [alumnoId]
  );
  const valoraciones = await query(
    `SELECT e.nombre AS empresa, v.puntuacion, v.comentario, v.fecha, v.estado
       FROM VALORACIONES v JOIN EMPRESAS e ON e.id = v.empresa_id
      WHERE v.alumno_id = ? ORDER BY v.fecha DESC`,
    [alumnoId]
  );
  return {
    perfil: perfil ? { ...perfil, tieneCv: Boolean(perfil.tieneCv) } : null,
    tecnologias,
    proyectos: proyectos.map((p) => ({ ...p, tieneImagen: Boolean(p.tieneImagen) })),
    candidaturas,
    favoritos,
    valoracionesEscritas: valoraciones,
  };
}

export async function empresa(empresaId) {
  const [perfil] = await query(
    `SELECT nombre, descripcion, web, telefono, direccion, localidad, latitud, longitud, verificada
       FROM EMPRESAS WHERE id = ?`,
    [empresaId]
  );
  const ofertas = await query(
    `SELECT o.titulo, o.descripcion, c.codigo AS ciclo, o.localidad, o.modalidad, o.remunerada, o.salario, o.plazas,
            o.fecha_publicacion AS fechaPublicacion, o.fecha_limite AS fechaLimite, o.activa,
            (SELECT COUNT(*) FROM CANDIDATURAS ca WHERE ca.oferta_id = o.id) AS candidaturasRecibidas
       FROM OFERTAS o JOIN CICLOS c ON c.id = o.ciclo_id
      WHERE o.empresa_id = ? ORDER BY o.fecha_publicacion DESC`,
    [empresaId]
  );
  return {
    perfil: perfil ? { ...perfil, verificada: Boolean(perfil.verificada) } : null,
    ofertas: ofertas.map((o) => ({ ...o, remunerada: Boolean(o.remunerada), activa: Boolean(o.activa) })),
  };
}

/** Archivos subidos por el alumno (para borrarlos con la cuenta). */
export async function archivosDeAlumno(alumnoId) {
  const filas = await query(
    `SELECT cv_ruta AS nombre FROM ALUMNOS WHERE id = ? AND cv_ruta IS NOT NULL
     UNION ALL
     SELECT imagen_ruta FROM PROYECTOS WHERE alumno_id = ? AND imagen_ruta IS NOT NULL`,
    [alumnoId, alumnoId]
  );
  return filas.map((f) => f.nombre);
}
