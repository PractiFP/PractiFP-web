// Puntuación de 1 a 5 en estrellas (solo lectura).
import Icono from './Icono.jsx';

export default function Estrellas({ valor, tamano = 16 }) {
  const redondeado = Math.round(valor);
  return (
    <span className="estrellas" role="img" aria-label={`${String(valor).replace('.', ',')} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Icono key={n} nombre="estrella" tamano={tamano} className={n <= redondeado ? 'llena' : ''} />)}
    </span>
  );
}
