import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarCiclos } from '../services/ciclosService.js';
import { RUTA_PANEL } from '../utils/rutas.js';
import { validar, reglas, PASSWORD_MIN } from '../utils/validadores.js';
import Campo from '../components/Campo.jsx';
import Boton from '../components/Boton.jsx';
import MensajeError from '../components/MensajeError.jsx';

const INICIAL = { tipo: 'ALUMNO', nombre: '', apellidos: '', cicloId: '', localidad: '', email: '', password: '', password2: '', aceptaPrivacidad: false };

function esquema(tipo) {
  const comunes = {
    nombre: [reglas.requerido(), reglas.longitudMax(tipo === 'EMPRESA' ? 150 : 80)],
    email: [reglas.requerido(), reglas.email()],
    password: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`), reglas.longitudMax(72)],
    password2: [reglas.requerido('Repite la contraseña.'), reglas.igualA('password', 'Las contraseñas no coinciden.')],
    aceptaPrivacidad: [(v) => (v === true ? null : 'Debes aceptar la política de privacidad para crear la cuenta.')],
  };
  return tipo === 'EMPRESA'
    ? { ...comunes, localidad: [reglas.requerido(), reglas.longitudMax(100)] }
    : { ...comunes, apellidos: [reglas.requerido(), reglas.longitudMax(120)], cicloId: [reglas.requerido('Elige tu ciclo formativo.')] };
}

export default function Registro() {
  const { registrar } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const ciclos = usePeticion(listarCiclos);
  const [datos, setDatos] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const cambiarTipo = (e) => { setDatos((d) => ({ ...d, tipo: e.target.value })); setErrores({}); setErrorGeneral(null); };

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, esquema(datos.tipo));
    setErrores(errs);
    setErrorGeneral(null);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    try {
      const { password2: _repetida, ...envio } = datos;
      const usuario = await registrar({ ...envio, cicloId: datos.cicloId ? Number(datos.cicloId) : undefined });
      toast('Cuenta creada. ¡Bienvenido/a a PractiFP!');
      navigate(RUTA_PANEL[usuario.rol], { replace: true });
    } catch (err) {
      // Los errores por campo del backend se muestran junto a cada campo
      if (err.detalles) setErrores(err.detalles);
      else setErrorGeneral(err.message);
      setEnviando(false);
    }
  }

  const esEmpresa = datos.tipo === 'EMPRESA';
  const opcionesCiclo = [{ valor: '', texto: ciclos.cargando ? 'Cargando ciclos…' : 'Elige tu ciclo' },
    ...(ciclos.datos || []).map((c) => ({ valor: String(c.id), texto: `${c.codigo} · ${c.nombre}` }))];

  return (
    <div className="contenedor">
      <div className="auth auth--ancha tarjeta">
        <div>
          <h1>Crear cuenta</h1>
          <p className="texto-suave">Elige el tipo de cuenta que necesitas.</p>
        </div>
        <form className="formulario" onSubmit={enviar} noValidate>
          <fieldset className="opciones-tarjeta">
            <legend className="visualmente-oculto">Tipo de cuenta</legend>
            <label>
              <input type="radio" name="tipo" value="ALUMNO" checked={!esEmpresa} onChange={cambiarTipo} />
              <span><strong>Alumno</strong><small>Busco prácticas</small></span>
            </label>
            <label>
              <input type="radio" name="tipo" value="EMPRESA" checked={esEmpresa} onChange={cambiarTipo} />
              <span><strong>Empresa</strong><small>Ofrezco prácticas</small></span>
            </label>
          </fieldset>

          {esEmpresa ? (
            <div className="rejilla-2">
              <Campo etiqueta="Nombre de la empresa" name="nombre" value={datos.nombre} onChange={cambiar} error={errores.nombre} autoComplete="organization" />
              <Campo etiqueta="Localidad" name="localidad" value={datos.localidad} onChange={cambiar} error={errores.localidad} autoComplete="address-level2" />
            </div>
          ) : (
            <>
              <div className="rejilla-2">
                <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} error={errores.nombre} autoComplete="given-name" />
                <Campo etiqueta="Apellidos" name="apellidos" value={datos.apellidos} onChange={cambiar} error={errores.apellidos} autoComplete="family-name" />
              </div>
              {ciclos.error
                ? <MensajeError titulo="No se han podido cargar los ciclos" mensaje={ciclos.error.message} onReintentar={ciclos.recargar} />
                : <Campo como="select" etiqueta="Ciclo formativo" name="cicloId" value={datos.cicloId} onChange={cambiar} error={errores.cicloId} opciones={opcionesCiclo} disabled={ciclos.cargando} />}
            </>
          )}

          <Campo etiqueta="Correo electrónico" name="email" tipo="email" autoComplete="email" value={datos.email} onChange={cambiar} error={errores.email} />
          <div className="rejilla-2">
            <Campo etiqueta="Contraseña" name="password" tipo="password" autoComplete="new-password" value={datos.password} onChange={cambiar} error={errores.password} ayuda={`Mínimo ${PASSWORD_MIN} caracteres.`} />
            <Campo etiqueta="Repetir contraseña" name="password2" tipo="password" autoComplete="new-password" value={datos.password2} onChange={cambiar} error={errores.password2} />
          </div>

          <div className="campo">
            <label className="casilla casilla--legal">
              <input type="checkbox" name="aceptaPrivacidad" checked={datos.aceptaPrivacidad} onChange={cambiar}
                aria-invalid={errores.aceptaPrivacidad ? true : undefined} aria-describedby={errores.aceptaPrivacidad ? 'error-privacidad' : undefined} />
              <span>
                He leído y acepto la <Link to="/privacidad" target="_blank" rel="noopener">política de privacidad</Link>{' '}
                <span className="visualmente-oculto">(se abre en una pestaña nueva)</span>
              </span>
            </label>
            {errores.aceptaPrivacidad && <span id="error-privacidad" className="campo__error">{errores.aceptaPrivacidad}</span>}
          </div>

          {errorGeneral && <MensajeError titulo="No se ha podido crear la cuenta" mensaje={errorGeneral} />}
          <Boton type="submit" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Crear cuenta'}</Boton>
        </form>
        <p className="auth__pie">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  );
}
