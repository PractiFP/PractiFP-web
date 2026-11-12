// Empresas: listado filtrable y mapa interactivo (Leaflet + OpenStreetMap).
import { Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePeticion } from '../hooks/usePeticion.js';
import { listarEmpresas } from '../services/empresasService.js';
import { MapaEmpresas } from '../components/mapa/index.js';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import InsigniaVerificada from '../components/InsigniaVerificada.jsx';

export default function Empresas() {
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const [seleccionada, setSeleccionada] = useState(null);
  const consulta = params.toString();
  const { datos, cargando, error, recargar } = usePeticion((o) => listarEmpresas(consulta, o), [consulta]);

  const cambiar = (clave, valor) => {
    const n = new URLSearchParams(params);
    if (valor) n.set(clave, valor); else n.delete(clave);
    setParams(n, { replace: true });
    setSeleccionada(null);
  };
  useEffect(() => {
    if (texto === (params.get('q') || '')) return undefined;
    const t = setTimeout(() => cambiar('q', texto.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const empresas = datos?.empresas ?? [];
  const sinUbicacion = empresas.filter((e) => e.latitud === null).length;

  return (
    <div className="contenedor seccion pila">
      <div>
        <h1>Empresas</h1>
        <p className="texto-suave">Encuentra empresas cerca de ti y consulta sus ofertas de prácticas.</p>
      </div>
      <div className="fila-formulario">
        <div className="campo">
          <label htmlFor="e-q">Nombre</label>
          <input id="e-q" type="search" className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar empresa" />
        </div>
        <div className="campo">
          <label htmlFor="e-loc">Localidad</label>
          <select id="e-loc" className="entrada" value={params.get('localidad') || ''} onChange={(e) => cambiar('localidad', e.target.value)}>
            <option value="">Todas</option>
            {(datos?.localidades ?? []).map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      <div className="empresas-mapa">
        <div className="empresas-mapa__lista">
          {cargando && !datos && <Cargando />}
          {datos && (empresas.length ? (
            <ul className="lista-empresas" aria-label="Empresas">
              {empresas.map((e) => (
                <li key={e.id} className={`tarjeta-empresa ${seleccionada === e.id ? 'tarjeta-empresa--activa' : ''}`}>
                  <div className="fila-centrada">
                    <LogoEmpresa empresa={e} />
                    <div className="tarjeta-empresa__titulo">
                      <h2><Link to={`/empresas/${e.id}`} className="enlace-fuerte">{e.nombre}</Link></h2>
                      <InsigniaVerificada verificada={e.verificada} />
                    </div>
                  </div>
                  <ul className="metadatos">
                    {e.localidad && <li><Icono nombre="ubicacion" tamano={15} /> {e.localidad}</li>}
                    <li><Icono nombre="maletin" tamano={15} /> {e.ofertasAbiertas} {e.ofertasAbiertas === 1 ? 'oferta abierta' : 'ofertas abiertas'}</li>
                    {e.valoracionMedia !== null && <li><Icono nombre="estrella" tamano={15} /> {e.valoracionMedia.toLocaleString('es-ES')}</li>}
                  </ul>
                  {e.latitud !== null && (
                    <button type="button" className="boton boton--fantasma boton--pequeno" onClick={() => setSeleccionada(e.id)} aria-pressed={seleccionada === e.id}>
                      <Icono nombre="ubicacion" tamano={15} /> Ver en el mapa
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : <div className="vacio"><p>No hay empresas que coincidan con la búsqueda.</p></div>)}
        </div>
        <div className="empresas-mapa__mapa">
          <Suspense fallback={<Cargando texto="Cargando el mapa…" />}>
            <MapaEmpresas empresas={empresas} seleccionada={seleccionada} onSeleccionar={setSeleccionada} />
          </Suspense>
          {sinUbicacion > 0 && <p className="nota">{sinUbicacion === 1 ? 'Una empresa no tiene' : `${sinUbicacion} empresas no tienen`} ubicación y no aparece en el mapa.</p>}
        </div>
      </div>
    </div>
  );
}
