import * as Tecnologia from '../models/tecnologiaModel.js';

// GET /api/tecnologias
export async function listar(req, res) {
  res.json({ data: await Tecnologia.listar() });
}
