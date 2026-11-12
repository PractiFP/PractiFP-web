// Moderación de valoraciones: aprobar, rechazar o eliminar.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import * as admin from '../../../services/adminService.js';
import { formatearFechaHora } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Estrellas from '../../../components/Estrellas.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

const PESTANAS = [['PENDIENTE', 'Pendientes'], ['APROBADA', 'Aprobadas'], ['RECHAZADA', 'Rechazadas']];

export default function ModeracionValoraciones() {
  const toast = useToast();
  const [estado, setEstado] = useState('PENDIENTE');
  const peticion = usePeticion((o) => admin.valoraciones(estado, o), [estado]);
  const [datos, setDatos] = useState(null);
  const [ocupada, setOcupada] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  useEffect(() => setDatos(peticion.datos), [peticion.datos]);

  /** Quita la valoración de la pestaña actual y actualiza los contadores. */
  function mover(v, nuevo) {
    setDatos((d) => ({
      ...d,
      valoraciones: d.valoraciones.filter((x) => x.id !== v.id),
      totales: { ...d.totales, [v.estado]: d.totales[v.estado] - 1, ...(nuevo ? { [nuevo]: d.totales[nuevo] + 1 } : {}) },
    }));
  }

  async function moderar(v, nuevo) {
    setOcupada(v.id);
    try {
      await admin.moderarValoracion(v.id, nuevo);
      mover(v, nuevo);
      toast(nuevo === 'APROBADA' ? 'Valoración aprobada y publicada.' : nuevo === 'RECHAZADA' ? 'Valoración rechazada.' : 'Valoración devuelta a pendientes.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  async function eliminar() {
    setOcupada(aEliminar.id);
    try {
      await admin.eliminarValoracion(aEliminar.id);
      mover(aEliminar, null);
      toast('Valoración eliminada.');
      setAEliminar(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>Moderación de valoraciones</h1>
        <p className="texto-suave">Las valoraciones solo se publican en la ficha de la empresa cuando las apruebas.</p>
      </div>
      <div className="pestanas" role="tablist" aria-label="Estado de las valoraciones">
        {PESTANAS.map(([valor, texto]) => (
          <button key={valor} type="button" role="tab" aria-selected={estado === valor} className={estado === valor ? 'activa' : ''} onClick={() => setEstado(valor)}>
            {texto}{datos?.totales && <span className="pestanas__n">{datos.totales[valor]}</span>}
          </button>
        ))}
      </div>

      {peticion.cargando && <Cargando />}
      {peticion.error && <MensajeError mensaje={peticion.error.message} onReintentar={peticion.recargar} />}
      {datos && !peticion.cargando && datos.estado === estado && (datos.valoraciones.length ? (
        <ul className="lista-moderacion">
          {datos.valoraciones.map((v) => (
            <li key={v.id} className="tarjeta pila pila--compacta">
              <div className="lista-moderacion__cabecera">
                <div>
                  <strong>{v.alumno.nombre}</strong> <span className="texto-suave">valoró a</span> <Link to={`/empresas/${v.empresa.id}`} className="enlace-fuerte">{v.empresa.nombre}</Link>
                  <div className="texto-suave texto-pequeno">{v.alumno.email} · {formatearFechaHora(v.fecha)}</div>
                </div>
                <Estrellas valor={v.puntuacion} />
              </div>
              <p className="perfil__descripcion">{v.comentario}</p>
              <div className="fila-botones">
                {v.estado !== 'APROBADA' && <Boton tamano="pequeno" disabled={ocupada === v.id} onClick={() => moderar(v, 'APROBADA')}><Icono nombre="check" tamano={15} /> Aprobar</Boton>}
                {v.estado !== 'RECHAZADA' && <Boton variante="peligro" tamano="pequeno" disabled={ocupada === v.id} onClick={() => moderar(v, 'RECHAZADA')}><Icono nombre="x" tamano={15} /> Rechazar</Boton>}
                {v.estado !== 'PENDIENTE' && <Boton variante="fantasma" tamano="pequeno" disabled={ocupada === v.id} onClick={() => moderar(v, 'PENDIENTE')}>Devolver a pendientes</Boton>}
                <Boton variante="fantasma" tamano="pequeno" disabled={ocupada === v.id} onClick={() => setAEliminar(v)}><Icono nombre="papelera" tamano={15} /> Eliminar</Boton>
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="vacio"><p>{estado === 'PENDIENTE' ? 'No hay valoraciones pendientes de moderar.' : 'No hay valoraciones en esta lista.'}</p></div>)}

      {aEliminar && (
        <ModalConfirmar titulo="Eliminar valoración" onCerrar={() => setAEliminar(null)} onConfirmar={eliminar} enviando={ocupada === aEliminar.id}>
          <p>Se eliminará la valoración de <strong>{aEliminar.alumno.nombre}</strong> sobre {aEliminar.empresa.nombre}. El alumno podrá volver a valorar la empresa.</p>
        </ModalConfirmar>
      )}
    </>
  );
}
