import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const CICLOS = ['DAM', 'DAW', 'ASIR', 'SMR'];
const MINE = ['Java', 'SQL', 'Git', 'Spring'];

export default function Landing() {
  const [ofertas, setOfertas] = useState([]);
  const [ciclo, setCiclo] = useState('DAM');
  const [pay, setPay] = useState(false);
  const [remote, setRemote] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/publico/ofertas').then(setOfertas).catch(() => setOfertas([])).finally(() => setCargando(false));
  }, []);

  const filtradas = ofertas.filter(
    (o) => o.ciclo === ciclo && (!pay || o.remunerada) && (!remote || o.modalidad !== 'Presencial')
  );

  return (
    <>
      <header className="wrap">
        <Link className="logo" to="/">Practi<span>FP</span></Link>
        <Link className="btn ghost" to="/entrar">Entrar</Link>
      </header>

      <div className="wrap hero">
        <div>
          <h1>Encuentra tus prácticas de FP <mark>sin abrir diez pestañas</mark></h1>
          <p className="lead">Ofertas y empresas que aceptan alumnos de tu ciclo, con la información que necesitas: tecnologías, sueldo, modalidad y plazas.</p>
          <div className="cta">
            <Link className="btn" to="/registro?rol=alumno">Buscar prácticas</Link>
            <Link className="btn ghost" to="/registro?rol=empresa">Soy una empresa</Link>
          </div>
        </div>

        <div className="demo" aria-label="Demo de búsqueda">
          <h2>Ofertas reales de la plataforma</h2>
          <div className="filters">
            {CICLOS.map((c) => (
              <button key={c} className="chip" aria-pressed={ciclo === c} onClick={() => setCiclo(c)}>{c}</button>
            ))}
            <span className="sep" />
            <button className="chip" aria-pressed={pay} onClick={() => setPay((v) => !v)}>Remuneradas</button>
            <button className="chip" aria-pressed={remote} onClick={() => setRemote((v) => !v)}>Híbrido o remoto</button>
          </div>
          <div className="offers" aria-live="polite">
            {cargando ? (
              <p className="empty">Cargando ofertas…</p>
            ) : filtradas.length ? (
              filtradas.map((o) => (
                <div className="offer" key={o.id}>
                  <div>
                    <b>{o.titulo}</b>
                    <div className="meta">{o.empresa} · {o.localidad} · {o.modalidad} · {o.remunerada ? 'Remunerada' : 'No remunerada'}</div>
                  </div>
                  <div className="match">
                    {o.techs.length ? Math.round((o.techs.filter((t) => MINE.some((m) => m.toLowerCase() === t.toLowerCase())).length / o.techs.length) * 100) : 0}%
                    <small>compatible</small>
                  </div>
                  <div className="tags">
                    {o.techs.map((t) => (
                      <span key={t} className={`tag${MINE.some((m) => m.toLowerCase() === t.toLowerCase()) ? ' has' : ''}`}>{t}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty">Ninguna oferta cumple estos filtros. Quita alguno para ver más.</p>
            )}
          </div>
          <p className="note">Compatibilidad calculada con un perfil de ejemplo (Java, SQL, Git, Spring). Crea tu cuenta para ver la tuya.</p>
        </div>
      </div>

      <section className="band">
        <div className="wrap">
          <h2 className="big">Hoy buscas prácticas en demasiados sitios</h2>
          <div className="scatter" aria-hidden="true">
            <span>LinkedIn</span><span>InfoJobs</span><span>Indeed</span><span>Webs de empresas</span><span>Contactos del centro</span><span>Grupos de WhatsApp</span>
          </div>
          <p className="muted" style={{ maxWidth: 600 }}>Y aun así no sabes qué empresas aceptan tu ciclo, si pagan, qué tecnologías usan o si siguen recibiendo solicitudes. PractiFP reúne todo eso en una sola búsqueda.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2 className="big">Una plataforma, dos lados</h2>
          <div className="cols">
            <div className="card">
              <h3>Para alumnos</h3>
              <ul>
                <li>Crea tu perfil con ciclo, curso y tecnologías.</li>
                <li>Sube tu CV una vez y úsalo en cada candidatura.</li>
                <li>Filtra por ciclo, ciudad, sueldo y modalidad.</li>
                <li>Guarda favoritos y consulta el estado de cada candidatura.</li>
              </ul>
            </div>
            <div className="card">
              <h3>Para empresas</h3>
              <ul>
                <li>Publica ofertas con tecnologías, plazas y remuneración.</li>
                <li>Recibe candidatos de tu ciclo y descarga sus CV.</li>
                <li>Cambia el estado de cada candidatura.</li>
                <li>Indica que aceptas alumnos aunque no tengas oferta abierta.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <h2>Empieza por tu ciclo y tu ciudad</h2>
          <div className="cta" style={{ justifyContent: 'center' }}>
            <Link className="btn" to="/registro?rol=alumno">Crear cuenta de alumno</Link>
            <Link className="btn ghost" to="/registro?rol=empresa">Registrar mi empresa</Link>
          </div>
        </div>
      </section>

      <footer><div className="wrap">PractiFP · Proyecto para conectar alumnos de FP con empresas · Empezamos por DAM en Sevilla</div></footer>
    </>
  );
}
