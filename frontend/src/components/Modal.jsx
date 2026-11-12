// Ventana modal accesible: se cierra con Escape, con el botón o pulsando fuera.
import { useEffect, useRef } from 'react';
import Icono from './Icono.jsx';

export default function Modal({ titulo, onCerrar, children, ancho = 'normal' }) {
  const ref = useRef(null);

  useEffect(() => {
    const anterior = document.activeElement;
    ref.current?.focus();
    const alPulsar = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPulsar);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = '';
      anterior?.focus?.();
    };
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={`modal modal--${ancho}`} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <div className="modal__cabecera">
          <h2>{titulo}</h2>
          <button type="button" className="boton boton--fantasma boton--icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
