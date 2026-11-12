// Pasos de una candidatura: ENVIADA → REVISADA → ENTREVISTA → ACEPTADA (o RECHAZADA).
const PASOS = ['ENVIADA', 'REVISADA', 'ENTREVISTA', 'ACEPTADA'];

export default function ProgresoCandidatura({ estado }) {
  const pasos = estado === 'RECHAZADA' ? ['ENVIADA', 'RECHAZADA'] : PASOS;
  const actual = pasos.indexOf(estado);
  return (
    <ol className="progreso" aria-label={`Estado: ${estado}`}>
      {pasos.map((p, i) => (
        <li key={p} className={[i <= actual && 'hecho', p === 'RECHAZADA' && 'rechazada', i === actual && 'actual'].filter(Boolean).join(' ')}
          aria-current={i === actual ? 'step' : undefined}>
          {p}
        </li>
      ))}
    </ol>
  );
}
