import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { resumenAlumno } from '../../services/panelService.js';
import Cifra from '../../components/Cifra.jsx';
import BarrasEstado from '../../components/BarrasEstado.jsx';
import Cargando from '../../components/Cargando.jsx';
import MensajeError from '../../components/MensajeError.jsx';
import Icono from '../../components/Icono.jsx';

export default function DashboardAlumno() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = usePeticion(resumenAlumno);

  return (
    <>
      <div className="panel__cabecera">
        <h1>Hola, {usuario.nombreCorto}</h1>
        <p className="texto-suave">Este es el resumen de tu búsqueda de prácticas.</p>
      </div>
      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {datos && (
        <>
          <div className="cifras">
            <Cifra destacada valor={datos.candidaturas.total} texto="Candidaturas" />
            <Cifra valor={datos.candidaturas.porEstado.ENTREVISTA} texto="En entrevista" />
            <Cifra valor={datos.favoritos} texto="Ofertas favoritas" />
            <Cifra valor={datos.proyectos} texto="Proyectos en tu portfolio" />
          </div>
          <div className="rejilla-2 rejilla-2--arriba">
            <section className="tarjeta">
              <div className="tarjeta__cabecera">
                <h2 className="tarjeta__titulo">Tus candidaturas por estado</h2>
                {datos.candidaturas.total > 0 && <Link to="/panel/alumno/candidaturas" className="boton boton--fantasma boton--pequeno">Ver todas</Link>}
              </div>
              {datos.candidaturas.total
                ? <BarrasEstado porEstado={datos.candidaturas.porEstado} />
                : <p className="texto-suave">Todavía no te has inscrito en ninguna oferta. <Link to="/ofertas">Buscar ofertas</Link></p>}
            </section>
            <section className="tarjeta">
              <h2 className="tarjeta__titulo">Tu perfil</h2>
              <ul className="lista-comprobacion">
                <Item ok={datos.tieneCv} texto="Currículum en PDF" enlace="/panel/alumno/perfil" />
                <Item ok={datos.tecnologias > 0} texto={`Tecnologías indicadas (${datos.tecnologias})`} enlace="/panel/alumno/tecnologias" />
                <Item ok={datos.proyectos > 0} texto={`Proyectos en el portfolio (${datos.proyectos})`} enlace="/panel/alumno/portfolio" />
              </ul>
              <p className="nota">Un perfil completo ayuda a las empresas a valorar tu candidatura.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Item({ ok, texto, enlace }) {
  return (
    <li className={ok ? 'hecho' : ''}>
      <Icono nombre={ok ? 'check' : 'x'} tamano={16} />
      {enlace ? <Link to={enlace}>{texto}</Link> : <span>{texto}</span>}
      <span className="visualmente-oculto">{ok ? '(completado)' : '(pendiente)'}</span>
    </li>
  );
}
