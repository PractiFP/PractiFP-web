// Comprueba el estado de la API y de la base de datos.
import { query, comprobarConexion } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';

export async function obtenerSalud(req, res) {
  const inicio = Date.now();
  let version, registros;
  try {
    version = await comprobarConexion();
    [registros] = await query(`
      SELECT
        (SELECT COUNT(*) FROM USUARIOS)                      AS usuarios,
        (SELECT COUNT(*) FROM ALUMNOS)                       AS alumnos,
        (SELECT COUNT(*) FROM EMPRESAS)                      AS empresas,
        (SELECT COUNT(*) FROM OFERTAS WHERE activa = TRUE)   AS ofertasActivas,
        (SELECT COUNT(*) FROM CANDIDATURAS)                  AS candidaturas,
        (SELECT COUNT(*) FROM TECNOLOGIAS)                   AS tecnologias`);
  } catch (err) {
    console.error('Error comprobando la base de datos:', err.message);
    throw new HttpError(503, 'No se puede conectar con la base de datos.');
  }

  res.json({
    data: {
      api: 'ok',
      fecha: new Date().toISOString(),
      baseDatos: { conectada: true, version, latenciaMs: Date.now() - inicio, registros },
    },
  });
}
