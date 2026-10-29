import React from 'react';
import Tags from './Tags.jsx';
import Match from './Match.jsx';

export default function OfferCard({ o, mine = [], onFav, onApply }) {
  return (
    <article className="offer">
      <div>
        <b>{o.titulo}</b>
        <div className="meta">
          {o.empresa} · {o.localidad} · {o.modalidad} · {o.remunerada ? 'Remunerada' : 'No remunerada'} · {o.ciclo} · {o.plazas} plaza{o.plazas > 1 ? 's' : ''}
        </div>
      </div>
      <Match pct={o.compatibilidad} />
      <p className="d" style={{ gridColumn: '1/-1' }}>{o.descripcion}</p>
      <Tags techs={o.techs} mine={mine} />
      {(onFav || onApply) && (
        <div className="acts">
          {onFav && (
            <button className="chip" aria-pressed={o.favorita} onClick={() => onFav(o)}>
              {o.favorita ? '★ Guardada' : '☆ Guardar'}
            </button>
          )}
          {onApply && (
            <button className="btn sm" disabled={o.inscrita} onClick={() => onApply(o)}>
              {o.inscrita ? 'Inscrito' : 'Inscribirme'}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
