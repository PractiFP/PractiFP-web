// Avisos breves de confirmación o error en la parte inferior de la pantalla.
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icono from '../components/Icono.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);

  const mostrar = useCallback((mensaje, tipo = 'ok') => {
    clearTimeout(temporizador.current);
    setAviso({ mensaje, tipo, id: Date.now() });
    temporizador.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="toast-zona" aria-live="polite">
        {aviso && (
          <div key={aviso.id} className={`toast toast--${aviso.tipo}`} role="status">
            <Icono nombre={aviso.tipo === 'error' ? 'alerta' : 'check'} tamano={18} />
            {aviso.mensaje}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
