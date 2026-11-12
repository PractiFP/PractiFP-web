// Selector de puntuación accesible (grupo de botones de opción con forma de estrella).
import Icono from './Icono.jsx';

const TEXTOS = ['', 'Muy mala', 'Mala', 'Normal', 'Buena', 'Excelente'];

export default function SelectorEstrellas({ valor, onCambiar, error }) {
  return (
    <fieldset className="selector-estrellas">
      <legend>Puntuación</legend>
      <div className="selector-estrellas__opciones">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} title={TEXTOS[n]}>
            <input type="radio" name="puntuacion" value={n} checked={valor === n} onChange={() => onCambiar(n)} className="visualmente-oculto" />
            <Icono nombre="estrella" tamano={30} className={n <= valor ? 'llena' : ''} />
            <span className="visualmente-oculto">{n} de 5 ({TEXTOS[n]})</span>
          </label>
        ))}
        <span className="selector-estrellas__texto" aria-hidden="true">{valor ? TEXTOS[valor] : 'Elige de 1 a 5'}</span>
      </div>
      {error && <span className="campo__error">{error}</span>}
    </fieldset>
  );
}
