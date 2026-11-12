// Mapa con una sola ubicación. Con `onElegir`, pulsar en el mapa coloca el marcador ahí.
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { marcador, CAPA_OSM, CENTRO_ESPANA } from './marcador.js';

function AlPulsar({ onElegir }) {
  useMapEvents({ click: (e) => onElegir(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))) });
  return null;
}

function Centrar({ posicion }) {
  const mapa = useMap();
  useEffect(() => { if (posicion) mapa.setView(posicion, Math.max(mapa.getZoom(), 14)); }, [posicion?.[0], posicion?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapaUbicacion({ latitud, longitud, onElegir, alto = 260 }) {
  const valida = Number.isFinite(latitud) && Number.isFinite(longitud) && Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
  const posicion = valida ? [latitud, longitud] : null;
  return (
    <MapContainer aria-label={onElegir ? 'Mapa: pulsa para elegir la ubicación de la empresa' : 'Mapa con la ubicación de la empresa'} center={posicion || CENTRO_ESPANA} zoom={posicion ? 14 : 5} className={`mapa ${onElegir ? 'mapa--elegir' : ''}`} style={{ height: alto }} scrollWheelZoom={false}>
      <TileLayer url={CAPA_OSM.url} attribution={CAPA_OSM.atribucion} />
      {posicion && <Marker position={posicion} icon={marcador(true)} interactive={false} keyboard={false} title="Ubicación de la empresa" alt="Ubicación de la empresa" />}
      <Centrar posicion={posicion} />
      {onElegir && <AlPulsar onElegir={onElegir} />}
    </MapContainer>
  );
}
