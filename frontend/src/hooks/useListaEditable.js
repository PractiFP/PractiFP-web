// Carga una lista y permite actualizar elementos localmente tras una acción (sin volver a pedirla entera).
import { useEffect, useState } from 'react';
import { usePeticion } from './usePeticion.js';

export function useListaEditable(funcion, dependencias) {
  const peticion = usePeticion(funcion, dependencias);
  const [lista, setLista] = useState(null);
  useEffect(() => setLista(peticion.datos), [peticion.datos]);
  const actualizar = (id, cambios) => setLista((l) => l.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  const quitar = (id) => setLista((l) => l.filter((x) => x.id !== id));
  return { ...peticion, lista, actualizar, quitar };
}
