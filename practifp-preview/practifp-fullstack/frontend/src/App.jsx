import React from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Protected from './components/Protected.jsx';
import Landing from './pages/Landing.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Ofertas from './pages/Ofertas.jsx';
import Empresas from './pages/Empresas.jsx';
import Favoritos from './pages/Favoritos.jsx';
import Candidaturas from './pages/Candidaturas.jsx';
import Perfil from './pages/Perfil.jsx';
import MisOfertas from './pages/MisOfertas.jsx';
import Admin from './pages/Admin.jsx';

const TABS = {
  alumno: [['ofertas', 'Ofertas'], ['empresas', 'Empresas abiertas'], ['favoritos', 'Favoritos'], ['candidaturas', 'Candidaturas'], ['perfil', 'Perfil']],
  empresa: [['ofertas', 'Mis ofertas'], ['perfil', 'Perfil']],
  admin: [['.', 'Estadísticas'], ['usuarios', 'Usuarios'], ['ofertas', 'Ofertas']],
};

function Shell() {
  const { user, salir } = useAuth();
  const nav = useNavigate();
  const tabs = TABS[user.rol];
  return (
    <div className="wrap">
      <div className="bar2">
        <NavLink className="logo" to="/">Practi<span>FP</span></NavLink>
        <span className="sp" />
        <span className="meta">{user.nombre} · {user.rol}</span>
        <button className="btn ghost sm" onClick={() => { salir(); nav('/'); }}>Salir</button>
      </div>
      <nav id="nav">
        {tabs.map(([path, label]) => (
          <NavLink key={path || 'stats'} to={path} end style={{ textDecoration: 'none' }}>
            {({ isActive }) => <span className="tab" aria-current={isActive}>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <main id="view">
        <Routes>
          {user.rol === 'alumno' && <>
            <Route index element={<Navigate to="ofertas" replace />} />
            <Route path="ofertas" element={<Ofertas />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="favoritos" element={<Favoritos />} />
            <Route path="candidaturas" element={<Candidaturas />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="*" element={<Navigate to="ofertas" replace />} />
          </>}
          {user.rol === 'empresa' && <>
            <Route index element={<Navigate to="ofertas" replace />} />
            <Route path="ofertas/*" element={<MisOfertas />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="*" element={<Navigate to="ofertas" replace />} />
          </>}
          {user.rol === 'admin' && <Route path="*" element={<Admin />} />}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/app/*" element={<Protected><Shell /></Protected>} />
      </Routes>
    </ToastProvider>
  );
}
