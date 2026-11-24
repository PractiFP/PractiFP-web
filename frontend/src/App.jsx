// Definición de rutas de la aplicación.
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import PanelLayout from './layouts/PanelLayout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import SoloInvitados from './components/SoloInvitados.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';
import RecuperarPassword from './pages/RecuperarPassword.jsx';
import RestablecerPassword from './pages/RestablecerPassword.jsx';
import Privacidad from './pages/Privacidad.jsx';
import IrAlPanel from './pages/panel/IrAlPanel.jsx';
import DashboardAlumno from './pages/panel/DashboardAlumno.jsx';
import DashboardEmpresa from './pages/panel/DashboardEmpresa.jsx';
import DashboardAdmin from './pages/panel/DashboardAdmin.jsx';
import Configuracion from './pages/panel/Configuracion.jsx';
import MiPerfil from './pages/panel/alumno/MiPerfil.jsx';
import MisTecnologias from './pages/panel/alumno/MisTecnologias.jsx';
import PerfilEmpresa from './pages/panel/empresa/PerfilEmpresa.jsx';
import PerfilAlumno from './pages/PerfilAlumno.jsx';
import DetalleEmpresa from './pages/DetalleEmpresa.jsx';
import BuscarOfertas from './pages/BuscarOfertas.jsx';
import DetalleOferta from './pages/DetalleOferta.jsx';
import Empresas from './pages/Empresas.jsx';
import MisOfertas from './pages/panel/empresa/MisOfertas.jsx';
import FormularioOferta from './pages/panel/empresa/FormularioOferta.jsx';
import Candidatos from './pages/panel/empresa/Candidatos.jsx';
import ProcesosSeleccion from './pages/panel/empresa/ProcesosSeleccion.jsx';
import MisCandidaturas from './pages/panel/alumno/MisCandidaturas.jsx';
import MisFavoritos from './pages/panel/alumno/MisFavoritos.jsx';
import MiPortfolio from './pages/panel/alumno/MiPortfolio.jsx';
import ValoracionesRecibidas from './pages/panel/empresa/ValoracionesRecibidas.jsx';
import GestionUsuarios from './pages/panel/admin/GestionUsuarios.jsx';
import GestionEmpresas from './pages/panel/admin/GestionEmpresas.jsx';
import VerificacionEmpresas from './pages/panel/admin/VerificacionEmpresas.jsx';
import GestionOfertas from './pages/panel/admin/GestionOfertas.jsx';
import ModeracionValoraciones from './pages/panel/admin/ModeracionValoraciones.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/ofertas" element={<BuscarOfertas />} />
        <Route path="/ofertas/:id" element={<DetalleOferta />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/empresas/:id" element={<DetalleEmpresa />} />
        <Route path="/alumnos/:id" element={<PerfilAlumno />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/restablecer-contrasena" element={<RestablecerPassword />} />
        <Route element={<SoloInvitados />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarPassword />} />
        </Route>

        {/* /panel lleva al panel del rol del usuario */}
        <Route path="/panel" element={<RutaProtegida><IrAlPanel /></RutaProtegida>} />

        <Route path="/panel/alumno" element={<RutaProtegida roles={['ALUMNO']}><PanelLayout /></RutaProtegida>}>
          <Route index element={<DashboardAlumno />} />
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="portfolio" element={<MiPortfolio />} />
          <Route path="tecnologias" element={<MisTecnologias />} />
          <Route path="candidaturas" element={<MisCandidaturas />} />
          <Route path="favoritos" element={<MisFavoritos />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        <Route path="/panel/empresa" element={<RutaProtegida roles={['EMPRESA']}><PanelLayout /></RutaProtegida>}>
          <Route index element={<DashboardEmpresa />} />
          <Route path="perfil" element={<PerfilEmpresa />} />
          <Route path="ofertas" element={<MisOfertas />} />
          <Route path="ofertas/nueva" element={<FormularioOferta />} />
          <Route path="ofertas/:id/editar" element={<FormularioOferta />} />
          <Route path="candidatos" element={<Candidatos />} />
          <Route path="procesos" element={<ProcesosSeleccion />} />
          <Route path="valoraciones" element={<ValoracionesRecibidas />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        <Route path="/panel/admin" element={<RutaProtegida roles={['ADMIN']}><PanelLayout /></RutaProtegida>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="empresas" element={<GestionEmpresas />} />
          <Route path="verificacion" element={<VerificacionEmpresas />} />
          <Route path="ofertas" element={<GestionOfertas />} />
          <Route path="valoraciones" element={<ModeracionValoraciones />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
