// Página del enlace que llega por correo: elegir una contraseña nueva.
// El código va en la URL después de "#", así que nunca se envía al servidor al cargar la página.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { restablecerPassword } from '../services/authService.js';
import { borrarToken } from '../services/api.js';
import { validar, reglas, PASSWORD_MIN } from '../utils/validadores.js';
import Campo from '../components/Campo.jsx';
import Boton from '../components/Boton.jsx';
import MensajeError from '../components/MensajeError.jsx';

export default function RestablecerPassword() {
  const { usuario, setUsuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [codigo] = useState(() => window.location.hash.slice(1));
  // Se quita el código de la barra de direcciones para que no quede en el historial
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);
  const [datos, setDatos] = useState({ password: '', password2: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, {
      password: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`), reglas.longitudMax(72)],
      password2: [reglas.requerido('Repite la contraseña.'), reglas.igualA('password', 'Las contraseñas no coinciden.')],
    });
    setErrores(errs);
    setErrorGeneral(null);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    try {
      await restablecerPassword(codigo, datos.password);
      // Todas las sesiones se han cerrado, también la de este navegador si la había
      if (usuario) { borrarToken(); setUsuario(null); }
      toast('Contraseña cambiada. Ya puedes iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.detalles?.password) setErrores({ password: err.detalles.password });
      else setErrorGeneral(err.detalles?.token || err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="auth tarjeta">
        <div>
          <h1>Elegir una contraseña nueva</h1>
          <p className="texto-suave">Al cambiarla se cerrará la sesión en todos tus dispositivos.</p>
        </div>
        {!codigo ? (
          <MensajeError titulo="Enlace incompleto" mensaje="Abre el enlace tal como aparece en el correo o pide uno nuevo." />
        ) : (
          <form className="formulario" onSubmit={enviar} noValidate>
            <Campo etiqueta="Nueva contraseña" name="password" tipo="password" autoComplete="new-password" value={datos.password}
              onChange={cambiar} error={errores.password} ayuda={`Mínimo ${PASSWORD_MIN} caracteres.`} />
            <Campo etiqueta="Repetir contraseña" name="password2" tipo="password" autoComplete="new-password" value={datos.password2}
              onChange={cambiar} error={errores.password2} />
            {errorGeneral && <MensajeError titulo="No se ha podido cambiar la contraseña" mensaje={errorGeneral} />}
            <Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Cambiar contraseña'}</Boton>
          </form>
        )}
        <p className="auth__pie"><Link to="/recuperar-contrasena">Pedir un enlace nuevo</Link></p>
      </div>
    </div>
  );
}
