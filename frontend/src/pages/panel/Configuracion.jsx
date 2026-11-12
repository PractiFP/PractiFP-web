// Datos de acceso: correo electrónico y contraseña.
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cambiarEmail, cambiarPassword } from '../../services/cuentaService.js';
import { validar, reglas, PASSWORD_MIN } from '../../utils/validadores.js';
import Campo from '../../components/Campo.jsx';
import Boton from '../../components/Boton.jsx';

export default function Configuracion() {
  return (
    <>
      <div className="panel__cabecera">
        <h1>Configuración</h1>
        <p className="texto-suave">Datos de acceso a tu cuenta.</p>
      </div>
      <FormularioEmail />
      <FormularioPassword />
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
      await cambiarPassword(datos.actual, datos.nueva);
      setDatos(vacio);
      toast('Contraseña cambiada.');
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
