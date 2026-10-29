import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const DEMO = [
  { label: 'Alumno', email: 'alumno@demo.es' },
  { label: 'Empresa', email: 'empresa@techsevilla.es' },
  { label: 'Admin', email: 'admin@practifp.es' },
];
const PASS_DEMO = { 'alumno@demo.es': 'alumno123', 'empresa@techsevilla.es': 'empresa123', 'admin@practifp.es': 'admin123' };

export function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const { entrar } = useAuth();
  const nav = useNavigate();

  async function submit(e, forzarEmail, forzarPass) {
    e?.preventDefault();
    setErr(''); setCargando(true);
    try {
      const { token, usuario } = await api.post('/auth/login', {
        email: forzarEmail || email, password: forzarPass || pass,
      });
      entrar(token, usuario);
      nav('/app');
    } catch (x) { setErr(x.message); } finally { setCargando(false); }
  }

  return (
    <div className="box">
      <h2>Entrar</h2>
      {err && <p className="meta" style={{ color: '#a1281c' }}>{err}</p>}
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Contraseña<input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        <button className="btn" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p><Link className="lnk" to="/registro">No tengo cuenta</Link></p>
      <p className="meta">Prueba con una cuenta de ejemplo:</p>
      <div className="acts" style={{ marginTop: 8 }}>
        {DEMO.map((d) => (
          <button key={d.email} className="chip" onClick={() => submit(null, d.email, PASS_DEMO[d.email])}>{d.label}</button>
        ))}
      </div>
    </div>
  );
}

export function Register() {
  const [sp] = useSearchParams();
  const [rol, setRol] = useState(sp.get('rol') === 'empresa' ? 'empresa' : 'alumno');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const { entrar } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setCargando(true);
    try {
      const { token, usuario } = await api.post('/auth/registro', { nombre, email, password: pass, rol });
      entrar(token, usuario);
      nav('/app');
    } catch (x) { setErr(x.message); } finally { setCargando(false); }
  }

  return (
    <div className="box">
      <h2>Crear cuenta</h2>
      {err && <p className="meta" style={{ color: '#a1281c' }}>{err}</p>}
      <form onSubmit={submit}>
        <label>Soy
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="alumno">Alumno</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>
        <label>Nombre<input required value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Contraseña (mínimo 6 caracteres)<input type="password" minLength={6} required value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        <button className="btn" disabled={cargando}>{cargando ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p><Link className="lnk" to="/entrar">Ya tengo cuenta</Link></p>
    </div>
  );
}
