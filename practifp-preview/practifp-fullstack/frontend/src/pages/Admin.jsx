import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Confirm from '../components/Confirm.jsx';
import Tags from '../components/Tags.jsx';

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Stats />} />
      <Route path="usuarios" element={<Usuarios />} />
      <Route path="ofertas" element={<OfertasAdmin />} />
    </Routes>
  );
}

function Stats() {
  const { token } = useAuth();
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats', token).then(setS); }, [token]);
  if (!s) return <p className="empty">Cargando…</p>;
  const max = Math.max(1, ...s.porCiclo.map((c) => c.total));
  const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];
  const porCiclo = (c) => s.porCiclo.find((x) => x.ciclo === c)?.total || 0;
  return (
    <>
      <div className="stats">
        <div className="card stat"><b>{s.usuarios}</b>Usuarios</div>
        <div className="card stat"><b>{s.empresas}</b>Empresas</div>
        <div className="card stat"><b>{s.ofertas_activas}</b>Ofertas activas</div>
        <div className="card stat"><b>{s.candidaturas}</b>Candidaturas</div>
      </div>
      <h3 style={{ marginBottom: 12 }}>Ofertas por ciclo</h3>
      {CICLOS.map((c) => (
        <div className="bar" key={c}>
          <div><span>{c}</span><span>{porCiclo(c)}</span></div>
          <i><b style={{ width: `${(porCiclo(c) / max) * 100}%` }} /></i>
        </div>
      ))}
    </>
  );
}

function Usuarios() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const cargar = () => api.get('/admin/usuarios', token).then(setRows).catch((e) => toast(e.message));
  useEffect(() => { cargar(); }, [token]);

  async function bloquear(id) {
    setRows((r) => r.map((u) => (u.id === id ? { ...u, bloqueado: !u.bloqueado } : u)));
    try { await api.patch(`/admin/usuarios/${id}/bloqueo`, {}, token); } catch (e) { toast(e.message); cargar(); }
  }
  async function borrar(id) {
    try { await api.del(`/admin/usuarios/${id}`, token); setRows((r) => r.filter((u) => u.id !== id)); }
    catch (e) { toast(e.message); }
  }

  if (!rows) return <p className="empty">Cargando…</p>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre} {u.bloqueado && <span className="badge Rechazada">Bloqueado</span>}</td>
              <td>{u.email}</td><td>{u.rol}</td>
              <td><div className="acts">
                <button className="btn ghost sm" onClick={() => bloquear(u.id)}>{u.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
                <Confirm label="Eliminar" onConfirm={() => borrar(u.id)} />
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfertasAdmin() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/ofertas', token).then(setRows).catch((e) => toast(e.message)); }, [token]);

  async function borrar(id) {
    try { await api.del(`/ofertas/${id}`, token); setRows((r) => r.filter((o) => o.id !== id)); toast('Oferta eliminada'); }
    catch (e) { toast(e.message); }
  }

  if (!rows) return <p className="empty">Cargando…</p>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>Oferta</th><th>Empresa</th><th>Ciclo</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.titulo}</td><td>{o.empresa}</td><td>{o.ciclo}</td><td>{o.activa ? 'Activa' : 'Pausada'}</td>
              <td><Confirm label="Eliminar" onConfirm={() => borrar(o.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
