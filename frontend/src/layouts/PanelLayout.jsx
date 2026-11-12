// Estructura de los paneles privados: menú lateral según el rol + contenido.
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Icono from '../components/Icono.jsx';

// Las secciones se irán añadiendo en cada fase (perfil, ofertas, candidaturas...)
const MENU = {
  ALUMNO: [
    { to: '/panel/alumno', texto: 'Dashboard', icono: 'panel' },
    { to: '/panel/alumno/perfil', texto: 'Mi perfil', icono: 'usuario' },
    { to: '/panel/alumno/portfolio', texto: 'Mi portfolio', icono: 'codigo' },
    { to: '/panel/alumno/tecnologias', texto: 'Mis tecnologías', icono: 'capas' },
    { to: '/panel/alumno/candidaturas', texto: 'Mis candidaturas', icono: 'maletin' },
    { to: '/panel/alumno/favoritos', texto: 'Mis favoritos', icono: 'corazon' },
    { to: '/panel/alumno/configuracion', texto: 'Configuración', icono: 'ajustes' },
  ],
  EMPRESA: [
    { to: '/panel/empresa', texto: 'Dashboard', icono: 'panel' },
    { to: '/panel/empresa/perfil', texto: 'Perfil de empresa', icono: 'empresa' },
    { to: '/panel/empresa/ofertas', texto: 'Mis ofertas', icono: 'maletin' },
    { to: '/panel/empresa/ofertas/nueva', texto: 'Crear oferta', icono: 'mas' },
    { to: '/panel/empresa/candidatos', texto: 'Candidatos', icono: 'usuarios' },
    { to: '/panel/empresa/procesos', texto: 'Procesos de selección', icono: 'capas' },
    { to: '/panel/empresa/valoraciones', texto: 'Valoraciones', icono: 'estrella' },
    { to: '/panel/empresa/configuracion', texto: 'Configuración', icono: 'ajustes' },
  ],
  ADMIN: [
    { to: '/panel/admin', texto: 'Dashboard', icono: 'panel' },
    { to: '/panel/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { to: '/panel/admin/empresas', texto: 'Empresas', icono: 'empresa' },
    { to: '/panel/admin/verificacion', texto: 'Verificación', icono: 'escudo' },
    { to: '/panel/admin/ofertas', texto: 'Ofertas', icono: 'maletin' },
    { to: '/panel/admin/valoraciones', texto: 'Valoraciones', icono: 'estrella' },
    { to: '/panel/admin/configuracion', texto: 'Configuración', icono: 'ajustes' },
  ],
};
const ROL = { ALUMNO: 'Alumno', EMPRESA: 'Empresa', ADMIN: 'Administrador' };

export default function PanelLayout() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div className="contenedor panel">
      <aside className="panel__lateral">
        <div className="panel__quien">
          <Avatar usuario={usuario} tamano={36} />
          <div>
            <strong>{usuario.nombre}</strong>
            <span>{ROL[usuario.rol]}{usuario.ciclo ? ` · ${usuario.ciclo}` : ''}</span>
          </div>
        </div>
        <nav aria-label="Secciones del panel" className="panel__menu">
          {MENU[usuario.rol].map((item) => (
            <NavLink key={item.to} to={item.to} end>
              <Icono nombre={item.icono} /> {item.texto}
            </NavLink>
          ))}
          <button type="button" onClick={cerrarSesion}><Icono nombre="salir" /> Cerrar sesión</button>
        </nav>
      </aside>
      <section className="panel__contenido">
        <Outlet />
      </section>
    </div>
  );
}
