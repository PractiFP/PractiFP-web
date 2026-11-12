// Fases del proceso de selección en forma de línea de tiempo, con la duración estimada.
import Icono from './Icono.jsx';

const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export default function ProcesoSeleccion({ fases, resumen, faseActualId }) {
  if (!fases.length) return <p className="texto-suave">La empresa todavía no ha publicado las fases de este proceso.</p>;
  const { diasMinimo, diasMaximo } = resumen;
  return (
    <>
      <ol className="linea-tiempo">
        {fases.map((f) => (
          <li key={f.id} className={[!f.obligatoria && 'opcional', f.id === faseActualId && 'actual'].filter(Boolean).join(' ')}>
            <span className="linea-tiempo__numero" aria-hidden="true">{f.orden}</span>
            <div className="linea-tiempo__texto">
              <strong>{f.nombre}</strong>
              {!f.obligatoria && <span className="etiqueta etiqueta--opcional">Opcional</span>}
              {f.id === faseActualId && <span className="etiqueta">Estás aquí</span>}
              {f.descripcion && <p className="texto-suave">{f.descripcion}</p>}
            </div>
            <span className="linea-tiempo__dias">~{dias(f.duracionDias)}</span>
          </li>
        ))}
      </ol>
      <p className="nota nota--caja">
        <Icono nombre="reloj" tamano={16} /> Duración estimada del proceso: <strong>{diasMinimo === diasMaximo ? dias(diasMaximo) : `${diasMinimo} a ${diasMaximo} días`}</strong>
        {diasMinimo !== diasMaximo && ' (según se apliquen las fases opcionales)'}.
      </p>
    </>
  );
}
