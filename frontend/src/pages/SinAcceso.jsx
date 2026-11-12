import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTA_PANEL, NOMBRE_PANEL } from '../utils/rutas.js';
import Icono from '../components/Icono.jsx';

export default function SinAcceso() {
  const { usuario } = useAuth();
  return (
    <div className="contenedor seccion">
      <div className="vacio">
        <Icono nombre="escudo" tamano={32} />
        <h1>No tienes acceso a esta sección</h1>
        <p>Esta parte de PractiFP es para otro tipo de cuenta.</p>
        <Link to={RUTA_PANEL[usuario.rol]} className="boton boton--primario">Ir a {NOMBRE_PANEL[usuario.rol].toLowerCase()}</Link>
      </div>
    </div>
  );
}
