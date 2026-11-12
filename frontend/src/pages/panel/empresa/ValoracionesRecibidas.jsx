// Valoraciones publicadas que han hecho los alumnos sobre la empresa.
import { usePeticion } from '../../../hooks/usePeticion.js';
import { valoracionesRecibidas } from '../../../services/valoracionesService.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import { ResumenValoraciones, ListaValoraciones } from '../../../components/SeccionValoraciones.jsx';

export default function ValoracionesRecibidas() {
  const { datos, cargando, error, recargar } = usePeticion(valoracionesRecibidas);
  return (
    <>
      <div className="panel__cabecera">
        <h1>Valoraciones</h1>
        <p className="texto-suave">Opiniones de alumnos que han hecho prácticas en tu empresa. Se publican tras la revisión del equipo de PractiFP.</p>
      </div>
      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {datos && (datos.valoraciones.length ? (
        <section className="tarjeta pila">
          <ResumenValoraciones resumen={datos.resumen} />
          <ListaValoraciones valoraciones={datos.valoraciones} />
        </section>
      ) : <div className="vacio"><p>Todavía no tienes valoraciones publicadas.</p></div>)}
    </>
  );
}
