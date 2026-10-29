import React, { useState } from 'react';

// Botón que pide una segunda pulsación de confirmación antes de ejecutar una acción destructiva.
export default function Confirm({ label, confirmLabel = '¿Confirmar?', className = 'btn ghost sm', onConfirm }) {
  const [armado, setArmado] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => (armado ? (setArmado(false), onConfirm()) : setArmado(true))}
      onBlur={() => setArmado(false)}
    >
      {armado ? confirmLabel : label}
    </button>
  );
}
