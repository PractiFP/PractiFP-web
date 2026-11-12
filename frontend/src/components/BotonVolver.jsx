import { useNavigate } from 'react-router-dom';
import Icono from './Icono.jsx';

// Vuelve a la página anterior; si se ha entrado directamente, lleva al inicio.
export default function BotonVolver() {
  const navigate = useNavigate();
  const volver = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  return (
    <button type="button" className="volver" onClick={volver}>
      <Icono nombre="izquierda" tamano={16} /> Volver
    </button>
  );
}
