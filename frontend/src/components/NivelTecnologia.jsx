// Tres segmentos que representan el nivel de conocimiento.
import { textoNivel } from '../utils/formato.js';

const PASOS = { BASICO: 1, INTERMEDIO: 2, AVANZADO: 3 };

export default function NivelTecnologia({ nivel, conTexto = false }) {
  const n = PASOS[nivel] || 1;
  return (
    <span className="nivel" title={textoNivel(nivel)}>
      {conTexto && <span className="nivel__texto">{textoNivel(nivel)}</span>}
      <span className="nivel__barras" aria-hidden="true">
        {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'activo' : ''} />)}
      </span>
      {!conTexto && <span className="visualmente-oculto">{textoNivel(nivel)}</span>}
    </span>
  );
}
