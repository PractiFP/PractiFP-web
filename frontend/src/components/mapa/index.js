// Los mapas se cargan bajo demanda: Leaflet solo se descarga en las páginas que lo usan.
import { lazy } from 'react';

export const MapaEmpresas = lazy(() => import('./MapaEmpresas.jsx'));
export const MapaUbicacion = lazy(() => import('./MapaUbicacion.jsx'));
