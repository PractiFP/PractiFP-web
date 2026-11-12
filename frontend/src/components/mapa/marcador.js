// Marcador propio (HTML + CSS) para no depender de las imágenes por defecto de Leaflet.
import L from 'leaflet';

export const marcador = (seleccionado = false) =>
  L.divIcon({
    className: '',
    html: `<span class="marcador ${seleccionado ? 'marcador--activo' : ''}"><span></span></span>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });

export const CAPA_OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Centro aproximado de la península para cuando no hay empresas
export const CENTRO_ESPANA = [40.2, -3.7];
