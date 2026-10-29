import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('practifp_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    let vivo = true;
    if (!token) { setLoading(false); return; }
    api.get('/perfil', token)
      .then((u) => vivo && setUser(u))
      .catch(() => { if (vivo) { setToken(''); localStorage.removeItem('practifp_token'); } })
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, [token]);

  const entrar = useCallback((t, u) => {
    localStorage.setItem('practifp_token', t);
    setToken(t);
    setUser(u);
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem('practifp_token');
    setToken('');
    setUser(null);
  }, []);

  const refrescar = useCallback(async () => setUser(await api.get('/perfil', token)), [token]);

  return (
    <Ctx.Provider value={{ token, user, loading, entrar, salir, refrescar, setUser }}>
      {children}
    </Ctx.Provider>
  );
}
