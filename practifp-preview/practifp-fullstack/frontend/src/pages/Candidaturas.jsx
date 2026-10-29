import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Confirm from '../components/Confirm.jsx';

export default function Candidaturas() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);

  const cargar = () => api.get('/candidaturas', token).then(setRows).catch((e) => toast(e.message));
  useEffect(() => { cargar(); }, [token]);

  async function retirar(id) {
    try { await api.del(`/candidaturas/${id}`, token); setRows((r) => r.filter((x) => x.id !== id)); }
    catch (e) { toast(e.message); }
  }

  if (rows === null) return <p className="empty">Cargando…</p>;
  if (!rows.length) return <p className="empty">Aún no te has inscrito a ninguna oferta.</p>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>Oferta</th><th>Empresa</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{a.titulo}</td><td>{a.empresa}</td><td>{a.fecha}</td>
              <td><span className={`badge ${a.estado}`}>{a.estado}</span></td>
              <td><Confirm label="Retirar" onConfirm={() => retirar(a.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
