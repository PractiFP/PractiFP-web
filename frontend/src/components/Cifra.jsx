// Indicador numérico del dashboard.
export default function Cifra({ valor, texto, destacada = false }) {
  return (
    <div className={`cifra ${destacada ? 'cifra--destacada' : ''}`}>
      <strong>{valor}</strong>
      <span>{texto}</span>
    </div>
  );
}
