// Candidaturas del alumno con su estado y la fase del proceso en la que está.
import { Link } from 'react-router-dom';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { misCandidaturas } from '../../../services/candidaturasService.js';
import { formatearFechaHora, textoModalidad, ESTADOS_CANDIDATURA } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import LogoEmpresa from '../../../components/LogoEmpresa.jsx';
import EstadoCandidatura from '../../../components/EstadoCandidatura.jsx';
import ProgresoCandidatura from '../../../components/ProgresoCandidatura.jsx';
import Icono from '../../../components/Icono.jsx';
import Boton from '../../../components/Boton.jsx';
import Modal from '../../../components/Modal.jsx';
import ProcesoSeleccion from '../../../components/ProcesoSeleccion.jsx';
import { obtenerOferta } from '../../../services/ofertasService.js';
import { useEffect, useState } from 'react';
import ModalValorar from '../../../components/ModalValorar.jsx';

export default function MisCandidaturas() {
  const peticion = usePeticion(misCandidaturas);
  const { cargando, error, recargar } = peticion;
  const [datos, setDatos] = useState(null);
  useEffect(() => setDatos(peticion.datos), [peticion.datos]);
  const [proceso, setProceso] = useState(null);
  const [valorar, setValorar] = useState(null);
  // Tras valorar, todas las candidaturas de esa empresa muestran la valoración como pendiente
  const valorada = (empresaId) => setDatos((l) => l.map((c) => (c.empresa.id === empresaId ? { ...c, miValoracion: 'PENDIENTE' } : c)));

  return (
    <>
      <div className="panel__cabecera">
        <h1>Mis candidaturas</h1>
        {datos && (
          <p className="texto-suave">
            {datos.length} {datos.length === 1 ? 'inscripción' : 'inscripciones'}
            {datos.length > 0 && ' · ' + ESTADOS_CANDIDATURA.map((e) => [e, datos.filter((c) => c.estado === e.valor).length])
              .filter(([, n]) => n).map(([e, n]) => `${n} ${e.texto.toLowerCase()}`).join(', ')}
          </p>
        )}
      </div>
      {cargando && !datos && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {datos && (datos.length ? (
        <ul className="lista-candidaturas">
          {datos.map((c) => (
            <li key={c.id} className="tarjeta candidatura">
              <LogoEmpresa empresa={c.empresa} />
              <div className="candidatura__cuerpo">
                <div className="candidatura__titulo">
                  <Link to={`/ofertas/${c.oferta.id}`} className="enlace-fuerte">{c.oferta.titulo}</Link>
                  <EstadoCandidatura estado={c.estado} />
                </div>
                <p className="texto-suave texto-pequeno">
                  <Link to={`/empresas/${c.empresa.id}`}>{c.empresa.nombre}</Link> · <span className="ciclo">{c.oferta.ciclo}</span> {c.oferta.localidad} · {textoModalidad(c.oferta.modalidad)} · inscrito el {formatearFechaHora(c.fecha)}
                </p>
                <ProgresoCandidatura estado={c.estado} />
                {c.faseActual && c.estado !== 'RECHAZADA' && c.estado !== 'ACEPTADA' && (
                  <p className="nota"><Icono nombre="capas" tamano={15} /> Fase actual del proceso: <strong>{c.faseActual.nombre}</strong> ({c.faseActual.orden} de {c.totalFases})</p>
                )}
                <div className="fila-botones">
                  {c.totalFases > 0 && <Boton variante="fantasma" tamano="pequeno" onClick={() => setProceso(c)}><Icono nombre="capas" tamano={15} /> Ver el proceso de selección</Boton>}
                  {c.estado === 'ACEPTADA' && !c.miValoracion && (
                    <Boton variante="secundario" tamano="pequeno" onClick={() => setValorar(c.empresa)}><Icono nombre="estrella" tamano={15} /> Valorar {c.empresa.nombre}</Boton>
                  )}
                  {c.estado === 'ACEPTADA' && c.miValoracion && (
                    <span className="texto-suave texto-pequeno"><Icono nombre="estrella" tamano={14} /> Valoración {c.miValoracion === 'PENDIENTE' ? 'pendiente de moderación' : c.miValoracion === 'APROBADA' ? 'publicada' : 'no publicada'}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="vacio">
          <p>Todavía no te has inscrito en ninguna oferta.</p>
          <Link to="/ofertas" className="boton boton--primario">Buscar ofertas</Link>
        </div>
      ))}
      {proceso && <ModalProceso candidatura={proceso} onCerrar={() => setProceso(null)} />}
      {valorar && <ModalValorar empresa={valorar} onCerrar={() => setValorar(null)} onValorada={() => { valorada(valorar.id); setValorar(null); }} />}
    </>
  );
}

function ModalProceso({ candidatura, onCerrar }) {
  const { datos, cargando, error } = usePeticion((o) => obtenerOferta(candidatura.oferta.id, o), [candidatura.oferta.id]);
  const faseActual = datos?.fases.find((f) => f.nombre === candidatura.faseActual?.nombre && f.orden === candidatura.faseActual?.orden);
  return (
    <Modal titulo={`Proceso · ${candidatura.oferta.titulo}`} onCerrar={onCerrar}>
      {cargando && !datos && <Cargando />}
      {error && <MensajeError mensaje={error.message} />}
      {datos && <ProcesoSeleccion fases={datos.fases} resumen={datos.resumenFases} faseActualId={faseActual?.id} />}
    </Modal>
  );
}
