import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { RUTA_PANEL } from '../../utils/rutas.js';

export default function IrAlPanel() {
  const { usuario } = useAuth();
  return <Navigate to={RUTA_PANEL[usuario.rol]} replace />;
}
