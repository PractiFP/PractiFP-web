// Edición del perfil del alumno y gestión del currículum.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { miPerfil, actualizarMiPerfil, subirCv, eliminarCv } from '../../../services/alumnosService.js';
import { listarCiclos } from '../../../services/ciclosService.js';
import { validar, reglas } from '../../../utils/validadores.js';
import { MB } from '../../../utils/formato.js';
import Campo from '../../../components/Campo.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import BotonVerCv from '../../../components/BotonVerCv.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

const ESQUEMA = {
  nombre: [reglas.requerido(), reglas.longitudMax(80)],
  apellidos: [reglas.requerido(), reglas.longitudMax(120)],
  cicloId: [reglas.requerido('Elige tu ciclo formativo.')],
  centro: [reglas.longitudMax(150)],
  localidad: [reglas.longitudMax(100)],
  descripcion: [reglas.longitudMax(1000)],
};

const aFormulario = (p) => ({
  nombre: p.nombre, apellidos: p.apellidos, cicloId: p.ciclo ? String(p.ciclo.id) : '', curso: p.curso ? String(p.curso) : '',
  centro: p.centro ?? '', localidad: p.localidad ?? '', descripcion: p.descripcion ?? '',
});

export default function MiPerfil() {
  const perfil = usePeticion(miPerfil);
  const ciclos = usePeticion(listarCiclos);

  if (perfil.cargando || ciclos.cargando) return <Cargando />;
  if (perfil.error || ciclos.error) {
    return <MensajeError mensaje={(perfil.error || ciclos.error).message} onReintentar={() => { perfil.recargar(); ciclos.recargar(); }} />;
  }
  return <Formulario perfil={perfil.datos} ciclos={ciclos.datos} />;
}

function Formulario({ perfil, ciclos }) {
  const { refrescarUsuario } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState(() => aFormulario(perfil));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [tieneCv, setTieneCv] = useState(perfil.tieneCv);

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    const errs = validar(datos, ESQUEMA);
    setErrores(errs);
    if (Object.keys(errs).length) return toast('Revisa los campos marcados.', 'error');
    setGuardando(true);
    try {
      const actualizado = await actualizarMiPerfil({ ...datos, cicloId: Number(datos.cicloId), curso: datos.curso ? Number(datos.curso) : null });
      setDatos(aFormulario(actualizado));
      await refrescarUsuario();
      toast('Perfil actualizado.');
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
          <h1>Mi perfil</h1>
          <p className="texto-suave">Así te verán las empresas.</p>
        </div>
        <Link to={`/alumnos/${perfil.id}`} className="boton boton--secundario"><Icono nombre="ojo" tamano={16} /> Ver perfil público</Link>
      </div>

      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <div className="rejilla-2">
          <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} error={errores.nombre} autoComplete="given-name" />
          <Campo etiqueta="Apellidos" name="apellidos" value={datos.apellidos} onChange={cambiar} error={errores.apellidos} autoComplete="family-name" />
          <Campo como="select" etiqueta="Ciclo formativo" name="cicloId" value={datos.cicloId} onChange={cambiar} error={errores.cicloId}
            opciones={[{ valor: '', texto: 'Elige tu ciclo' }, ...ciclos.map((c) => ({ valor: String(c.id), texto: `${c.codigo} · ${c.nombre}` }))]} />
          <Campo como="select" etiqueta="Curso" name="curso" value={datos.curso} onChange={cambiar} error={errores.curso}
            opciones={[{ valor: '', texto: 'Sin indicar' }, { valor: '1', texto: '1.º curso' }, { valor: '2', texto: '2.º curso' }]} />
          <Campo etiqueta="Centro educativo" name="centro" value={datos.centro} onChange={cambiar} error={errores.centro} />
          <Campo etiqueta="Localidad" name="localidad" value={datos.localidad} onChange={cambiar} error={errores.localidad} autoComplete="address-level2" />
        </div>
        <Campo como="textarea" etiqueta="Descripción personal y profesional" name="descripcion" value={datos.descripcion} onChange={cambiar}
          error={errores.descripcion} maxLength={1000} rows={5} placeholder="Qué te interesa, qué has hecho y qué tipo de prácticas buscas." />
        <div><Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Boton></div>
      </form>

      <SeccionCv alumnoId={perfil.id} nombre={`${perfil.nombre} ${perfil.apellidos}`} tieneCv={tieneCv} setTieneCv={setTieneCv} />
    </>
  );
}

function SeccionCv({ alumnoId, nombre, tieneCv, setTieneCv }) {
  const toast = useToast();
  const entrada = useRef(null);
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => setError(null), [tieneCv]);

  async function alElegir(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.type !== 'application/pdf') return setError('El archivo debe ser un PDF.');
    if (archivo.size > 4 * MB) return setError('El archivo supera los 4 MB.');
    setError(null);
    setSubiendo(true);
    try {
      await subirCv(archivo);
      setTieneCv(true);
      toast(tieneCv ? 'Currículum reemplazado.' : 'Currículum subido.');
    } catch (err) {
      setError(err.detalles?.cv || err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await eliminarCv();
      setTieneCv(false);
      setConfirmar(false);
      toast('Currículum eliminado.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2 className="tarjeta__titulo">Currículum</h2>
      <div className="cv">
        <span className={`cv__icono ${tieneCv ? 'cv__icono--ok' : ''}`}><Icono nombre="archivo" tamano={22} /></span>
        <div className="cv__texto">
          <strong>{tieneCv ? 'Tienes un currículum subido' : 'No has subido tu currículum'}</strong>
          <span>PDF de 4 MB como máximo. Solo lo verán las empresas en cuyas ofertas te inscribas.</span>
        </div>
        <div className="cv__acciones">
          {tieneCv && <BotonVerCv alumnoId={alumnoId} nombre={nombre} tamano="pequeno" />}
          <input ref={entrada} type="file" accept="application/pdf" className="visualmente-oculto" onChange={alElegir} aria-label="Elegir currículum en PDF" tabIndex={-1} />
          <Boton variante={tieneCv ? 'secundario' : 'primario'} tamano="pequeno" onClick={() => entrada.current.click()} disabled={subiendo}>
            <Icono nombre="subir" tamano={16} /> {subiendo ? 'Subiendo…' : tieneCv ? 'Reemplazar' : 'Subir PDF'}
          </Boton>
          {tieneCv && (
            <Boton variante="peligro" tamano="pequeno" onClick={() => setConfirmar(true)}>
              <Icono nombre="papelera" tamano={16} /> Eliminar
            </Boton>
          )}
        </div>
      </div>
      {error && <p className="campo__error" role="alert">{error}</p>}
      {confirmar && (
        <ModalConfirmar titulo="Eliminar currículum" onCerrar={() => setConfirmar(false)} onConfirmar={eliminar} enviando={eliminando}>
          <p>Las empresas dejarán de poder consultarlo. ¿Quieres eliminarlo?</p>
        </ModalConfirmar>
      )}
    </section>
  );
}
