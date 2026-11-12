// Editor de las fases del proceso de selección de cada oferta.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { misOfertas, obtenerOferta, guardarFases } from '../../../services/ofertasService.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';

// Fases habituales para empezar rápido (el documento de requisitos las pone como ejemplo)
const PLANTILLA = [
  { nombre: 'Recepción de candidaturas', descripcion: 'Revisamos que el perfil encaje con el ciclo y las tecnologías.', duracionDias: 7, obligatoria: true },
  { nombre: 'Revisión de currículums', descripcion: 'El equipo técnico revisa el currículum y el portfolio.', duracionDias: 5, obligatoria: true },
  { nombre: 'Prueba técnica', descripcion: 'Ejercicio práctico.', duracionDias: 7, obligatoria: false },
  { nombre: 'Entrevista', descripcion: 'Entrevista con el tutor de empresa.', duracionDias: 5, obligatoria: true },
  { nombre: 'Resolución final', descripcion: 'Comunicamos la decisión a todos los candidatos.', duracionDias: 3, obligatoria: true },
];
let contador = 0;
const claveNueva = () => `nueva-${++contador}`;
const aBorrador = (f) => ({ clave: f.id ? `f${f.id}` : claveNueva(), id: f.id ?? null, nombre: f.nombre, descripcion: f.descripcion ?? '', duracionDias: String(f.duracionDias), obligatoria: f.obligatoria });

export default function ProcesosSeleccion() {
  const [params, setParams] = useSearchParams();
  const ofertas = usePeticion(misOfertas);
  const ofertaId = params.get('oferta') || (ofertas.datos?.[0] ? String(ofertas.datos[0].id) : null);

  if (ofertas.cargando) return <Cargando />;
  if (ofertas.error) return <MensajeError mensaje={ofertas.error.message} onReintentar={ofertas.recargar} />;

  return (
    <>
      <div className="panel__cabecera">
        <h1>Procesos de selección</h1>
        <p className="texto-suave">Define las fases que verán los alumnos antes de inscribirse en cada oferta.</p>
      </div>
      {ofertas.datos.length ? (
        <>
          <div className="campo campo--estrecho">
            <label htmlFor="p-oferta">Oferta</label>
            <select id="p-oferta" className="entrada" value={ofertaId} onChange={(e) => setParams({ oferta: e.target.value }, { replace: true })}>
              {ofertas.datos.map((o) => <option key={o.id} value={o.id}>{o.titulo}{o.activa ? '' : ' (inactiva)'}</option>)}
            </select>
          </div>
          <EditorFases key={ofertaId} ofertaId={ofertaId} />
        </>
      ) : (
        <div className="vacio">
          <p>Crea una oferta para definir su proceso de selección.</p>
          <Link to="/panel/empresa/ofertas/nueva" className="boton boton--primario">Crear oferta</Link>
        </div>
      )}
    </>
  );
}

