export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando__spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}
