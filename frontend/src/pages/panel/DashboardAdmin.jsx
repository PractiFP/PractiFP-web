import { Link } from 'react-router-dom';
import { usePeticion } from '../../hooks/usePeticion.js';
import Icono from '../../components/Icono.jsx';
import { resumenAdmin } from '../../services/panelService.js';
import Cifra from '../../components/Cifra.jsx';
import BarrasEstado from '../../components/BarrasEstado.jsx';
import Cargando from '../../components/Cargando.jsx';
import MensajeError from '../../components/MensajeError.jsx';

export default function DashboardAdmin() {
  const { datos, cargando, error, recargar } = usePeticion(resumenAdmin);

  return (
    <>
      <div className="panel__cabecera">
        <h1>Panel de administración</h1>
        <p className="texto-suave">Estado general de la plataforma.</p>
      </div>
      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {datos && (
        <>
          <div className="cifras">
            <Cifra destacada valor={datos.usuarios.total} texto="Usuarios registrados" />
            <Cifra valor={datos.ofertasAbiertas} texto="Ofertas abiertas" />
            <Cifra valor={datos.empresasSinVerificar} texto="Empresas por verificar" />
            <Cifra valor={datos.valoracionesPendientes} texto="Valoraciones por moderar" />
          </div>
          {(datos.empresasSinVerificar > 0 || datos.valoracionesPendientes > 0) && (
            <div className="avisos-admin">
              {datos.empresasSinVerificar > 0 && (
                <Link to="/panel/admin/verificacion" className="aviso aviso--enlace"><Icono nombre="escudo" /> <span>{datos.empresasSinVerificar} {datos.empresasSinVerificar === 1 ? 'empresa pendiente' : 'empresas pendientes'} de verificación</span><Icono nombre="derecha" /></Link>
              )}
              {datos.valoracionesPendientes > 0 && (
                <Link to="/panel/admin/valoraciones" className="aviso aviso--enlace"><Icono nombre="estrella" /> <span>{datos.valoracionesPendientes} {datos.valoracionesPendientes === 1 ? 'valoración pendiente' : 'valoraciones pendientes'} de moderar</span><Icono nombre="derecha" /></Link>
              )}
            </div>
          )}
          <div className="rejilla-2 rejilla-2--arriba">
            <section className="tarjeta">
              <div className="tarjeta__cabecera">
                <h2 className="tarjeta__titulo">Usuarios por rol</h2>
                <Link to="/panel/admin/usuarios" className="boton boton--fantasma boton--pequeno">Gestionar</Link>
              </div>
              <dl className="datos-lista">
                <div><dt>Alumnos</dt><dd>{datos.usuarios.porRol.ALUMNO}</dd></div>
                <div><dt>Empresas</dt><dd>{datos.usuarios.porRol.EMPRESA}</dd></div>
                <div><dt>Administradores</dt><dd>{datos.usuarios.porRol.ADMIN}</dd></div>
                <div><dt>Cuentas desactivadas</dt><dd>{datos.usuarios.desactivados}</dd></div>
              </dl>
            </section>
            <section className="tarjeta">
              <h2 className="tarjeta__titulo">Candidaturas por estado</h2>
              <BarrasEstado porEstado={datos.candidaturas.porEstado} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
