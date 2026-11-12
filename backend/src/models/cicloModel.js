// Consultas sobre CICLOS.
import { query } from '../config/db.js';

export const listar = () => query('SELECT id, codigo, nombre FROM CICLOS ORDER BY codigo');

export async function existe(id) {
  const [fila] = await query('SELECT 1 AS existe FROM CICLOS WHERE id = ?', [id]);
  return Boolean(fila);
}
