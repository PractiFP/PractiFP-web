import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { api, descargarCv } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Confirm from '../components/Confirm.jsx';
import Tags from '../components/Tags.jsx';

const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];
const MODALIDADES = ['Presencial', 'Híbrida', 'Remota'];
const VACIA = { titulo: '', descripcion: '', ciclo: 'DAM', localidad: 'Sevilla', modalidad: 'Presencial', plazas: 1, remunerada: false, tecnologias: '' };

export default function MisOfertas() {
  return (
    <Routes>
      <Route index element={<Lista />} />
      <Route path="nueva" element={<Formulario />} />
      <Route path=":id/editar" element={<Formulario />} />
      <Route path=":id/candidatos" element={<Candidatos />} />
    </Routes>
  );
}

function Lista() {
  const { token } = useAuth();
  const toast = useToast();
  const [ofertas, setOfertas] = useState(null);

  const cargar = () => api.get('/ofertas/mias', token).then(setOfertas).catch((e) => toast(e.message));
  useEffect(() => { cargar(); }, [token]);

  async function pausar(o) {
    setOfertas((os) => os.map((x) => (x.id === o.id ? { ...x, activa: !x.activa } : x)));
    try { await api.patch(`/ofertas/${o.id}/activa`, {}, token); } catch (e) { toast(e.message); cargar(); }
  }
  async function borrar(id) {
    try { await api.del(`/ofertas/${id}`, token); setOfertas((os) => os.filter((x) => x.id !== id)); toast('Oferta eliminada'); }
    catch (e) { toast(e.message); }
  }

  return (
    <>
      <div className="acts"><Link className="btn" to="nueva">+ Nueva oferta</Link></div>
      <div className="list" style={{ marginTop: 16 }}>
        {ofertas === null ? <p className="empty">Cargando…</p> : ofertas.length ? ofertas.map((o) => (
          <article className="offer" key={o.id}>
            <div><b>{o.titulo}</b><div className="meta">{o.localidad} · {o.modalidad} · {o.remunerada ? 'Remunerada' : 'No remunerada'} · {o.ciclo} · {o.plazas} plaza{o.plazas > 1 ? 's' : ''} {!o.activa && '· Pausada'}</div></div>
            <div className="match">{o.candidatos}<small>candidatos</small></div>
            <Tags techs={o.techs} />
            <div className="acts">
              <Link className="btn sm" to={`${o.id}/candidatos`}>Ver candidatos</Link>
              <Link className="btn ghost sm" to={`${o.id}/editar`}>Editar</Link>
              <button className="btn ghost sm" onClick={() => pausar(o)}>{o.activa ? 'Pausar' : 'Reactivar'}</button>
              <Confirm label="Eliminar" onConfirm={() => borrar(o.id)} />
            </div>
          </article>
        )) : <p className="empty">Aún no has publicado ofertas.</p>}
      </div>
    </>
  );
}

function Formulario() {
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState(VACIA);
  const [cargando, setCargando] = useState(!!id);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/ofertas/${id}`, token)
      .then((o) => setF({ ...o, tecnologias: o.techs.join(', ') }))
      .catch((e) => { toast(e.message); nav('/app/ofertas'); })
      .finally(() => setCargando(false));
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setGuardando(true);
    const body = { ...f, tecnologias: f.tecnologias.split(',').map((x) => x.trim()).filter(Boolean) };
    try {
      if (id) await api.put(`/ofertas/${id}`, body, token); else await api.post('/ofertas', body, token);
      toast('Oferta guardada');
      nav('/app/ofertas');
    } catch (x) { toast(x.message); } finally { setGuardando(false); }
  }

  if (cargando) return <p className="empty">Cargando…</p>;
  return (
    <>
      <h2>{id ? 'Editar oferta' : 'Nueva oferta'}</h2>
      <form className="g" onSubmit={submit}>
        <label className="w">Título<input required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label className="w">Descripción<textarea rows="3" required value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
        <label>Ciclo<select value={f.ciclo} onChange={(e) => setF({ ...f, ciclo: e.target.value })}>{CICLOS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Localidad<input required value={f.localidad} onChange={(e) => setF({ ...f, localidad: e.target.value })} /></label>
        <label>Modalidad<select value={f.modalidad} onChange={(e) => setF({ ...f, modalidad: e.target.value })}>{MODALIDADES.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label>Plazas<input type="number" min="1" max="50" value={f.plazas} onChange={(e) => setF({ ...f, plazas: e.target.value })} /></label>
        <label className="w">Tecnologías (separadas por comas)<input value={f.tecnologias} onChange={(e) => setF({ ...f, tecnologias: e.target.value })} /></label>
        <label className="ck"><input type="checkbox" checked={!!f.remunerada} onChange={(e) => setF({ ...f, remunerada: e.target.checked })} />Remunerada</label>
        <div className="w acts">
          <button className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar oferta'}</button>
          <button type="button" className="btn ghost" onClick={() => nav('/app/ofertas')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}

const ESTADOS = ['Pendiente', 'En revisión', 'Entrevista', 'Aceptada', 'Rechazada'];

function Candidatos() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/ofertas/${id}/candidaturas`, token).then(setData).catch((e) => toast(e.message)); }, [id, token]);

  async function cambiar(cId, estado) {
    setData((d) => ({ ...d, candidaturas: d.candidaturas.map((c) => (c.id === cId ? { ...c, estado } : c)) }));
    try { await api.patch(`/candidaturas/${cId}`, { estado }, token); toast('Estado actualizado'); }
    catch (e) { toast(e.message); }
  }

  if (!data) return <p className="empty">Cargando…</p>;
  const { oferta, candidaturas } = data;
  return (
    <>
      <Link className="lnk" to="/app/ofertas">← Volver</Link>
      <h2>{oferta.titulo}: {candidaturas.length} candidato{candidaturas.length === 1 ? '' : 's'}</h2>
      {candidaturas.length ? (
        <div className="tw">
          <table>
            <thead><tr><th>Alumno</th><th>Ciclo</th><th>Tecnologías</th><th>Compat.</th><th>CV</th><th>Estado</th></tr></thead>
            <tbody>
              {candidaturas.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}<br /><span className="meta">{c.email}</span></td>
                  <td>{c.ciclo} {c.curso}<br /><span className="meta">{c.centro}</span></td>
                  <td><Tags techs={c.tecnologias} mine={oferta.techs} /></td>
                  <td>{c.compatibilidad}%</td>
                  <td>{c.cv_nombre ? <button className="lnk" onClick={() => descargarCv(c.id_alumno, c.cv_nombre, token).catch((x) => toast(x.message))}>Descargar</button> : 'Sin CV'}</td>
                  <td><select value={c.estado} onChange={(e) => cambiar(c.id, e.target.value)}>{ESTADOS.map((e2) => <option key={e2}>{e2}</option>)}</select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty">Todavía no hay candidaturas.</p>}
    </>
  );
}
