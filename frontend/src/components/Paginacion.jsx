import Icono from './Icono.jsx';

export default function Paginacion({ pagina, paginas, onCambiar }) {
  if (paginas <= 1) return null;
  return (
    <nav className="paginacion" aria-label="Páginas de resultados">
      <button type="button" className="boton boton--secundario boton--pequeno" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        <Icono nombre="izquierda" tamano={16} /> Anterior
      </button>
      <span>Página {pagina} de {paginas}</span>
      <button type="button" className="boton boton--secundario boton--pequeno" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>
        Siguiente <Icono nombre="derecha" tamano={16} />
      </button>
    </nav>
  );
}
