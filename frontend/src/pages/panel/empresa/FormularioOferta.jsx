// Crear o editar una oferta (la misma pantalla sirve para ambas cosas).
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { obtenerOferta, crearOferta, actualizarOferta } from '../../../services/ofertasService.js';
import { listarCiclos } from '../../../services/ciclosService.js';
import { listarTecnologias } from '../../../services/tecnologiasService.js';
import { validar, reglas } from '../../../utils/validadores.js';
import { MODALIDADES, hoyISO } from '../../../utils/formato.js';
import Campo from '../../../components/Campo.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';

const sinOferta = () => Promise.resolve(null);

export default function FormularioOferta() {
  const { id } = useParams();
  const ciclos = usePeticion(listarCiclos);
  const tecnologias = usePeticion(listarTecnologias);
  const oferta = usePeticion((o) => (id ? obtenerOferta(id, o) : sinOferta()), [id]);

  const peticiones = [ciclos, tecnologias, oferta];
  if (peticiones.some((p) => p.cargando)) return <Cargando />;
  const fallo = peticiones.find((p) => p.error);
  if (fallo) return <MensajeError mensaje={fallo.error.message} onReintentar={() => peticiones.forEach((p) => p.recargar())} />;
  if (id && !oferta.datos.esPropia) return <MensajeError titulo="No puedes editar esta oferta" mensaje="Solo la empresa que la publicó puede modificarla." />;

  return <Formulario key={id || 'nueva'} oferta={oferta.datos} ciclos={ciclos.datos} catalogo={tecnologias.datos} />;
}

