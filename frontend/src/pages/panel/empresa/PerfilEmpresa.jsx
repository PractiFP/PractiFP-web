// Edición del perfil público de la empresa.
import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { miPerfil, actualizarMiPerfil } from '../../../services/empresasService.js';
import { validar, reglas } from '../../../utils/validadores.js';
import Campo from '../../../components/Campo.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import InsigniaVerificada from '../../../components/InsigniaVerificada.jsx';
import { MapaUbicacion } from '../../../components/mapa/index.js';

const ESQUEMA = {
  nombre: [reglas.requerido(), reglas.longitudMax(150)],
  web: [reglas.longitudMax(255), reglas.url()],
  telefono: [reglas.telefono()],
  localidad: [reglas.requerido(), reglas.longitudMax(100)],
  direccion: [reglas.longitudMax(200)],
  descripcion: [reglas.longitudMax(2000)],
  latitud: [reglas.numeroEntre(-90, 90, 'La latitud debe estar entre -90 y 90.'), reglas.ambosONinguno('longitud', 'Indica también la latitud.')],
  longitud: [reglas.numeroEntre(-180, 180, 'La longitud debe estar entre -180 y 180.'), reglas.ambosONinguno('latitud', 'Indica también la longitud.')],
};
const texto = (v) => (v === null || v === undefined ? '' : String(v));
const aFormulario = (p) => Object.fromEntries(['nombre', 'web', 'telefono', 'localidad', 'direccion', 'descripcion', 'latitud', 'longitud'].map((k) => [k, texto(p[k])]));

export default function PerfilEmpresa() {
  const perfil = usePeticion(miPerfil);
  if (perfil.cargando) return <Cargando />;
  if (perfil.error) return <MensajeError mensaje={perfil.error.message} onReintentar={perfil.recargar} />;
  return <Formulario perfil={perfil.datos} />;
}

function Formulario({ perfil }) {
  const { refrescarUsuario } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState(() => aFormulario(perfil));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    const normalizados = { ...datos, latitud: datos.latitud.replace(',', '.').trim(), longitud: datos.longitud.replace(',', '.').trim() };
    const errs = validar(normalizados, ESQUEMA);
    setErrores(errs);
    if (Object.keys(errs).length) return toast('Revisa los campos marcados.', 'error');
    setGuardando(true);
    try {
      const actualizado = await actualizarMiPerfil(normalizados);
      setDatos(aFormulario(actualizado));
      await refrescarUsuario();
      toast('Perfil de empresa actualizado.');
    } catch (err) {
      if (err.detalles) setErrores(err.detalles);
      toast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="panel__cabecera panel__cabecera--acciones">
        <div>
          <h1>Perfil de empresa</h1>
          <p className="texto-suave">Información pública que verán los alumnos. <InsigniaVerificada verificada={perfil.verificada} /></p>
        </div>
        <Link to={`/empresas/${perfil.id}`} className="boton boton--secundario"><Icono nombre="ojo" tamano={16} /> Ver ficha pública</Link>
      </div>

      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <div className="rejilla-2">
          <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} error={errores.nombre} autoComplete="organization" />
          <Campo etiqueta="Página web" name="web" tipo="url" value={datos.web} onChange={cambiar} error={errores.web} placeholder="https://" />
          <Campo etiqueta="Teléfono" name="telefono" tipo="tel" value={datos.telefono} onChange={cambiar} error={errores.telefono} autoComplete="tel" />
          <Campo etiqueta="Localidad" name="localidad" value={datos.localidad} onChange={cambiar} error={errores.localidad} autoComplete="address-level2" />
        </div>
        <Campo etiqueta="Dirección" name="direccion" value={datos.direccion} onChange={cambiar} error={errores.direccion} autoComplete="street-address" />
        <Campo como="textarea" etiqueta="Descripción" name="descripcion" value={datos.descripcion} onChange={cambiar} error={errores.descripcion}
          maxLength={2000} rows={5} placeholder="A qué se dedica la empresa y qué aprenderán los alumnos en prácticas." />

        <fieldset className="grupo">
          <legend>Ubicación en el mapa</legend>
          <p className="campo__ayuda">Necesaria para aparecer en el mapa de empresas. Pulsa en el mapa sobre la ubicación de tu empresa o escribe las coordenadas.</p>
          <Suspense fallback={<Cargando texto="Cargando el mapa…" />}>
            <MapaUbicacion latitud={parseFloat(datos.latitud.replace(',', '.'))} longitud={parseFloat(datos.longitud.replace(',', '.'))}
              onElegir={(lat, lng) => { setDatos((d) => ({ ...d, latitud: String(lat), longitud: String(lng) })); setErrores((e) => ({ ...e, latitud: undefined, longitud: undefined })); }} />
          </Suspense>
          <div className="rejilla-2">
            <Campo etiqueta="Latitud" name="latitud" inputMode="decimal" value={datos.latitud} onChange={cambiar} error={errores.latitud} placeholder="40.4168" />
            <Campo etiqueta="Longitud" name="longitud" inputMode="decimal" value={datos.longitud} onChange={cambiar} error={errores.longitud} placeholder="-3.7038" />
          </div>
        </fieldset>
        <div><Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Boton></div>
      </form>
    </>
  );
}
