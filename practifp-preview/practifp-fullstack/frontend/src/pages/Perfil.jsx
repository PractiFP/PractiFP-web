import React, { useState } from 'react';
import { api, descargarCv } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];

export default function Perfil() {
  const { user, token, setUser } = useAuth();
  const toast = useToast();
  const esEmpresa = user.rol === 'empresa';
  const [f, setF] = useState(esEmpresa
    ? { nombre: user.nombre, localidad: user.localidad, descripcion: user.descripcion || '', web: user.web || '', ciclos: user.ciclos || [] }
    : { nombre: user.nombre, ciclo: user.ciclo, curso: user.curso, centro: user.centro || '', tecnologias: (user.tecnologias || []).join(', ') });
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const toggleCiclo = (c) => setF((s) => ({ ...s, ciclos: s.ciclos.includes(c) ? s.ciclos.filter((x) => x !== c) : [...s.ciclos, c] }));

  async function submit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const body = esEmpresa ? f : { ...f, tecnologias: f.tecnologias.split(',').map((x) => x.trim()).filter(Boolean) };
      const u = await api.put('/perfil', body, token);
      setUser(u);
      toast('Perfil guardado');
    } catch (x) { toast(x.message); } finally { setGuardando(false); }
  }

  async function subirCv(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('El CV pesa más de 2 MB'); e.target.value = ''; return; }
    const fd = new FormData();
    fd.append('cv', file);
    setSubiendo(true);
    try { setUser(await api.upload('/perfil/cv', fd, token)); toast('CV subido'); }
    catch (x) { toast(x.message); } finally { setSubiendo(false); e.target.value = ''; }
  }

  if (esEmpresa) {
    return (
      <>
        <h2>Perfil de empresa</h2>
        <form className="g" onSubmit={submit}>
          <label>Nombre<input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
          <label>Localidad<input value={f.localidad} onChange={(e) => setF({ ...f, localidad: e.target.value })} /></label>
          <label className="w">Descripción<textarea rows="3" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <label className="w">Web (https://…)<input value={f.web} onChange={(e) => setF({ ...f, web: e.target.value })} /></label>
          <fieldset className="w"><legend>Aceptamos alumnos de</legend>
            {CICLOS.map((c) => (
              <label className="ck" key={c}><input type="checkbox" checked={f.ciclos.includes(c)} onChange={() => toggleCiclo(c)} />{c}</label>
            ))}
          </fieldset>
          <div className="w acts"><button className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil'}</button></div>
        </form>
      </>
    );
  }

  return (
    <>
      <h2>Mi perfil</h2>
      <form className="g" onSubmit={submit}>
        <label>Nombre<input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
        <label>Ciclo<select value={f.ciclo} onChange={(e) => setF({ ...f, ciclo: e.target.value })}>{CICLOS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Curso<select value={f.curso} onChange={(e) => setF({ ...f, curso: e.target.value })}><option>1º</option><option>2º</option></select></label>
        <label>Centro<input value={f.centro} onChange={(e) => setF({ ...f, centro: e.target.value })} /></label>
        <label className="w">Tecnologías que conoces (separadas por comas)<input value={f.tecnologias} onChange={(e) => setF({ ...f, tecnologias: e.target.value })} /></label>
        <label className="w">CV (PDF o Word, máx. 2 MB){user.cv_nombre ? ` · actual: ${user.cv_nombre}` : ''}
          <input type="file" accept=".pdf,.doc,.docx" onChange={subirCv} disabled={subiendo} />
        </label>
        {user.cv_nombre && (
          <div className="w"><button type="button" className="lnk" onClick={() => descargarCv(user.id, user.cv_nombre, token).catch((x) => toast(x.message))}>Descargar mi CV actual</button></div>
        )}
        <div className="w acts"><button className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil'}</button></div>
      </form>
    </>
  );
}
