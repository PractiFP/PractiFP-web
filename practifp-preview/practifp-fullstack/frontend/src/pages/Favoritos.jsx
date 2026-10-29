import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import OfferCard from '../components/OfferCard.jsx';

export default function Favoritos() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [ofertas, setOfertas] = useState(null);

  const cargar = () => api.get('/favoritos', token).then(setOfertas).catch((e) => toast(e.message));
  useEffect(() => { cargar(); }, [token]);

  async function quitar(o) {
    setOfertas((os) => os.filter((x) => x.id !== o.id));
    try { await api.del(`/favoritos/${o.id}`, token); } catch (e) { toast(e.message); cargar(); }
  }
  async function apply(o) {
    try { await api.post('/candidaturas', { id_oferta: o.id }, token); setOfertas((os) => os.map((x) => (x.id === o.id ? { ...x, inscrita: true } : x))); toast('Candidatura enviada'); }
    catch (e) { toast(e.message); }
  }

  if (ofertas === null) return <p className="empty">Cargando…</p>;
  return ofertas.length ? (
    <div className="list">{ofertas.map((o) => <OfferCard key={o.id} o={o} mine={user.tecnologias} onFav={quitar} onApply={apply} />)}</div>
  ) : <p className="empty">Todavía no has guardado ofertas.</p>;
}
