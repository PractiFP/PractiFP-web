import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="pie">
      <div className="contenedor pie__fila">
        <span>PractiFP · Prácticas de Formación Profesional</span>
        <span className="pie__enlaces">
          <Link to="/privacidad">Política de privacidad</Link>
          <span>© {new Date().getFullYear()}</span>
        </span>
      </div>
    </footer>
  );
}