function Formulario({ oferta, ciclos, catalogo }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const editando = Boolean(oferta);
  const [datos, setDatos] = useState(() => ({
    titulo: oferta?.titulo ?? '',
    descripcion: oferta?.descripcion ?? '',
    cicloId: oferta ? String(oferta.ciclo.id) : '',
    localidad: oferta?.localidad ?? '',
    modalidad: oferta?.modalidad ?? 'PRESENCIAL',
    remunerada: oferta?.remunerada ?? true,
    salario: oferta?.salario != null ? String(oferta.salario) : '',
    plazas: oferta ? String(oferta.plazas) : '1',
    fechaLimite: oferta?.fechaLimite ?? '',
    activa: oferta?.activa ?? true,
  }));
  const [tecs, setTecs] = useState(() => oferta?.tecnologias.map((t) => ({ id: t.id, nombre: t.nombre, obligatoria: t.obligatoria })) ?? []);
  const [tecNueva, setTecNueva] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const disponibles = useMemo(() => catalogo.filter((t) => !tecs.some((x) => x.id === t.id)), [catalogo, tecs]);
  const fechaMinima = oferta?.fechaPublicacion ?? hoyISO();

  const cambiar = (e) => {
    const { name, type, checked, value } = e.target;
    setDatos((d) => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  };

  function anadirTecnologia() {
    const id = Number(tecNueva || disponibles[0]?.id);
    const t = catalogo.find((x) => x.id === id);
    if (!t) return;
    setTecs((l) => [...l, { id: t.id, nombre: t.nombre, obligatoria: true }]);
    setTecNueva('');
    setErrores((e) => ({ ...e, tecnologias: undefined }));
  }

  async function enviar(e) {
    e.preventDefault();
    const errs = validar({ ...datos, tecnologias: tecs }, {
      titulo: [reglas.requerido(), reglas.longitudMax(150)],
      descripcion: [reglas.requerido(), reglas.longitudMin(20, 'Describe la oferta con al menos 20 caracteres.'), reglas.longitudMax(5000)],
      cicloId: [reglas.requerido('Elige el ciclo formativo.')],
      localidad: [reglas.requerido(), reglas.longitudMax(100)],
      salario: datos.remunerada ? [reglas.requerido('Indica el salario mensual.'), reglas.numeroEntre(0, 99999, 'El salario no puede ser negativo.')] : [],
      plazas: [reglas.requerido(), (v) => (!(Number.isInteger(Number(v)) && Number(v) > 0 && Number(v) <= 999) ? 'Indica un número de plazas entre 1 y 999.' : null)],
      fechaLimite: [reglas.requerido('Indica la fecha límite.'), (v) => (v && v < fechaMinima ? (editando ? 'No puede ser anterior a la fecha de publicación.' : 'No puede ser anterior a hoy.') : null)],
      tecnologias: [(v) => (!v.length ? 'Añade al menos una tecnología.' : null)],
    });
    setErrores(errs);
    if (Object.keys(errs).length) return toast('Revisa los campos marcados.', 'error');

    const cuerpo = {
      ...datos,
      cicloId: Number(datos.cicloId),
      plazas: Number(datos.plazas),
      salario: datos.remunerada ? Number(String(datos.salario).replace(',', '.')) : null,
      tecnologias: tecs.map(({ id, obligatoria }) => ({ id, obligatoria })),
    };
    setEnviando(true);
    try {
      const guardada = editando ? await actualizarOferta(oferta.id, cuerpo) : await crearOferta(cuerpo);
      toast(editando ? 'Oferta actualizada.' : 'Oferta publicada. Ahora puedes definir su proceso de selección.');
      navigate(editando ? '/panel/empresa/ofertas' : `/panel/empresa/procesos?oferta=${guardada.id}`);
    } catch (err) {
      if (err.detalles) setErrores(err.detalles);
      toast(err.message, 'error');
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>{editando ? 'Editar oferta' : 'Crear oferta'}</h1>
        <p className="texto-suave">{editando ? oferta.titulo : 'Los campos marcados con * son obligatorios.'}</p>
      </div>
      {!editando && !usuario.verificada && (
        <p className="aviso"><Icono nombre="info" /> Tu empresa aún no está verificada: la oferta se publicará con la etiqueta «Sin verificar».</p>
      )}

      <form className="tarjeta formulario" onSubmit={enviar} noValidate>
        <Campo etiqueta="Título *" name="titulo" value={datos.titulo} onChange={cambiar} error={errores.titulo} placeholder="Ej.: Desarrollo web con React" />
        <Campo como="textarea" etiqueta="Descripción *" name="descripcion" value={datos.descripcion} onChange={cambiar} error={errores.descripcion}
          maxLength={5000} rows={6} placeholder="Qué hará el alumno, con qué equipo trabajará y qué aprenderá." />
        <div className="rejilla-3">
          <Campo como="select" etiqueta="Ciclo formativo *" name="cicloId" value={datos.cicloId} onChange={cambiar} error={errores.cicloId}
            opciones={[{ valor: '', texto: 'Elige un ciclo' }, ...ciclos.map((c) => ({ valor: String(c.id), texto: `${c.codigo} · ${c.nombre}` }))]} />
          <Campo etiqueta="Localidad *" name="localidad" value={datos.localidad} onChange={cambiar} error={errores.localidad} />
          <Campo etiqueta="Plazas *" name="plazas" tipo="number" min="1" max="999" value={datos.plazas} onChange={cambiar} error={errores.plazas} />
        </div>

        <fieldset className="grupo">
          <legend>Modalidad *</legend>
          <div className="opciones-tarjeta opciones-tarjeta--3">
            {MODALIDADES.map((m) => (
              <label key={m.valor}><input type="radio" name="modalidad" value={m.valor} checked={datos.modalidad === m.valor} onChange={cambiar} /><span><strong>{m.texto}</strong></span></label>
            ))}
          </div>
        </fieldset>

        <div className="rejilla-3 rejilla--abajo">
          <label className="casilla"><input type="checkbox" name="remunerada" checked={datos.remunerada} onChange={cambiar} /> Prácticas remuneradas</label>
          <Campo etiqueta="Salario mensual (€)" name="salario" tipo="number" min="0" step="10" value={datos.salario} onChange={cambiar} error={errores.salario} disabled={!datos.remunerada} />
          <Campo etiqueta="Fecha límite de inscripción *" name="fechaLimite" tipo="date" min={fechaMinima} value={datos.fechaLimite} onChange={cambiar} error={errores.fechaLimite} />
        </div>

        <fieldset className="grupo">
          <legend>Tecnologías requeridas *</legend>
          {tecs.length > 0 && (
            <ul className="lista-editable">
              {tecs.map((t) => (
                <li key={t.id}>
                  <strong>{t.nombre}</strong>
                  <label className="casilla">
                    <input type="checkbox" checked={t.obligatoria} onChange={(e) => setTecs((l) => l.map((x) => (x.id === t.id ? { ...x, obligatoria: e.target.checked } : x)))} />
                    Obligatoria
                  </label>
                  <Boton variante="fantasma" tamano="pequeno" onClick={() => setTecs((l) => l.filter((x) => x.id !== t.id))} aria-label={`Quitar ${t.nombre}`}>
                    <Icono nombre="x" tamano={16} />
                  </Boton>
                </li>
              ))}
            </ul>
          )}
          <div className="fila-formulario">
            <div className="campo">
              <label htmlFor="tec-nueva">Añadir tecnología</label>
              <select id="tec-nueva" className="entrada" value={tecNueva} onChange={(e) => setTecNueva(e.target.value)} disabled={!disponibles.length}>
                {disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <Boton variante="secundario" onClick={anadirTecnologia} disabled={!disponibles.length}><Icono nombre="mas" tamano={16} /> Añadir</Boton>
          </div>
          <p className="campo__ayuda">Desmarca «Obligatoria» en las tecnologías que solo se valoran.</p>
          {errores.tecnologias && <p className="campo__error">{errores.tecnologias}</p>}
        </fieldset>

        <label className="casilla"><input type="checkbox" name="activa" checked={datos.activa} onChange={cambiar} /> Oferta activa (visible para los alumnos)</label>
        <div className="fila-botones">
          <Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar oferta'}</Boton>
          <Link to="/panel/empresa/ofertas" className="boton boton--fantasma">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
