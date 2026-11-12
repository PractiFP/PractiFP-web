// Perfil público de un alumno.
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { perfilPublico } from '../services/alumnosService.js';
import { textoCurso, iniciales } from '../utils/formato.js';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';
import NivelTecnologia from '../components/NivelTecnologia.jsx';
import BotonVerCv from '../components/BotonVerCv.jsx';
import BotonVolver from '../components/BotonVolver.jsx';
import TarjetaProyecto from '../components/TarjetaProyecto.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { useTitulo } from '../hooks/useTitulo.js';

export default function PerfilAlumno() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos: a, cargando, error, recargar } = usePeticion((o) => perfilPublico(id, o), [id, usuario?.id]);

  useTitulo(error?.status === 404 ? 'Página no encontrada' : a ? `${a.nombre} ${a.apellidos}` : null);
  if (cargando) return <Cargando />;
  if (error?.status === 404) return <NoEncontrada />;
  if (error) return <div className="contenedor seccion"><MensajeError mensaje={error.message} onReintentar={recargar} /></div>;

  const nombre = `${a.nombre} ${a.apellidos}`;
  const esPropio = usuario?.alumnoId === a.id;
  return (
    <div className="contenedor seccion pila">
      <BotonVolver />
      <section className="tarjeta perfil">
        <div className="perfil__cabecera">
          <span className="avatar avatar--alumno perfil__avatar" aria-hidden="true">{iniciales(nombre)}</span>
          <div className="perfil__datos">
            <h1>{nombre}</h1>
            {a.ciclo && <p className="perfil__ciclo"><span className="ciclo">{a.ciclo.codigo}</span> {a.ciclo.nombre}{a.curso ? ` · ${textoCurso(a.curso)}` : ''}</p>}
            <ul className="metadatos">
              {a.centro && <li><Icono nombre="birrete" tamano={16} /> {a.centro}</li>}
              {a.localidad && <li><Icono nombre="ubicacion" tamano={16} /> {a.localidad}</li>}
            </ul>
          </div>
          {esPropio && <Link to="/panel/alumno/perfil" className="boton boton--secundario">Editar perfil</Link>}
        </div>
        {a.descripcion ? <p className="perfil__descripcion">{a.descripcion}</p> : <p className="texto-suave">Este alumno todavía no ha escrito una descripción.</p>}
        <div className="perfil__cv">
          {a.puedeVerCv && <BotonVerCv alumnoId={a.id} nombre={nombre} />}
          {!a.puedeVerCv && a.tieneCv && (
            <p className="nota"><Icono nombre="candado" tamano={16} /> El currículum solo lo pueden ver las empresas en cuyas ofertas se ha inscrito este alumno.</p>
          )}
          {!a.tieneCv && <p className="nota">Este alumno todavía no ha subido su currículum.</p>}
        </div>
      </section>

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">Tecnologías</h2>
        {a.tecnologias.length ? (
          <ul className="lista-tecnologias">
            {a.tecnologias.map((t) => (
              <li key={t.id}><span>{t.nombre}</span><NivelTecnologia nivel={t.nivel} conTexto /></li>
            ))}
          </ul>
        ) : <p className="texto-suave">Todavía no ha indicado sus tecnologías.</p>}
      </section>

      <section className="pila" aria-labelledby="titulo-portfolio">
        <div className="seccion__cabecera">
          <h2 id="titulo-portfolio">Portfolio</h2>
          {esPropio && <Link to="/panel/alumno/portfolio" className="boton boton--secundario boton--pequeno">Gestionar portfolio</Link>}
        </div>
        {a.proyectos.length
          ? <div className="rejilla-proyectos">{a.proyectos.map((p) => <TarjetaProyecto key={p.id} proyecto={p} />)}</div>
          : <div className="vacio"><p>Todavía no ha añadido proyectos.</p></div>}
      </section>
    </div>
  );
}
