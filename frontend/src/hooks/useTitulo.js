// Título de la pestaña del navegador según la página (importante para lectores de pantalla y para el historial).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SUFIJO = 'PractiFP';

// Páginas con título fijo. Las de detalle (oferta, empresa, alumno) ponen su propio título con useTitulo.
const TITULOS = [
  [/^\/$/, 'Prácticas de Formación Profesional'],
  [/^\/ofertas$/, 'Buscar ofertas'],
  [/^\/empresas$/, 'Empresas'],
  [/^\/login$/, 'Iniciar sesión'],
  [/^\/registro$/, 'Crear cuenta'],
  [/^\/recuperar-contrasena$/, 'Recuperar la contraseña'],
  [/^\/restablecer-contrasena$/, 'Elegir una contraseña nueva'],
  [/^\/privacidad$/, 'Política de privacidad'],
  [/^\/panel\/alumno$/, 'Mi panel'],
  [/^\/panel\/alumno\/perfil$/, 'Mi perfil'],
  [/^\/panel\/alumno\/portfolio$/, 'Mi portfolio'],
  [/^\/panel\/alumno\/tecnologias$/, 'Mis tecnologías'],
  [/^\/panel\/alumno\/candidaturas$/, 'Mis candidaturas'],
  [/^\/panel\/alumno\/favoritos$/, 'Mis favoritos'],
  [/^\/panel\/empresa$/, 'Panel de empresa'],
  [/^\/panel\/empresa\/perfil$/, 'Perfil de empresa'],
  [/^\/panel\/empresa\/ofertas$/, 'Mis ofertas'],
  [/^\/panel\/empresa\/ofertas\/nueva$/, 'Crear oferta'],
  [/^\/panel\/empresa\/ofertas\/\d+\/editar$/, 'Editar oferta'],
  [/^\/panel\/empresa\/candidatos$/, 'Candidatos'],
  [/^\/panel\/empresa\/procesos$/, 'Procesos de selección'],
  [/^\/panel\/empresa\/valoraciones$/, 'Valoraciones'],
  [/^\/panel\/admin$/, 'Administración'],
  [/^\/panel\/admin\/usuarios$/, 'Gestión de usuarios'],
  [/^\/panel\/admin\/empresas$/, 'Gestión de empresas'],
  [/^\/panel\/admin\/verificacion$/, 'Verificación de empresas'],
  [/^\/panel\/admin\/ofertas$/, 'Gestión de ofertas'],
  [/^\/panel\/admin\/valoraciones$/, 'Moderación de valoraciones'],
  [/^\/panel\/\w+\/configuracion$/, 'Configuración'],
];
const DETALLE = /^\/(ofertas|empresas|alumnos)\/\d+$/;

export function useTitulo(texto) {
  useEffect(() => {
    if (texto) document.title = `${texto} · ${SUFIJO}`;
  }, [texto]);
}

/** En el layout: pone el título de las páginas fijas; las de detalle lo ponen ellas. */
export function useTituloPorRuta() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (DETALLE.test(pathname)) return;
    const encontrado = TITULOS.find(([patron]) => patron.test(pathname));
    document.title = encontrado ? `${encontrado[1]} · ${SUFIJO}` : `Página no encontrada · ${SUFIJO}`;
  }, [pathname]);
}
