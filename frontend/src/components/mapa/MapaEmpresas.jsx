// Mapa con las empresas como marcadores. Al pulsar un marcador se abre su ficha resumida.
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { marcador, CAPA_OSM, CENTRO_ESPANA } from './marcador.js';

/** Ajusta el encuadre para que se vean todas las empresas visibles. */
function Encuadre({ empresas }) {
  const mapa = useMap();
  const clave = empresas.map((e) => e.id).join(',');
  useEffect(() => {
    if (!empresas.length) { mapa.setView(CENTRO_ESPANA, 5); return; }
    if (empresas.length === 1) { mapa.setView([empresas[0].latitud, empresas[0].longitud], 13); return; }
    mapa.fitBounds(empresas.map((e) => [e.latitud, e.longitud]), { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return null;
}

/** Centra el mapa en la empresa seleccionada desde la lista y abre su ventana. */
function Seleccion({ empresa, marcadores }) {
  const mapa = useMap();
  useEffect(() => {
    if (!empresa) return;
    mapa.flyTo([empresa.latitud, empresa.longitud], Math.max(mapa.getZoom(), 11), { duration: 0.6 });
    marcadores.current[empresa.id]?.openPopup();
  }, [empresa, mapa, marcadores]);
  return null;
}

export default function MapaEmpresas({ empresas, seleccionada, onSeleccionar }) {
  const conCoordenadas = empresas.filter((e) => e.latitud !== null && e.longitud !== null);
  const marcadores = useRef({});

  return (
    <MapContainer aria-label="Mapa de empresas" center={CENTRO_ESPANA} zoom={5} className="mapa" scrollWheelZoom={false}>
      <TileLayer url={CAPA_OSM.url} attribution={CAPA_OSM.atribucion} />
      <Encuadre empresas={conCoordenadas} />
      <Seleccion empresa={conCoordenadas.find((e) => e.id === seleccionada)} marcadores={marcadores} />
      {conCoordenadas.map((e) => (
        <Marker key={e.id} position={[e.latitud, e.longitud]} icon={marcador(e.id === seleccionada)} title={e.nombre} alt={e.nombre}
          ref={(m) => { marcadores.current[e.id] = m; }} eventHandlers={{ click: () => onSeleccionar?.(e.id) }}>
          <Popup>
            <div className="mapa-ficha">
              <strong>{e.nombre}</strong>
              <span>{[e.direccion, e.localidad].filter(Boolean).join(', ')}</span>
              <span>{e.ofertasAbiertas} {e.ofertasAbiertas === 1 ? 'oferta abierta' : 'ofertas abiertas'}</span>
              <span className="mapa-ficha__enlaces">
                <Link to={`/empresas/${e.id}`}>Ver ficha</Link>
                {e.ofertasAbiertas > 0 && <Link to={`/ofertas?empresa=${e.id}`}>Ver ofertas</Link>}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
