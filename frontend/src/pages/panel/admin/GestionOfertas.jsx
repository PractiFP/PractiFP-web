// Gestión de ofertas: activar, desactivar o eliminar contenido inapropiado.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDiferido } from '../../../hooks/useDiferido.js';
import { useListaEditable } from '../../../hooks/useListaEditable.js';
import * as admin from '../../../services/adminService.js';
import { formatearFecha } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Pastilla from '../../../components/Pastilla.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

const estadoOferta = (o) => (o.abierta ? <Pastilla tipo="ok">Abierta</Pastilla> : o.activa ? <Pastilla tipo="aviso">Plazo cerrado</Pastilla> : <Pastilla tipo="error">Inactiva</Pastilla>);

export default function GestionOfertas() {
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');
  const q = useDiferido(texto.trim());
  const { lista, cargando, error, recargar, actualizar, quitar } = useListaEditable((o) => admin.ofertas({ q, estado }, o), [q, estado]);
  const [ocupada, setOcupada] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  async function alternar(o) {
    setOcupada(o.id);
    try {
      await admin.cambiarActivaOferta(o.id, !o.activa);
      actualizar(o.id, { activa: !o.activa, abierta: !o.activa && o.fechaLimite >= new Date().toLocaleDateString('sv-SE') });
      toast(o.activa ? 'Oferta desactivada.' : 'Oferta activada.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  async function eliminar() {
    setOcupada(aEliminar.id);
    try {
      await admin.eliminarOferta(aEliminar.id);
      quitar(aEliminar.id);
      toast('Oferta eliminada.');
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
        <h1>Gestión de ofertas</h1>
        <p className="texto-suave">Desactiva o elimina las ofertas con contenido inapropiado.</p>
      </div>
      <div className="fila-formulario">
        <div className="campo">
          <label htmlFor="o-q">Buscar</label>
          <input id="o-q" type="search" className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Título o empresa" />
        </div>
        <div className="campo">
          <label htmlFor="o-estado">Estado</label>
          <select id="o-estado" className="entrada" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todas</option>
            <option value="abiertas">Abiertas</option>
            <option value="cerradas">Plazo cerrado</option>
            <option value="inactivas">Inactivas</option>
          </select>
        </div>
      </div>

      {cargando && !lista && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Oferta</th><th>Empresa</th><th>Publicada</th><th>Estado</th><th>Candidaturas</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/ofertas/${o.id}`} className="enlace-fuerte">{o.titulo}</Link><div className="texto-suave texto-pequeno"><span className="ciclo">{o.ciclo}</span> {o.localidad}</div></td>
                  <td><Link to={`/empresas/${o.empresa.id}`}>{o.empresa.nombre}</Link></td>
                  <td className="sin-salto">{formatearFecha(o.fechaPublicacion)}</td>
                  <td>{estadoOferta(o)}</td>
                  <td>{o.candidaturas}</td>
                  <td className="tabla__acciones">
                    <Boton variante="secundario" tamano="pequeno" disabled={ocupada === o.id} onClick={() => alternar(o)}>{o.activa ? 'Desactivar' : 'Activar'}</Boton>{' '}
                    <Boton variante="peligro" tamano="pequeno" disabled={ocupada === o.id} onClick={() => setAEliminar(o)} aria-label={`Eliminar ${o.titulo}`}><Icono nombre="papelera" tamano={15} /></Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="vacio"><p>No hay ofertas con estos filtros.</p></div>)}

      {aEliminar && (
        <ModalConfirmar titulo="Eliminar oferta" onCerrar={() => setAEliminar(null)} onConfirmar={eliminar} enviando={ocupada === aEliminar.id}>
          <p>Se eliminará <strong>{aEliminar.titulo}</strong> de {aEliminar.empresa.nombre}{aEliminar.candidaturas > 0 && <> junto con sus <strong>{aEliminar.candidaturas} candidaturas</strong></>}. Esta acción no se puede deshacer.</p>
          {aEliminar.activa && <p className="texto-suave">Si solo quieres ocultarla mientras se revisa, desactívala.</p>}
        </ModalConfirmar>
      )}
    </>
  );
}
