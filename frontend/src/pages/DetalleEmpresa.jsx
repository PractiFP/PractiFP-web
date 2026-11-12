// Ficha pública de una empresa: datos, ubicación, ofertas abiertas y valoraciones.
import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { perfilPublico } from '../services/empresasService.js';
import { buscarOfertas } from '../services/ofertasService.js';
import TarjetaOferta from '../components/TarjetaOferta.jsx';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';
import InsigniaVerificada from '../components/InsigniaVerificada.jsx';
import BotonVolver from '../components/BotonVolver.jsx';
import { MapaUbicacion } from '../components/mapa/index.js';
import SeccionValoraciones from '../components/SeccionValoraciones.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { useTitulo } from '../hooks/useTitulo.js';

export default function DetalleEmpresa() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos: e, cargando, error, recargar } = usePeticion((o) => perfilPublico(id, o), [id, usuario?.id]);
  const ofertas = usePeticion((o) => buscarOfertas(`empresa=${encodeURIComponent(id)}`, o), [id]);

  useTitulo(error?.status === 404 ? 'Página no encontrada' : e?.nombre);
  if (cargando) return <Cargando />;
  if (error?.status === 404) return <NoEncontrada />;
  if (error) return <div className="contenedor seccion"><MensajeError mensaje={error.message} onReintentar={recargar} /></div>;

  const esPropia = usuario?.empresaId === e.id;
  const web = e.web?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return (
    <div className="contenedor seccion pila">
      <BotonVolver />
      <div className="detalle">
        <section className="tarjeta perfil">
          <div className="perfil__cabecera">
            <LogoEmpresa empresa={e} tamano={72} />
            <div className="perfil__datos">
              <h1>{e.nombre}</h1>
              <p><InsigniaVerificada verificada={e.verificada} /></p>
            </div>
            {esPropia && <Link to="/panel/empresa/perfil" className="boton boton--secundario">Editar perfil</Link>}
          </div>
          {e.descripcion ? <p className="perfil__descripcion">{e.descripcion}</p> : <p className="texto-suave">Esta empresa todavía no ha añadido una descripción.</p>}
        </section>

        <aside className="tarjeta detalle__lateral">
          <h2 className="tarjeta__titulo">Contacto y ubicación</h2>
          <ul className="metadatos metadatos--columna">
            {(e.direccion || e.localidad) && <li><Icono nombre="ubicacion" tamano={16} /> {[e.direccion, e.localidad].filter(Boolean).join(', ')}</li>}
            {e.web && <li><Icono nombre="web" tamano={16} /> <a href={e.web} target="_blank" rel="noopener noreferrer">{web}</a></li>}
            {e.telefono && <li><Icono nombre="telefono" tamano={16} /> {e.telefono}</li>}
          </ul>
          {e.latitud !== null && (
            <div className="pila pila--compacta">
              <Suspense fallback={<Cargando texto="Cargando el mapa…" />}>
                <MapaUbicacion latitud={e.latitud} longitud={e.longitud} alto={220} />
              </Suspense>
              <Link to="/empresas" className="boton boton--secundario boton--pequeno"><Icono nombre="ubicacion" tamano={15} /> Ver el mapa de empresas</Link>
            </div>
          )}
        </aside>
      </div>

      <section className="pila" aria-labelledby="titulo-ofertas">
        <h2 id="titulo-ofertas">Ofertas abiertas</h2>
        {ofertas.cargando && <Cargando />}
        {ofertas.error && <MensajeError mensaje={ofertas.error.message} onReintentar={ofertas.recargar} />}
        {ofertas.datos && (ofertas.datos.ofertas.length
          ? <div className="rejilla-ofertas">{ofertas.datos.ofertas.map((o) => <TarjetaOferta key={o.id} oferta={o} />)}</div>
          : <div className="vacio"><p>Esta empresa no tiene ofertas abiertas ahora mismo.</p></div>)}
      </section>

      <SeccionValoraciones empresa={e} />
    </div>
  );
}
