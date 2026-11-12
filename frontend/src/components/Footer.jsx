export default function Footer() {
  return (
    <footer className="pie">
      <div className="contenedor pie__fila">
        <span>PractiFP · Prácticas de Formación Profesional</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
