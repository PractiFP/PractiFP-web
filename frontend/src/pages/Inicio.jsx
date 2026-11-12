import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { buscarOfertas } from '../services/ofertasService.js';
import { listarCiclos } from '../services/ciclosService.js';
import { RUTA_PANEL, NOMBRE_PANEL } from '../utils/rutas.js';
import EstadoConexion from '../components/EstadoConexion.jsx';
import TarjetaOferta from '../components/TarjetaOferta.jsx';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';

export default function Inicio() {
  const { usuario, cargando } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const recientes = usePeticion((o) => buscarOfertas('', o));
  const ciclos = usePeticion(listarCiclos);

  const buscar = (e) => {
    e.preventDefault();
    navigate(texto.trim() ? `/ofertas?q=${encodeURIComponent(texto.trim())}` : '/ofertas');
  };

  return (
    <>
      <section className="portada">
        <div className="contenedor portada__fila">
          <div>
            <p className="antetitulo">Prácticas para ciclos formativos</p>
            <h1>Tus prácticas de FP, <em>sin dar vueltas</em>.</h1>
            <p className="portada__entradilla">
              Ofertas de empresas para DAM, DAW, ASIR y más. Consulta el proceso de selección antes de inscribirte,
              lee lo que opinan otros alumnos y sigue tus candidaturas en un solo sitio.
            </p>
            <form className="buscador" onSubmit={buscar} role="search">
              <Icono nombre="buscar" />
              <input type="search" className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Puesto, tecnología o empresa" aria-label="Buscar ofertas" />
              <button type="submit" className="boton boton--primario">Buscar</button>
            </form>
            {ciclos.datos && (
              <div className="portada__ciclos">
                <span className="texto-suave">Por ciclo:</span>
                {ciclos.datos.map((c) => <Link key={c.id} to={`/ofertas?ciclo=${c.codigo}`} className="ciclo-enlace" title={c.nombre}>{c.codigo}</Link>)}
              </div>
            )}
          </div>
          <div className="portada__lateral">
            {!cargando && (usuario ? (
              <div className="tarjeta pila">
                <p>Hola, <strong>{usuario.nombreCorto}</strong>.</p>
                <Link to={RUTA_PANEL[usuario.rol]} className="boton boton--primario">Ir a {NOMBRE_PANEL[usuario.rol].toLowerCase()}</Link>
              </div>
            ) : (
              <div className="tarjeta pila">
                <h2>¿Primera vez en PractiFP?</h2>
                <p className="texto-suave">Crea tu perfil de alumno para inscribirte en ofertas, o publica las prácticas de tu empresa.</p>
                <Link to="/registro" className="boton boton--primario">Crear cuenta gratis</Link>
                <Link to="/login" className="boton boton--secundario">Ya tengo cuenta</Link>
              </div>
            ))}
            {/* Comprobación de la conexión con la API y la base de datos (solo en desarrollo) */}
            {import.meta.env.DEV && <EstadoConexion />}
          </div>
        </div>
      </section>

      <section className="contenedor seccion pila">
        <div className="seccion__cabecera">
          <div>
            <p className="antetitulo">Recién publicadas</p>
            <h2>Ofertas abiertas</h2>
          </div>
          <Link to="/ofertas" className="boton boton--secundario">Ver todas <Icono nombre="derecha" tamano={16} /></Link>
        </div>
        {recientes.cargando && <Cargando />}
        {recientes.error && <MensajeError mensaje={recientes.error.message} onReintentar={recientes.recargar} />}
        {recientes.datos && (recientes.datos.ofertas.length
          ? <div className="rejilla-ofertas">{recientes.datos.ofertas.slice(0, 6).map((o) => <TarjetaOferta key={o.id} oferta={o} />)}</div>
          : <div className="vacio"><p>Todavía no hay ofertas publicadas.</p></div>)}
      </section>
    </>
  );
}
