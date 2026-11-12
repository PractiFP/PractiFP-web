// Protege una ruta: exige sesión y, opcionalmente, uno de los roles indicados.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Cargando from './Cargando.jsx';
import SinAcceso from '../pages/SinAcceso.jsx';

export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando, salidaVoluntaria } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Comprobando tu sesión…" />;
  if (!usuario) {
    // Tras cerrar sesión se vuelve al inicio; si no, se pide iniciar sesión y luego se regresa aquí
    return salidaVoluntaria
      ? <Navigate to="/" replace />
      : <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (roles && !roles.includes(usuario.rol)) return <SinAcceso />;
  return children;
}
