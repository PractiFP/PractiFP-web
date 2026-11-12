// Ofertas guardadas por el alumno.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { misFavoritos } from '../../../services/favoritosService.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import TarjetaOferta from '../../../components/TarjetaOferta.jsx';

export default function MisFavoritos() {
  const { datos, cargando, error, recargar } = usePeticion(misFavoritos);
  const [lista, setLista] = useState(null);
  useEffect(() => setLista(datos), [datos]);

  // Al quitar una oferta de favoritos desaparece de la lista
  const quitar = (id) => (favorita) => { if (!favorita) setLista((l) => l.filter((o) => o.id !== id)); };

  return (
    <>
      <div className="panel__cabecera">
        <h1>Mis favoritos</h1>
        <p className="texto-suave">Ofertas que has guardado para revisarlas más tarde.</p>
      </div>
      {cargando && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <><h2 className="visualmente-oculto">Ofertas guardadas</h2><div className="rejilla-ofertas">{lista.map((o) => <TarjetaOferta key={o.id} oferta={o} onFavoritoCambio={quitar(o.id)} />)}</div></>
      ) : (
        <div className="vacio">
          <p>No tienes ofertas guardadas. Pulsa el corazón de una oferta para guardarla.</p>
          <Link to="/ofertas" className="boton boton--primario">Buscar ofertas</Link>
        </div>
      ))}
    </>
  );
}
