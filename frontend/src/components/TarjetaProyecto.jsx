// Proyecto del portfolio. Sin imagen se muestra una portada generada con el título.
import { urlImagenProyecto } from '../services/proyectosService.js';
import { colorEmpresa, formatearFecha } from '../utils/formato.js';
import Icono from './Icono.jsx';

export default function TarjetaProyecto({ proyecto, version, acciones }) {
  return (
    <article className="proyecto">
      {proyecto.tieneImagen ? (
        <img className="proyecto__imagen" src={urlImagenProyecto(proyecto.id, version)} alt={`Imagen del proyecto ${proyecto.titulo}`} loading="lazy" />
      ) : (
        <div className="proyecto__imagen proyecto__imagen--generada" style={{ '--color': colorEmpresa(proyecto.id) }} aria-hidden="true">
          <span>{proyecto.titulo}</span>
        </div>
      )}
      <div className="proyecto__cuerpo">
        <div className="proyecto__titulo">
          <h3>{proyecto.titulo}</h3>
          <time className="texto-suave texto-pequeno" dateTime={proyecto.fechaCreacion}>{formatearFecha(proyecto.fechaCreacion)}</time>
        </div>
        <p className="proyecto__descripcion">{proyecto.descripcion}</p>
        {proyecto.tecnologias.length > 0 && (
          <ul className="etiquetas" aria-label="Tecnologías utilizadas">
            {proyecto.tecnologias.map((t) => <li key={t.id} className="etiqueta">{t.nombre}</li>)}
          </ul>
        )}
        <div className="proyecto__enlaces">
          {proyecto.urlGithub && <a className="boton boton--secundario boton--pequeno" href={proyecto.urlGithub} target="_blank" rel="noopener noreferrer"><Icono nombre="codigo" tamano={15} /> Repositorio</a>}
          {proyecto.urlDemo && <a className="boton boton--secundario boton--pequeno" href={proyecto.urlDemo} target="_blank" rel="noopener noreferrer"><Icono nombre="web" tamano={15} /> Demo</a>}
          {acciones}
        </div>
      </div>
    </article>
  );
}
