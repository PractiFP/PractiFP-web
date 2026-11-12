import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { resumenEmpresa } from '../../services/panelService.js';
import Cifra from '../../components/Cifra.jsx';
import BarrasEstado from '../../components/BarrasEstado.jsx';
import Cargando from '../../components/Cargando.jsx';
import MensajeError from '../../components/MensajeError.jsx';
import Icono from '../../components/Icono.jsx';

export default function DashboardEmpresa() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = usePeticion(resumenEmpresa);

  return (
    <>
      <div className="panel__cabecera panel__cabecera--acciones">
        <div>
          <h1>{usuario.nombre}</h1>
          <p className="texto-suave">Resumen de tus ofertas y candidatos.</p>
        </div>
        <div className="fila-botones">
          <Link to="/panel/empresa/ofertas" className="boton boton--secundario">Mis ofertas</Link>
          <Link to="/panel/empresa/ofertas/nueva" className="boton boton--primario"><Icono nombre="mas" tamano={16} /> Crear oferta</Link>
        </div>
      </div>
      {!usuario.verificada && (
        <div className="aviso">
          <Icono nombre="info" />
          <p>Tu empresa está <strong>pendiente de verificación</strong>. El equipo de PractiFP revisará tus datos; mientras tanto, tus ofertas se mostrarán como «Sin verificar».</p>
        </div>
      )}
      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {datos && (
        <>
          <div className="cifras">
            <Cifra destacada valor={datos.ofertas.abiertas} texto="Ofertas abiertas" />
            <Cifra valor={datos.candidaturas.total} texto="Candidaturas recibidas" />
            <Cifra valor={datos.candidaturas.porEstado.ENVIADA} texto="Sin revisar" />
            <Cifra valor={datos.valoraciones.media ?? '—'} texto={datos.valoraciones.total ? `Valoración media (${datos.valoraciones.total})` : 'Sin valoraciones'} />
          </div>
          <section className="tarjeta">
            <div className="tarjeta__cabecera">
              <h2 className="tarjeta__titulo">Candidaturas por estado</h2>
              {datos.candidaturas.total > 0 && <Link to="/panel/empresa/candidatos" className="boton boton--fantasma boton--pequeno">Gestionar candidatos</Link>}
            </div>
            {datos.candidaturas.total
              ? <BarrasEstado porEstado={datos.candidaturas.porEstado} />
              : <p className="texto-suave">Todavía no has recibido candidaturas.</p>}
          </section>
        </>
      )}
    </>
  );
}
