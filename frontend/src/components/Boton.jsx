// Botón reutilizable. variante: primario | secundario | fantasma | peligro | peligro-solido
export default function Boton({ variante = 'primario', tamano, type = 'button', className = '', children, ...props }) {
  const clases = ['boton', `boton--${variante}`, tamano === 'pequeno' && 'boton--pequeno', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={clases} {...props}>
      {children}
    </button>
  );
}
