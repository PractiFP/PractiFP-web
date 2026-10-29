import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Empresas() {
  const { token, user } = useAuth();
  const [empresas, setEmpresas] = useState(null);

  useEffect(() => { api.get('/empresas-abiertas', token).then(setEmpresas).catch(() => setEmpresas([])); }, [token]);

  if (empresas === null) return <p className="empty">Cargando…</p>;
  return (
    <>
      <p className="meta">Empresas que aceptan alumnos de {user.ciclo}, tengan o no una oferta abierta.</p>
      <div className="list">
        {empresas.length ? empresas.map((u) => (
          <article className="offer" key={u.id}>
            <div>
              <b>{u.nombre}</b>
              <div className="meta">{u.localidad} · {u.ofertas_activas} oferta{u.ofertas_activas === 1 ? '' : 's'} activa{u.ofertas_activas === 1 ? '' : 's'}</div>
              <p className="d">{u.descripcion}</p>
            </div>
            {/^https?:\/\//.test(u.web || '') && (
              <div className="acts"><a className="btn ghost sm" href={u.web} target="_blank" rel="noopener noreferrer">Web</a></div>
            )}
          </article>
        )) : <p className="empty">Ninguna empresa ha indicado que acepte tu ciclo.</p>}
      </div>
    </>
  );
}
