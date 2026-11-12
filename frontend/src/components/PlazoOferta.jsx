// Indica si la oferta está abierta y cuánto falta para que cierre.
import { diasHasta, formatearFecha } from '../utils/formato.js';
import Icono from './Icono.jsx';

export default function PlazoOferta({ oferta }) {
  if (!oferta.activa) return <span className="plazo plazo--cerrada">Inactiva</span>;
  const dias = diasHasta(oferta.fechaLimite);
  if (dias < 0) return <span className="plazo plazo--cerrada">Plazo cerrado</span>;
  const texto = dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : `Cierra en ${dias} días`;
  return (
    <span className={`plazo ${dias <= 7 ? 'plazo--pronto' : ''}`} title={`Inscripción hasta el ${formatearFecha(oferta.fechaLimite)}`}>
      <Icono nombre="reloj" tamano={15} /> {texto}
    </span>
  );
}
