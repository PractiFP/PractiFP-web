import Icono from './Icono.jsx';
import Boton from './Boton.jsx';

export default function MensajeError({ titulo = 'Algo ha fallado', mensaje, onReintentar }) {
  return (
    <div className="mensaje-error" role="alert">
      <Icono nombre="alerta" />
      <div className="mensaje-error__texto">
        <strong>{titulo}</strong>
        {mensaje && <p>{mensaje}</p>}
        {onReintentar && (
          <Boton variante="secundario" tamano="pequeno" onClick={onReintentar}>
            <Icono nombre="recargar" tamano={16} /> Reintentar
          </Boton>
        )}
      </div>
    </div>
  );
}
