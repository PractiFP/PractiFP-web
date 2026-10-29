import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import OfferCard from '../components/OfferCard.jsx';

const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];
const MODALIDADES = ['Presencial', 'Híbrida', 'Remota'];

export default function Ofertas() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [ofertas, setOfertas] = useState([]);
  const [techs, setTechs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [f, setF] = useState({ q: '', ciclo: '', modalidad: '', tecnologia: '', remunerada: false });

  useEffect(() => { api.get('/tecnologias', token).then(setTechs).catch(() => {}); }, [token]);

  useEffect(() => {
    setCargando(true);
    const p = new URLSearchParams();
    if (f.ciclo) p.set('ciclo', f.ciclo);
    if (f.modalidad) p.set('modalidad', f.modalidad);
    if (f.tecnologia) p.set('tecnologia', f.tecnologia);
    if (f.remunerada) p.set('remunerada', '1');
    if (f.q) p.set('q', f.q);
    const id = setTimeout(() => {
      api.get(`/ofertas?${p}`, token).then(setOfertas).catch((e) => toast(e.message)).finally(() => setCargando(false));
    }, 250); // pequeño debounce para el texto libre
    return () => clearTimeout(id);
  }, [f, token]);

  async function fav(o) {
    setOfertas((os) => os.map((x) => (x.id === o.id ? { ...x, favorita: !x.favorita } : x)));
    try { await (o.favorita ? api.del(`/favoritos/${o.id}`, token) : api.put(`/favoritos/${o.id}`, {}, token)); }
    catch (e) { toast(e.message); setOfertas((os) => os.map((x) => (x.id === o.id ? { ...x, favorita: o.favorita } : x))); }
  }
  async function apply(o) {
    try {
      await api.post('/candidaturas', { id_oferta: o.id }, token);
      setOfertas((os) => os.map((x) => (x.id === o.id ? { ...x, inscrita: true } : x)));
      toast('Candidatura enviada');
    } catch (e) { toast(e.message); }
  }

  const mine = user?.tecnologias || [];

  return (
    <>
      <div className="fl">
        <input data-fl="q" placeholder="Buscar por título, empresa o tecnología" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.ciclo} onChange={(e) => setF({ ...f, ciclo: e.target.value })}>
          <option value="">Todos los ciclos</option>
          {CICLOS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={f.modalidad} onChange={(e) => setF({ ...f, modalidad: e.target.value })}>
          <option value="">Cualquier modalidad</option>
          {MODALIDADES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={f.tecnologia} onChange={(e) => setF({ ...f, tecnologia: e.target.value })}>
          <option value="">Cualquier tecnología</option>
          {techs.map((t) => <option key={t}>{t}</option>)}
        </select>
        <label className="ck"><input type="checkbox" checked={f.remunerada} onChange={(e) => setF({ ...f, remunerada: e.target.checked })} />Remuneradas</label>
      </div>
      {cargando ? <p className="empty">Cargando…</p> : ofertas.length ? (
        <div className="list">{ofertas.map((o) => <OfferCard key={o.id} o={o} mine={mine} onFav={fav} onApply={apply} />)}</div>
      ) : <p className="empty">No hay ofertas con estos filtros.</p>}
    </>
  );
}
