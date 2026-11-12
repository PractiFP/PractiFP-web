import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useTituloPorRuta } from '../hooks/useTitulo.js';

export default function PublicLayout() {
  useTituloPorRuta();
  return (
    <div className="pagina">
      {/* Permite a quien usa el teclado saltarse la cabecera */}
      <a href="#contenido" className="saltar-contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" className="pagina__contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
