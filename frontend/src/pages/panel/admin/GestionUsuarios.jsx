// Gestión de usuarios: buscar, filtrar y activar o desactivar cuentas.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDiferido } from '../../../hooks/useDiferido.js';
import { useListaEditable } from '../../../hooks/useListaEditable.js';
import * as admin from '../../../services/adminService.js';
import { formatearFechaHora } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Pastilla from '../../../components/Pastilla.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

const ROLES = { ALUMNO: 'Alumno', EMPRESA: 'Empresa', ADMIN: 'Administrador' };

export default function GestionUsuarios() {
  const { usuario: yo } = useAuth();
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const q = useDiferido(texto.trim());
  const { lista, cargando, error, recargar, actualizar } = useListaEditable((o) => admin.usuarios({ q, rol, activo }, o), [q, rol, activo]);
  const [aDesactivar, setADesactivar] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  async function cambiar(u, valor) {
    setOcupado(u.id);
    try {
      await admin.cambiarActivoUsuario(u.id, valor);
      actualizar(u.id, { activo: valor });
      toast(valor ? `Cuenta de ${u.nombre} activada.` : `Cuenta de ${u.nombre} desactivada.`);
      setADesactivar(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>Gestión de usuarios</h1>
        <p className="texto-suave">Una cuenta desactivada no puede iniciar sesión y su perfil y sus ofertas dejan de ser públicos.</p>
      </div>
      <div className="fila-formulario">
        <div className="campo">
          <label htmlFor="u-q">Buscar</label>
          <input id="u-q" type="search" className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o correo" />
        </div>
        <div className="campo">
          <label htmlFor="u-rol">Rol</label>
          <select id="u-rol" className="entrada" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ROLES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="u-activo">Estado</label>
          <select id="u-activo" className="entrada" value={activo} onChange={(e) => setActivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="si">Activas</option>
            <option value="no">Desactivadas</option>
          </select>
        </div>
      </div>

      {cargando && !lista && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Registro</th><th>Estado</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.perfil
                      ? <Link to={`/${u.perfil.tipo === 'alumno' ? 'alumnos' : 'empresas'}/${u.perfil.id}`} className="enlace-fuerte">{u.nombre}</Link>
                      : <strong>{u.nombre}</strong>}
                    <div className="texto-suave texto-pequeno">{u.email}</div>
                  </td>
                  <td><Pastilla tipo={u.rol === 'ADMIN' ? 'info' : 'neutro'}>{ROLES[u.rol]}</Pastilla></td>
                  <td className="sin-salto">{formatearFechaHora(u.fechaRegistro)}</td>
                  <td>{u.activo ? <Pastilla tipo="ok">Activa</Pastilla> : <Pastilla tipo="error">Desactivada</Pastilla>}</td>
                  <td className="tabla__acciones">
                    {u.rol === 'ADMIN' || u.id === yo.id ? <span className="texto-suave texto-pequeno">—</span> : u.activo
                      ? <Boton variante="peligro" tamano="pequeno" disabled={ocupado === u.id} onClick={() => setADesactivar(u)}>Desactivar</Boton>
                      : <Boton variante="secundario" tamano="pequeno" disabled={ocupado === u.id} onClick={() => cambiar(u, true)}>Activar</Boton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="vacio"><p>No hay usuarios con estos filtros.</p></div>)}

      {aDesactivar && (
        <ModalConfirmar titulo="Desactivar cuenta" textoConfirmar="Desactivar" onCerrar={() => setADesactivar(null)} onConfirmar={() => cambiar(aDesactivar, false)} enviando={ocupado === aDesactivar.id}>
          <p><strong>{aDesactivar.nombre}</strong> ({aDesactivar.email}) no podrá iniciar sesión{aDesactivar.rol === 'EMPRESA' ? ' y sus ofertas dejarán de verse' : ' y su perfil dejará de ser público'}. Puedes volver a activarla cuando quieras.</p>
        </ModalConfirmar>
      )}
    </>
  );
}
