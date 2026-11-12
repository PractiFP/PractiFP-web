import * as Ciclo from '../models/cicloModel.js';

// GET /api/ciclos
export async function listar(req, res) {
  res.json({ data: await Ciclo.listar() });
}
