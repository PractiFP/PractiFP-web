import { colorEmpresa, iniciales } from '../utils/formato.js';

export default function LogoEmpresa({ empresa, tamano = 46 }) {
  return (
    <span className="logo-empresa" aria-hidden="true"
      style={{ background: colorEmpresa(empresa.id), width: tamano, height: tamano, fontSize: tamano * 0.34, borderRadius: tamano * 0.22 }}>
      {iniciales(empresa.nombre)}
    </span>
  );
}
