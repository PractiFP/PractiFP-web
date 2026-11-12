// Círculo con las iniciales del usuario. El color depende del rol.
const iniciales = (texto = '') => texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function Avatar({ usuario, tamano = 32 }) {
  return (
    <span className={`avatar avatar--${usuario.rol.toLowerCase()}`} style={{ width: tamano, height: tamano, fontSize: tamano * 0.38 }} aria-hidden="true">
      {usuario.rol === 'ADMIN' ? 'A' : iniciales(usuario.nombre)}
    </span>
  );
}
