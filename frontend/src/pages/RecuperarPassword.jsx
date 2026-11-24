// "¿Has olvidado tu contraseña?": pide el correo y envía un enlace para elegir otra.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacion } from '../services/authService.js';
import { validar, reglas } from '../utils/validadores.js';
import Campo from '../components/Campo.jsx';
import Boton from '../components/Boton.jsx';
import MensajeError from '../components/MensajeError.jsx';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    const errs = validar({ email }, { email: [reglas.requerido('Introduce tu correo.'), reglas.email()] });
    setError(errs.email);
    setErrorGeneral(null);
    if (errs.email) return;
    setEnviando(true);
    try {
      const { mensaje } = await solicitarRecuperacion(email);
      setEnviado(mensaje);
    } catch (err) {
      if (err.detalles?.email) setError(err.detalles.email);
      else setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="auth tarjeta">
        <div>
          <h1>Recuperar la contraseña</h1>
          <p className="texto-suave">Te enviaremos un enlace para elegir una contraseña nueva.</p>
        </div>
        {enviado ? (
          <div className="formulario" role="status">
            <p>{enviado}</p>
            <p className="nota">El enlace caduca en una hora. Si no lo ves, mira en la carpeta de correo no deseado.</p>
            <Boton variante="secundario" onClick={() => { setEnviado(null); setEmail(''); }}>Probar con otro correo</Boton>
          </div>
        ) : (
          <form className="formulario" onSubmit={enviar} noValidate>
            <Campo etiqueta="Correo electrónico" name="email" tipo="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} error={error} />
            {errorGeneral && <MensajeError titulo="No se ha podido enviar el enlace" mensaje={errorGeneral} />}
            <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar enlace'}</Boton>
          </form>
        )}
        <p className="auth__pie"><Link to="/login">Volver a iniciar sesión</Link></p>
      </div>
    </div>
  );
}
