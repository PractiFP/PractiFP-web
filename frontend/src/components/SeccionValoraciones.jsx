// Valoraciones de una empresa: media, distribución, comentarios y botón para valorar.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { valoracionesEmpresa } from '../services/valoracionesService.js';
import { formatearFechaHora } from '../utils/formato.js';
import Cargando from './Cargando.jsx';
import MensajeError from './MensajeError.jsx';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';
import Estrellas from './Estrellas.jsx';
import ModalValorar from './ModalValorar.jsx';

const ESTADO = { PENDIENTE: 'pendiente de moderación', APROBADA: 'publicada', RECHAZADA: 'no publicada por el equipo de moderación' };

export function ResumenValoraciones({ resumen }) {
  if (!resumen.total) return null;
  return (
    <div className="resumen-valoraciones">
      <div className="resumen-valoraciones__media">
        <strong>{resumen.media.toLocaleString('es-ES')}</strong>
        <Estrellas valor={resumen.media} />
        <span className="texto-suave">{resumen.total} {resumen.total === 1 ? 'valoración' : 'valoraciones'}</span>
      </div>
      <ul className="resumen-valoraciones__barras" aria-label="Distribución de puntuaciones">
        {[5, 4, 3, 2, 1].map((n) => (
          <li key={n}>
            <span>{n}</span>
            <span className="barras__pista" aria-hidden="true"><span className="barras__valor" style={{ width: `${(resumen.distribucion[n] / resumen.total) * 100}%` }} /></span>
            <span className="visualmente-oculto">{n} estrellas:</span>
            <span>{resumen.distribucion[n]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ListaValoraciones({ valoraciones }) {
  return (
    <ul className="lista-valoraciones">
      {valoraciones.map((v) => (
        <li key={v.id}>
          <div className="lista-valoraciones__cabecera">
            <strong>{v.autor}</strong>
            {v.ciclo && <span className="ciclo">{v.ciclo}</span>}
            <Estrellas valor={v.puntuacion} tamano={14} />
            <span className="texto-suave texto-pequeno">{formatearFechaHora(v.fecha)}</span>
          </div>
          <p>{v.comentario}</p>
        </li>
      ))}
    </ul>
  );
}

export default function SeccionValoraciones({ empresa }) {
  const { usuario } = useAuth();
  const peticion = usePeticion((o) => valoracionesEmpresa(empresa.id, o), [empresa.id, usuario?.id]);
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(false);
  useEffect(() => setDatos(peticion.datos), [peticion.datos]);

  let accion = null;
  if (datos && usuario?.rol === 'ALUMNO') {
    if (datos.miValoracion) {
      accion = <p className="nota"><Icono nombre="check" tamano={16} /> Ya valoraste esta empresa con {datos.miValoracion.puntuacion} {datos.miValoracion.puntuacion === 1 ? 'estrella' : 'estrellas'}: {ESTADO[datos.miValoracion.estado]}.</p>;
    } else if (datos.puedeValorar) {
      accion = <Boton onClick={() => setAbierto(true)}><Icono nombre="estrella" tamano={16} /> Valorar empresa</Boton>;
    } else {
      accion = <p className="nota"><Icono nombre="candado" tamano={16} /> Solo pueden valorar los alumnos con una candidatura aceptada en esta empresa.</p>;
    }
  }

  return (
    <section className="tarjeta pila" id="valoraciones" aria-labelledby="titulo-valoraciones">
      <div className="tarjeta__cabecera">
        <h2 id="titulo-valoraciones" className="tarjeta__titulo">Valoraciones de alumnos</h2>
        {accion}
      </div>
      {peticion.cargando && !datos && <Cargando />}
      {peticion.error && <MensajeError mensaje={peticion.error.message} onReintentar={peticion.recargar} />}
      {datos && (datos.valoraciones.length ? (
        <>
          <ResumenValoraciones resumen={datos.resumen} />
          <ListaValoraciones valoraciones={datos.valoraciones} />
        </>
      ) : <p className="texto-suave">Todavía no hay valoraciones publicadas.</p>)}
      {abierto && (
        <ModalValorar empresa={empresa} onCerrar={() => setAbierto(false)}
          onValorada={(v) => { setAbierto(false); setDatos((d) => ({ ...d, miValoracion: v, puedeValorar: false })); }} />
      )}
    </section>
  );
}
