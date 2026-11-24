// Estado de la sesión: usuario actual, inicio y cierre de sesión.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerToken, guardarToken, borrarToken, EVENTO_SESION_CADUCADA } from '../services/api.js';
import * as authService from '../services/authService.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()));
  // true cuando el usuario ha cerrado sesión él mismo (las rutas protegidas llevan al inicio, no al login)
  const [salidaVoluntaria, setSalidaVoluntaria] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Al abrir la aplicación, si hay token se recupera el usuario
  useEffect(() => {
    if (!obtenerToken()) return;
    const controlador = new AbortController();
    authService.obtenerSesion({ signal: controlador.signal })
      .then(setUsuario)
      .catch((err) => { if (err.name !== 'AbortError') { borrarToken(); setUsuario(null); } })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, []);

  // El cliente HTTP avisa si el backend rechaza el token (caducado, cuenta desactivada...)
  useEffect(() => {
    const alCaducar = (e) => {
      borrarToken();
      setUsuario(null);
      toast(e.detail || 'Tu sesión ha caducado. Vuelve a iniciar sesión.', 'error');
      navigate('/login', { replace: true });
    };
    window.addEventListener(EVENTO_SESION_CADUCADA, alCaducar);
    return () => window.removeEventListener(EVENTO_SESION_CADUCADA, alCaducar);
  }, [navigate, toast]);

  const iniciarSesion = useCallback(async (email, password) => {
    const { token, usuario } = await authService.iniciarSesion(email, password);
    guardarToken(token);
    setSalidaVoluntaria(false);
    setUsuario(usuario);
    return usuario;
  }, []);

  const registrar = useCallback(async (datos) => {
    const { token, usuario } = await authService.registrar(datos);
    guardarToken(token);
    setSalidaVoluntaria(false);
    setUsuario(usuario);
    return usuario;
  }, []);

  // Vuelve a pedir los datos de la sesión (p. ej. tras cambiar el nombre en el perfil)
  const refrescarUsuario = useCallback(async () => {
    const datos = await authService.obtenerSesion();
    setUsuario(datos);
    return datos;
  }, []);

  // `mensaje` solo si es texto: desde un botón llega el evento del clic
  const cerrarSesion = useCallback((mensaje) => {
    borrarToken();
    setSalidaVoluntaria(true);
    setUsuario(null);
    toast(typeof mensaje === 'string' ? mensaje : 'Has cerrado sesión.');
  }, [toast]);

  const valor = useMemo(
    () => ({ usuario, cargando, salidaVoluntaria, iniciarSesion, registrar, cerrarSesion, refrescarUsuario, setUsuario }),
    [usuario, cargando, salidaVoluntaria, iniciarSesion, registrar, cerrarSesion, refrescarUsuario]
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
