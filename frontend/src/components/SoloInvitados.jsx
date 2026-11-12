// Páginas solo para usuarios sin sesión (login y registro). Si ya hay sesión,
// lleva a la página de la que venía (p. ej. una oferta) o, si no, a su panel.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTA_PANEL } from '../utils/rutas.js';
import Cargando from './Cargando.jsx';

export default function SoloInvitados() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={location.state?.desde || RUTA_PANEL[usuario.rol]} replace />;
  return <Outlet />;
}
