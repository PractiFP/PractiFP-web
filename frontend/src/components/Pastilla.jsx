// Etiqueta de estado genérica: tipo ok | aviso | error | info | neutro
export default function Pastilla({ tipo = 'neutro', children }) {
  return <span className={`pastilla pastilla--${tipo}`}>{children}</span>;
}
