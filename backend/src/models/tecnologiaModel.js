// Consultas sobre TECNOLOGIAS.
import { query } from '../config/db.js';

export const listar = () => query('SELECT id, nombre FROM TECNOLOGIAS ORDER BY nombre');

export async function existe(id) {
  const [fila] = await query('SELECT 1 AS existe FROM TECNOLOGIAS WHERE id = ?', [id]);
  return Boolean(fila);
}
