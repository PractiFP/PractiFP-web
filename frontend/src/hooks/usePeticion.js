// Hook para cargar datos de la API con estados de carga y error.
// Cada carga se puede cancelar: si cambian las dependencias o se desmonta el
// componente, la respuesta de una petición anterior se descarta.
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePeticion(funcion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });
  const controlador = useRef(null);

  const cargar = useCallback(() => {
    controlador.current?.abort();
    const actual = new AbortController();
    controlador.current = actual;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    funcion({ signal: actual.signal })
      .then((datos) => {
        if (!actual.signal.aborted) setEstado({ datos, cargando: false, error: null });
      })
      .catch((error) => {
        if (!actual.signal.aborted && error.name !== 'AbortError') setEstado({ datos: null, cargando: false, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    cargar();
    return () => controlador.current?.abort();
  }, [cargar]);

  return { ...estado, recargar: cargar };
}
