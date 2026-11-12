import { Link } from 'react-router-dom';
import Icono from '../components/Icono.jsx';

export default function NoEncontrada() {
  return (
    <div className="contenedor seccion">
      <div className="vacio">
        <h1>No hemos encontrado esta página</h1>
        <p>Puede que la dirección esté mal escrita o que la página se haya eliminado.</p>
        <Link to="/" className="boton boton--primario"><Icono nombre="izquierda" tamano={16} /> Volver al inicio</Link>
      </div>
    </div>
  );
}
