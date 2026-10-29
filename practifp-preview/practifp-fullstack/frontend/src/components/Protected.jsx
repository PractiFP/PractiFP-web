import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

// roles=[] -> cualquier usuario autenticado; si se indica, restringe por rol
export default function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="meta" style={{ padding: 24 }}>Cargando…</p>;
  if (!user) return <Navigate to="/entrar" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}
