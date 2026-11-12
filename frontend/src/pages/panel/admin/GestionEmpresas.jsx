// Gestión de empresas: verificación y estado de la cuenta.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDiferido } from '../../../hooks/useDiferido.js';
import { useListaEditable } from '../../../hooks/useListaEditable.js';
import * as admin from '../../../services/adminService.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Pastilla from '../../../components/Pastilla.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

export default function GestionEmpresas() {
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [verificada, setVerificada] = useState('');
  const q = useDiferido(texto.trim());
  const { lista, cargando, error, recargar, actualizar } = useListaEditable((o) => admin.empresas({ q, verificada }, o), [q, verificada]);
  const [ocupada, setOcupada] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);

  async function ejecutar(e, accion, cambios, mensaje) {
    setOcupada(e.id);
    try {
      await accion();
      actualizar(e.id, cambios);
      toast(mensaje);
      setADesactivar(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }
  const verificar = (e, v) => ejecutar(e, () => admin.cambiarVerificada(e.id, v), { verificada: v }, v ? `${e.nombre} verificada.` : `Verificación de ${e.nombre} retirada.`);
  const activar = (e, v) => ejecutar(e, () => admin.cambiarActivoUsuario(e.usuarioId, v), { activo: v }, v ? `Cuenta de ${e.nombre} activada.` : `Cuenta de ${e.nombre} desactivada.`);

  return (
    <>
      <div className="panel__cabecera">
        <h1>Gestión de empresas</h1>
        <p className="texto-suave">Verifica las empresas y gestiona sus cuentas.</p>
      </div>
      <div className="fila-formulario">
        <div className="campo">
          <label htmlFor="e-q">Buscar</label>
          <input id="e-q" type="search" className="entrada" value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Nombre, correo o localidad" />
        </div>
        <div className="campo">
          <label htmlFor="e-ver">Verificación</label>
          <select id="e-ver" className="entrada" value={verificada} onChange={(ev) => setVerificada(ev.target.value)}>
            <option value="">Todas</option>
            <option value="si">Verificadas</option>
            <option value="no">Sin verificar</option>
          </select>
        </div>
      </div>

      {cargando && !lista && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Empresa</th><th>Ofertas</th><th>Valoración</th><th>Verificación</th><th>Cuenta</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={`/empresas/${e.id}`} className="enlace-fuerte">{e.nombre}</Link>
                    <div className="texto-suave texto-pequeno">{e.email} · {e.localidad}</div>
                  </td>
                  <td className="sin-salto">{e.ofertasAbiertas} abiertas · {e.ofertas} total</td>
                  <td>{e.valoracionMedia ?? <span className="texto-suave">—</span>}</td>
                  <td>{e.verificada ? <Pastilla tipo="ok">Verificada</Pastilla> : <Pastilla tipo="aviso">Pendiente</Pastilla>}</td>
                  <td>{e.activo ? <Pastilla tipo="ok">Activa</Pastilla> : <Pastilla tipo="error">Desactivada</Pastilla>}</td>
                  <td className="tabla__acciones">
                    <Boton variante="secundario" tamano="pequeno" disabled={ocupada === e.id} onClick={() => verificar(e, !e.verificada)}>
                      {e.verificada ? 'Quitar verificación' : 'Verificar'}
                    </Boton>{' '}
                    {e.activo
                      ? <Boton variante="peligro" tamano="pequeno" disabled={ocupada === e.id} onClick={() => setADesactivar(e)}>Desactivar</Boton>
                      : <Boton variante="secundario" tamano="pequeno" disabled={ocupada === e.id} onClick={() => activar(e, true)}>Activar</Boton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="vacio"><p>No hay empresas con estos filtros.</p></div>)}

      {aDesactivar && (
        <ModalConfirmar titulo="Desactivar empresa" textoConfirmar="Desactivar" onCerrar={() => setADesactivar(null)} onConfirmar={() => activar(aDesactivar, false)} enviando={ocupada === aDesactivar.id}>
          <p><strong>{aDesactivar.nombre}</strong> no podrá iniciar sesión y su ficha y sus {aDesactivar.ofertas} ofertas dejarán de verse. Puedes volver a activarla cuando quieras.</p>
        </ModalConfirmar>
      )}
    </>
  );
}
