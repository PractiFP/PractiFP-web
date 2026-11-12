// Ofertas de la empresa: activar/desactivar, editar y eliminar.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { misOfertas, cambiarEstadoOferta, eliminarOferta } from '../../../services/ofertasService.js';
import { formatearFecha, textoModalidad, textoPlazas } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Icono from '../../../components/Icono.jsx';
import Boton from '../../../components/Boton.jsx';
import PlazoOferta from '../../../components/PlazoOferta.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

export default function MisOfertas() {
  const toast = useToast();
  const { datos, cargando, error, recargar } = usePeticion(misOfertas);
  const [ofertas, setOfertas] = useState(null);
  const [ocupada, setOcupada] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const lista = ofertas ?? datos;

  async function alternar(oferta) {
    setOcupada(oferta.id);
    try {
      const actualizada = await cambiarEstadoOferta(oferta.id, !oferta.activa);
      setOfertas(lista.map((o) => (o.id === oferta.id ? { ...o, ...actualizada } : o)));
      toast(actualizada.activa ? 'Oferta activada.' : 'Oferta desactivada.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  async function eliminar() {
    setOcupada(aEliminar.id);
    try {
      await eliminarOferta(aEliminar.id);
      setOfertas(lista.filter((o) => o.id !== aEliminar.id));
      toast('Oferta eliminada.');
      setAEliminar(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  async function desactivarEnLugar() {
    const oferta = aEliminar;
    setAEliminar(null);
    await alternar(oferta);
  }

  return (
    <>
      <div className="panel__cabecera panel__cabecera--acciones">
        <div>
          <h1>Mis ofertas</h1>
          {lista && <p className="texto-suave">{lista.length} {lista.length === 1 ? 'oferta publicada' : 'ofertas publicadas'} · {lista.filter((o) => o.abierta).length} abiertas</p>}
        </div>
        <Link to="/panel/empresa/ofertas/nueva" className="boton boton--primario"><Icono nombre="mas" tamano={16} /> Crear oferta</Link>
      </div>

      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Oferta</th><th>Activa</th><th>Plazo</th><th>Candidaturas</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/ofertas/${o.id}`} className="enlace-fuerte">{o.titulo}</Link>
                    <div className="texto-suave texto-pequeno"><span className="ciclo">{o.ciclo.codigo}</span> {textoModalidad(o.modalidad)} · {textoPlazas(o.plazas)} · publicada el {formatearFecha(o.fechaPublicacion, true)}</div>
                  </td>
                  <td>
                    <label className="interruptor">
                      <input type="checkbox" checked={o.activa} disabled={ocupada === o.id} onChange={() => alternar(o)} aria-label={`${o.activa ? 'Desactivar' : 'Activar'} ${o.titulo}`} />
                      <span aria-hidden="true" />
                    </label>
                  </td>
                  <td className="sin-salto"><PlazoOferta oferta={o} /><div className="texto-suave texto-pequeno">hasta el {formatearFecha(o.fechaLimite, true)}</div></td>
                  <td>
                    {o.candidaturas > 0
                      ? <Link to={`/panel/empresa/candidatos?oferta=${o.id}`} className="enlace-fuerte">{o.candidaturas} {o.candidaturas === 1 ? 'candidato' : 'candidatos'}</Link>
                      : <span className="texto-suave">0</span>}
                    {o.sinRevisar > 0 && <span className="texto-suave texto-pequeno"> · {o.sinRevisar} sin revisar</span>}
                  </td>
                  <td className="tabla__acciones">
                    <Link to={`/panel/empresa/ofertas/${o.id}/editar`} className="boton boton--secundario boton--pequeno"><Icono nombre="editar" tamano={15} /> Editar</Link>{' '}
                    <Link to={`/panel/empresa/procesos?oferta=${o.id}`} className="boton boton--secundario boton--pequeno" aria-label={`Proceso de selección de ${o.titulo}`} title="Proceso de selección"><Icono nombre="capas" tamano={15} /></Link>{' '}
                    <Boton variante="peligro" tamano="pequeno" onClick={() => setAEliminar(o)} disabled={ocupada === o.id} aria-label={`Eliminar ${o.titulo}`}>
                      <Icono nombre="papelera" tamano={15} />
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vacio">
          <p>Todavía no has publicado ninguna oferta.</p>
          <Link to="/panel/empresa/ofertas/nueva" className="boton boton--primario">Crear la primera</Link>
        </div>
      ))}

      {aEliminar && (
        <ModalConfirmar titulo="Eliminar oferta" onCerrar={() => setAEliminar(null)} onConfirmar={eliminar} enviando={ocupada === aEliminar.id}>
          <p>Se eliminará <strong>{aEliminar.titulo}</strong>{aEliminar.candidaturas > 0 && <> junto con sus <strong>{aEliminar.candidaturas} candidaturas</strong></>}. Esta acción no se puede deshacer.</p>
          {aEliminar.candidaturas > 0 && aEliminar.activa && (
            <div className="aviso">
              <Icono nombre="info" />
              <div className="pila pila--compacta">
                <p>Si solo quieres dejar de recibir candidatos, es mejor desactivarla: conservarás el historial.</p>
                <div><Boton variante="secundario" tamano="pequeno" onClick={desactivarEnLugar}>Desactivar en lugar de eliminar</Boton></div>
              </div>
            </div>
          )}
        </ModalConfirmar>
      )}
    </>
  );
}
