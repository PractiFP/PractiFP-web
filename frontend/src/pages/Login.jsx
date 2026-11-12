import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { RUTA_PANEL } from '../utils/rutas.js';
import { validar, reglas } from '../utils/validadores.js';
import Campo from '../components/Campo.jsx';
import Boton from '../components/Boton.jsx';
import MensajeError from '../components/MensajeError.jsx';

// Cuentas de los datos de prueba (solo se muestran en desarrollo)
const CUENTAS_PRUEBA = [
  { email: 'lucia.martin@correo.example', texto: 'Lucía Martín', rol: 'Alumna · DAM' },
  { email: 'rrhh@nubalia.example', texto: 'Nubalia Software', rol: 'Empresa' },
  { email: 'admin@practifp.es', texto: 'Administración', rol: 'Administrador' },
];

export default function Login() {
  const { iniciarSesion } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, {
      email: [reglas.requerido('Introduce tu correo.'), reglas.email()],
      password: [reglas.requerido('Introduce tu contraseña.')],
    });
    setErrores(errs);
    setErrorGeneral(null);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    try {
      const usuario = await iniciarSesion(datos.email, datos.password);
      toast(`Hola, ${usuario.nombreCorto}.`);
      navigate(location.state?.desde || RUTA_PANEL[usuario.rol], { replace: true });
    } catch (err) {
      setErrorGeneral(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="auth tarjeta">
        <div>
          <h1>Iniciar sesión</h1>
          <p className="texto-suave">Accede a tu panel de PractiFP.</p>
        </div>
        {location.state?.desde && !errorGeneral && (
          <p className="nota">Inicia sesión para continuar.</p>
        )}
        <form className="formulario" onSubmit={enviar} noValidate>
          <Campo etiqueta="Correo electrónico" name="email" tipo="email" autoComplete="email" value={datos.email} onChange={cambiar} error={errores.email} />
          <Campo etiqueta="Contraseña" name="password" tipo="password" autoComplete="current-password" value={datos.password} onChange={cambiar} error={errores.password} />
          {errorGeneral && <MensajeError titulo="No se ha podido iniciar sesión" mensaje={errorGeneral} />}
          <Boton type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Boton>
        </form>

        {import.meta.env.DEV && (
          <div className="cuentas-prueba">
            <p className="antetitulo">Cuentas de prueba · contraseña practifp123</p>
            {CUENTAS_PRUEBA.map((c) => (
              <button key={c.email} type="button" onClick={() => { setDatos({ email: c.email, password: 'practifp123' }); setErrores({}); setErrorGeneral(null); }}>
                <strong>{c.texto}</strong><span>{c.rol}</span>
              </button>
            ))}
          </div>
        )}

        <p className="auth__pie">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </div>
    </div>
  );
}