function EditorFases({ ofertaId }) {
  const toast = useToast();
  const oferta = usePeticion((o) => obtenerOferta(ofertaId, o), [ofertaId]);
  const [fases, setFases] = useState(null);
  const [original, setOriginal] = useState(null);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!oferta.datos) return;
    const inicial = oferta.datos.fases.map(aBorrador);
    setFases(inicial);
    setOriginal(JSON.stringify(inicial));
  }, [oferta.datos]);

  const cambiado = fases && JSON.stringify(fases) !== original;
  const totales = useMemo(() => {
    if (!fases) return null;
    const n = (f) => Number(f.duracionDias) || 0;
    return { min: fases.filter((f) => f.obligatoria).reduce((s, f) => s + n(f), 0), max: fases.reduce((s, f) => s + n(f), 0) };
  }, [fases]);

  if (oferta.cargando || !fases) return <Cargando />;
  if (oferta.error) return <MensajeError mensaje={oferta.error.message} onReintentar={oferta.recargar} />;

  const actualizar = (i, campo, valor) => setFases((l) => l.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  const mover = (i, d) => setFases((l) => { const n = [...l]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const quitar = (i) => setFases((l) => l.filter((_, j) => j !== i));
  const anadir = (f = { nombre: '', descripcion: '', duracionDias: 3, obligatoria: true }) => setFases((l) => [...l, aBorrador(f)]);

  function validarLocal() {
    const errs = {};
    fases.forEach((f, i) => {
      const e = {};
      if (!f.nombre.trim()) e.nombre = 'Pon un nombre a la fase.';
      const d = Number(f.duracionDias);
      if (f.duracionDias === '' || !Number.isInteger(d) || d < 0 || d > 365) e.duracionDias = 'Entre 0 y 365.';
      if (Object.keys(e).length) errs[i] = e;
    });
    return errs;
  }

  async function guardar(e) {
    e.preventDefault();
    const errs = validarLocal();
    setErrores(errs);
    if (Object.keys(errs).length) return toast('Revisa las fases marcadas.', 'error');
    setGuardando(true);
    try {
      const r = await guardarFases(ofertaId, fases.map((f) => ({ id: f.id, nombre: f.nombre.trim(), descripcion: f.descripcion.trim(), duracionDias: Number(f.duracionDias), obligatoria: f.obligatoria })));
      const guardadas = r.fases.map(aBorrador);
      setFases(guardadas);
      setOriginal(JSON.stringify(guardadas));
      toast('Proceso de selección guardado.');
    } catch (err) {
      if (err.detalles?.fases) setErrores(err.detalles.fases);
      toast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="pila" onSubmit={guardar} noValidate>
      {fases.length ? (
        <ol className="editor-fases">
          {fases.map((f, i) => (
            <li key={f.clave} className="tarjeta editor-fases__fase">
              <div className="editor-fases__orden">
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir la fase ${i + 1}`}><Icono nombre="arriba" tamano={16} /></button>
                <strong>{i + 1}</strong>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === fases.length - 1} aria-label={`Bajar la fase ${i + 1}`}><Icono nombre="abajo" tamano={16} /></button>
              </div>
              <div className="editor-fases__campos">
                <div className="campo">
                  <label htmlFor={`fn-${f.clave}`}>Nombre</label>
                  <input id={`fn-${f.clave}`} className={`entrada ${errores[i]?.nombre ? 'entrada--error' : ''}`} value={f.nombre} maxLength={100} onChange={(e) => actualizar(i, 'nombre', e.target.value)} />
                  {errores[i]?.nombre && <span className="campo__error">{errores[i].nombre}</span>}
                </div>
                <div className="campo">
                  <label htmlFor={`fd-${f.clave}`}>Descripción</label>
                  <input id={`fd-${f.clave}`} className="entrada" value={f.descripcion} maxLength={500} onChange={(e) => actualizar(i, 'descripcion', e.target.value)} />
                </div>
              </div>
              <div className="editor-fases__extra">
                <div className="campo">
                  <label htmlFor={`fdias-${f.clave}`}>Duración (días)</label>
                  <input id={`fdias-${f.clave}`} type="number" min="0" max="365" className={`entrada ${errores[i]?.duracionDias ? 'entrada--error' : ''}`} value={f.duracionDias} onChange={(e) => actualizar(i, 'duracionDias', e.target.value)} />
                  {errores[i]?.duracionDias && <span className="campo__error">{errores[i].duracionDias}</span>}
                </div>
                <label className="casilla"><input type="checkbox" checked={f.obligatoria} onChange={(e) => actualizar(i, 'obligatoria', e.target.checked)} /> Obligatoria</label>
                <Boton variante="fantasma" tamano="pequeno" onClick={() => quitar(i)}><Icono nombre="papelera" tamano={15} /> Quitar</Boton>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="vacio">
          <p>Esta oferta no tiene fases definidas.</p>
          <Boton variante="secundario" onClick={() => setFases(PLANTILLA.map(aBorrador))}>Usar fases habituales</Boton>
        </div>
      )}
      <div className="fila-botones fila-botones--separada">
        <Boton variante="secundario" onClick={() => anadir()} disabled={fases.length >= 20}><Icono nombre="mas" tamano={16} /> Añadir fase</Boton>
        {fases.length > 0 && <span className="texto-suave">Duración estimada: <strong>{totales.min === totales.max ? `${totales.max} días` : `${totales.min} a ${totales.max} días`}</strong></span>}
      </div>
      <div className="fila-botones">
        <Boton type="submit" disabled={guardando || !cambiado}>{guardando ? 'Guardando…' : 'Guardar proceso'}</Boton>
        <Boton variante="fantasma" disabled={!cambiado || guardando} onClick={() => { setFases(JSON.parse(original)); setErrores({}); }}>Descartar cambios</Boton>
        <Link to={`/ofertas/${ofertaId}`} className="boton boton--fantasma">Ver cómo lo ven los alumnos</Link>
      </div>
    </form>
  );
}
