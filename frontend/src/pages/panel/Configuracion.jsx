// Configuración de la cuenta: correo, contraseña y tus datos (descargarlos o eliminar la cuenta).
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cambiarEmail, cambiarPassword, descargarDatos, eliminarCuenta } from '../../services/cuentaService.js';
import { guardarToken } from '../../services/api.js';
import { validar, reglas, PASSWORD_MIN } from '../../utils/validadores.js';
import Campo from '../../components/Campo.jsx';
import Boton from '../../components/Boton.jsx';
import Modal from '../../components/Modal.jsx';

export default function Configuracion() {
  return (
    <>
      <div className="panel__cabecera">
        <h1>Configuración</h1>
        <p className="texto-suave">Datos de acceso y privacidad de tu cuenta.</p>
      </div>
      <FormularioEmail />
      <FormularioPassword />
      <MisDatos />
    </>
  );
}

function FormularioEmail() {
  const { usuario, setUsuario } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState({ email: usuario.email, password: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, {
      email: [reglas.requerido(), reglas.email(), (v) => (v.trim().toLowerCase() === usuario.email ? 'Es el mismo correo que ya tienes.' : null)],
      password: [reglas.requerido('Confirma con tu contraseña actual.')],
    });
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    try {
      const sesion = await cambiarEmail(datos.email, datos.password);
      setUsuario(sesion);
      setDatos({ email: sesion.email, password: '' });
      toast('Correo actualizado.');
    } catch (err) {
      setErrores(err.detalles || {});
      if (!err.detalles) toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar} noValidate>
      <h2 className="tarjeta__titulo">Correo electrónico</h2>
      <div className="rejilla-2">
        <Campo etiqueta="Nuevo correo" name="email" tipo="email" autoComplete="email" value={datos.email} onChange={cambiar} error={errores.email} />
        <Campo etiqueta="Contraseña actual" name="password" tipo="password" autoComplete="current-password" value={datos.password} onChange={cambiar} error={errores.password} />
      </div>
      <div><Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Actualizar correo'}</Boton></div>
    </form>
  );
}

function FormularioPassword() {
  const toast = useToast();
  const vacio = { actual: '', nueva: '', repetir: '' };
  const [datos, setDatos] = useState(vacio);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, {
      actual: [reglas.requerido('Introduce tu contraseña actual.')],
      nueva: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`),
        reglas.longitudMax(72), reglas.distintoDe('actual', 'La nueva contraseña debe ser distinta de la actual.')],
      repetir: [reglas.requerido('Repite la nueva contraseña.'), reglas.igualA('nueva', 'Las contraseñas no coinciden.')],
    });
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    try {
      const { token } = await cambiarPassword(datos.actual, datos.nueva);
      // Las demás sesiones se han cerrado; esta sigue abierta con el token nuevo
      guardarToken(token);
      setDatos(vacio);
      toast('Contraseña cambiada. Se ha cerrado la sesión en tus otros dispositivos.');
    } catch (err) {
      setErrores(err.detalles || {});
      if (!err.detalles) toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar} noValidate>
      <h2 className="tarjeta__titulo">Contraseña</h2>
      <div className="rejilla-3">
        <Campo etiqueta="Contraseña actual" name="actual" tipo="password" autoComplete="current-password" value={datos.actual} onChange={cambiar} error={errores.actual} />
        <Campo etiqueta="Nueva contraseña" name="nueva" tipo="password" autoComplete="new-password" value={datos.nueva} onChange={cambiar} error={errores.nueva} ayuda={`Mínimo ${PASSWORD_MIN} caracteres.`} />
        <Campo etiqueta="Repetir nueva contraseña" name="repetir" tipo="password" autoComplete="new-password" value={datos.repetir} onChange={cambiar} error={errores.repetir} />
      </div>
      <div><Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Cambiar contraseña'}</Boton></div>
    </form>
  );
}

function MisDatos() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [descargando, setDescargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function descargar() {
    setDescargando(true);
    try {
      const datos = await descargarDatos();
      const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
      const enlace = Object.assign(document.createElement('a'), { href: url, download: 'practifp-mis-datos.json' });
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDescargando(false);
    }
  }

  const cerrarModal = useCallback(() => setEliminando(false), []);

  return (
    <>
      <section className="tarjeta formulario">
        <h2 className="tarjeta__titulo">Tus datos</h2>
        <p className="texto-suave">
          Descarga una copia de todos los datos de tu cuenta en un archivo (formato JSON).
          {usuario.rol === 'ALUMNO' && ' Tu currículum y las imágenes de tus proyectos puedes descargarlos desde tu perfil y tu portfolio.'}
          {' '}Más información en la <Link to="/privacidad">política de privacidad</Link>.
        </p>
        <div><Boton variante="secundario" onClick={descargar} disabled={descargando}>{descargando ? 'Preparando…' : 'Descargar mis datos'}</Boton></div>
      </section>

      <section className="tarjeta formulario zona-peligro">
        <h2 className="tarjeta__titulo">Eliminar mi cuenta</h2>
        <p className="texto-suave">
          {usuario.rol === 'EMPRESA'
            ? 'Se borrarán tu perfil de empresa, todas tus ofertas y las candidaturas recibidas. No se puede deshacer.'
            : usuario.rol === 'ALUMNO'
              ? 'Se borrarán tu perfil, tu currículum, tu portfolio, tus candidaturas, favoritos y valoraciones. No se puede deshacer.'
              : 'Se borrará esta cuenta de administración. No se puede deshacer.'}
        </p>
        <div><Boton variante="peligro" onClick={() => setEliminando(true)}>Eliminar mi cuenta</Boton></div>
      </section>

      {eliminando && <ModalEliminarCuenta onCerrar={cerrarModal} />}
    </>
  );
}

function ModalEliminarCuenta({ onCerrar }) {
  const { cerrarSesion } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    if (!password) { setError('Escribe tu contraseña para confirmar.'); return; }
    setEnviando(true);
    try {
      await eliminarCuenta(password);
      cerrarSesion('Tu cuenta y tus datos se han eliminado.');
    } catch (err) {
      setError(err.detalles?.password || err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Eliminar mi cuenta" onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={confirmar} noValidate>
        <div className="modal__texto">
          <p>Esta acción es definitiva: tu cuenta y todos sus datos se borrarán y no se podrán recuperar.</p>
          <Campo etiqueta="Tu contraseña" name="password" tipo="password" autoComplete="current-password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }} error={error} />
        </div>
        <div className="modal__acciones">
          <Boton variante="fantasma" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
          <Boton type="submit" variante="peligro-solido" disabled={enviando}>{enviando ? 'Eliminando…' : 'Eliminar definitivamente'}</Boton>
        </div>
      </form>
    </Modal>
  );
}
