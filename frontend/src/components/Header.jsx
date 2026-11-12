// Cabecera con navegación adaptada al rol del usuario.
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTA_PANEL, NOMBRE_PANEL } from '../utils/rutas.js';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';
import Icono from './Icono.jsx';

export default function Header() {
  const { usuario, cargando, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuAbierto(false), [location.pathname]);

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__fila">
        <Logo />
        <nav id="menu-principal" className={`cabecera__nav ${menuAbierto ? 'cabecera__nav--abierta' : ''}`} aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/ofertas">Buscar ofertas</NavLink>
          <NavLink to="/empresas">Empresas</NavLink>
          {usuario && <NavLink to={RUTA_PANEL[usuario.rol]}>{NOMBRE_PANEL[usuario.rol]}</NavLink>}
          {!usuario && !cargando && (
            <span className="cabecera__nav-invitado">
              <NavLink to="/login">Iniciar sesión</NavLink>
              <NavLink to="/registro">Registrarse</NavLink>
            </span>
          )}
        </nav>

        <div className="cabecera__acciones">
          {!cargando && !usuario && (
            <>
              <Link to="/login" className="boton boton--fantasma solo-escritorio">Iniciar sesión</Link>
              <Link to="/registro" className="boton boton--primario solo-escritorio">Registrarse</Link>
            </>
          )}
          {usuario && (
            <>
              <span className="cabecera__usuario" title={usuario.email}>
                <Avatar usuario={usuario} />
                <span className="solo-escritorio">{usuario.nombreCorto}</span>
              </span>
              <button type="button" className="boton boton--fantasma boton--icono" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
                <Icono nombre="salir" />
              </button>
            </>
          )}
          <button type="button" className="boton boton--secundario boton--icono cabecera__menu" onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto} aria-controls="menu-principal" aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}>
            <Icono nombre={menuAbierto ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
