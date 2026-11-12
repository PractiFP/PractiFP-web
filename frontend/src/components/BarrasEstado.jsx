// Barras horizontales con el número de candidaturas en cada estado.
const ESTADOS = ['ENVIADA', 'REVISADA', 'ENTREVISTA', 'ACEPTADA', 'RECHAZADA'];

export default function BarrasEstado({ porEstado }) {
  const maximo = Math.max(1, ...ESTADOS.map((e) => porEstado[e] || 0));
  return (
    <ul className="barras">
      {ESTADOS.map((e) => (
        <li key={e}>
          <span className={`estado estado--${e.toLowerCase()}`}>{e}</span>
          <span className="barras__pista" aria-hidden="true">
            <span className={`barras__valor estado--${e.toLowerCase()}`} style={{ width: `${((porEstado[e] || 0) / maximo) * 100}%` }} />
          </span>
          <span className="barras__n">{porEstado[e] || 0}</span>
        </li>
      ))}
    </ul>
  );
}
