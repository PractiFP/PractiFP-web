// Enlaces de recuperación de contraseña (tabla RECUPERACIONES). Solo se guarda el hash del enlace.
import { query } from '../config/db.js';

/** ¿Se ha pedido un enlace para este usuario hace menos de `minutos`? */
export async function hayReciente(usuarioId, minutos) {
  const [fila] = await query(
    'SELECT 1 AS hay FROM RECUPERACIONES WHERE usuario_id = ? AND fecha > NOW() - INTERVAL ? MINUTE LIMIT 1',
    [usuarioId, minutos]
  );
  return Boolean(fila);
}

/** Crea un enlace nuevo y anula los anteriores del mismo usuario. */
export async function crear(usuarioId, tokenHash, minutosValidez) {
  await query('DELETE FROM RECUPERACIONES WHERE usuario_id = ?', [usuarioId]);
  await query(
    'INSERT INTO RECUPERACIONES (usuario_id, token_hash, caduca) VALUES (?, ?, NOW() + INTERVAL ? MINUTE)',
    [usuarioId, tokenHash, minutosValidez]
  );
}

/**
 * Comprueba el enlace dentro de una transacción y, si es válido, lo borra (solo se puede usar una vez).
 * Devuelve el id del usuario o null.
 */
export async function consumir(conn, tokenHash) {
  const [fila] = await conn.query(
    'SELECT usuario_id AS usuarioId FROM RECUPERACIONES WHERE token_hash = ? AND caduca > NOW() FOR UPDATE',
    [tokenHash]
  );
  if (!fila) return null;
  await conn.query('DELETE FROM RECUPERACIONES WHERE usuario_id = ?', [fila.usuarioId]);
  return fila.usuarioId;
}
