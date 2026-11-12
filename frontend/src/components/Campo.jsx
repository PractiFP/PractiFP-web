// Campo de formulario con etiqueta, ayuda y mensaje de error accesibles.
import { useId, useState } from 'react';
import Icono from './Icono.jsx';

export default function Campo({ etiqueta, error, ayuda, tipo = 'text', como = 'input', opciones, className = '', ...props }) {
  const id = useId();
  const [verPassword, setVerPassword] = useState(false);
  const descripcion = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const comunes = {
    id,
    className: `entrada ${error ? 'entrada--error' : ''}`,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': descripcion,
    ...props,
  };

  let control;
  if (como === 'textarea') {
    control = <textarea {...comunes} />;
  } else if (como === 'select') {
    control = (
      <select {...comunes}>
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    );
  } else if (tipo === 'password') {
    control = (
      <div className="entrada-password">
        <input {...comunes} type={verPassword ? 'text' : 'password'} />
        <button type="button" className="entrada-password__ver" onClick={() => setVerPassword((v) => !v)}
          aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verPassword}>
          <Icono nombre={verPassword ? 'ojoTachado' : 'ojo'} tamano={18} />
        </button>
      </div>
    );
  } else {
    control = <input {...comunes} type={tipo} />;
  }

  return (
    <div className={`campo ${className}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {control}
      {(ayuda || props.maxLength) && (
        <span id={`${id}-ayuda`} className="campo__ayuda">
          {ayuda}
          {como === 'textarea' && props.maxLength && <span className="campo__contador">{String(props.value ?? '').length} / {props.maxLength}</span>}
        </span>
      )}
      {error && <span id={`${id}-error`} className="campo__error">{error}</span>}
    </div>
  );
}
