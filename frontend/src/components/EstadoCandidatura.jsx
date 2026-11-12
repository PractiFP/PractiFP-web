// Pastilla con el estado de una candidatura.
export default function EstadoCandidatura({ estado }) {
  return <span className={`estado estado--${estado.toLowerCase()}`}>{estado}</span>;
}
