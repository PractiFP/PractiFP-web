// Devuelve el valor tras un breve retraso sin cambios (para buscar mientras se escribe).
import { useEffect, useState } from 'react';

export function useDiferido(valor, ms = 350) {
  const [diferido, setDiferido] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDiferido(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return diferido;
}
