// Detalle de una oferta de prácticas.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { obtenerOferta } from '../services/ofertasService.js';
import { formatearFecha, textoModalidad, textoSalario } from '../utils/formato.js';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import InsigniaVerificada from '../components/InsigniaVerificada.jsx';
import BotonVolver from '../components/BotonVolver.jsx';
import PanelInscripcion from '../components/PanelInscripcion.jsx';
import ProcesoSeleccion from '../components/ProcesoSeleccion.jsx';
import NoEncontrada from './NoEncontrada.jsx';
import { useTitulo } from '../hooks/useTitulo.js';

export default function DetalleOferta() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = usePeticion((op) => obtenerOferta(id, op), [id, usuario?.id]);
  // Copia local para reflejar la inscripción sin volver a cargar la página
  const [o, setOferta] = useState(null);
  useEffect(() => setOferta(datos), [datos]);

  useTitulo(error?.status === 404 ? 'Página no encontrada' : o?.titulo);
  if (cargando || (datos && !o)) return <Cargando />;
  if (error?.status === 404) return <NoEncontrada />;
  if (error) return <div className="contenedor seccion"><MensajeError mensaje={error.message} onReintentar={recargar} /></div>;

  const obligatorias = o.tecnologias.filter((t) => t.obligatoria);
  const valoradas = o.tecnologias.filter((t) => !t.obligatoria);
  const estado = o.abierta ? { texto: 'Abierta', clase: 'estado--aceptada' }
    : o.activa ? { texto: 'Plazo cerrado', clase: 'estado--entrevista' } : { texto: 'Inactiva', clase: 'estado--rechazada' };

  return (
    <div className="contenedor seccion pila">
      <BotonVolver />
      <div className="detalle">
        <div className="pila">
          <section className="tarjeta pila">
            <div className="perfil__cabecera">
              <LogoEmpresa empresa={o.empresa} tamano={72} />
              <div className="perfil__datos">
                <h1>{o.titulo}</h1>
                <p className="fila-enlaces">
                  <Link to={`/empresas/${o.empresa.id}`}>{o.empresa.nombre}</Link>
                  <InsigniaVerificada verificada={o.empresa.verificada} />
                </p>
              </div>
            </div>
            {!o.abierta && (
              <p className="aviso"><Icono nombre="info" /> {o.activa ? `El plazo de inscripción terminó el ${formatearFecha(o.fechaLimite)}.` : 'Esta oferta está inactiva y no admite inscripciones.'}</p>
            )}
            <dl className="datos-oferta">
              <div><dt>Ciclo</dt><dd><span className="ciclo">{o.ciclo.codigo}</span> <span className="texto-suave">{o.ciclo.nombre}</span></dd></div>
              <div><dt>Localidad</dt><dd>{o.localidad}</dd></div>
              <div><dt>Modalidad</dt><dd>{textoModalidad(o.modalidad)}</dd></div>
              <div><dt>Remuneración</dt><dd>{textoSalario(o)}</dd></div>
              <div><dt>Plazas</dt><dd>{o.plazas}</dd></div>
              <div><dt>Publicada</dt><dd>{formatearFecha(o.fechaPublicacion)}</dd></div>
              <div><dt>Inscripción hasta</dt><dd>{formatearFecha(o.fechaLimite)}</dd></div>
              <div><dt>Estado</dt><dd><span className={`estado ${estado.clase}`}>{estado.texto}</span></dd></div>
            </dl>
          </section>

          <section className="tarjeta">
            <h2 className="tarjeta__titulo">Descripción</h2>
            <p className="perfil__descripcion">{o.descripcion}</p>
          </section>

          <section className="tarjeta pila">
            <h2 className="tarjeta__titulo">Tecnologías</h2>
            <div>
              <p className="antetitulo">Obligatorias</p>
              {obligatorias.length
                ? <ul className="etiquetas">{obligatorias.map((t) => <li key={t.id} className="etiqueta"><Icono nombre="check" tamano={14} /> {t.nombre}</li>)}</ul>
                : <p className="texto-suave">Ninguna.</p>}
            </div>
            {valoradas.length > 0 && (
              <div>
                <p className="antetitulo">Se valoran</p>
                <ul className="etiquetas">{valoradas.map((t) => <li key={t.id} className="etiqueta etiqueta--opcional">{t.nombre}</li>)}</ul>
              </div>
            )}
          </section>

          <section className="tarjeta pila">
            <div>
              <h2 className="tarjeta__titulo">Proceso de selección</h2>
              <p className="texto-suave">Fases previstas por la empresa, para que sepas cómo será el proceso y cuánto puede durar.</p>
            </div>
            <ProcesoSeleccion fases={o.fases} resumen={o.resumenFases} />
          </section>
        </div>

        <aside className="pila detalle__lateral">
          <PanelInscripcion oferta={o} onInscrito={(c) => setOferta({ ...o, miCandidatura: c, miEstado: c.estado })} />
          <section className="tarjeta pila">
            <div className="fila-centrada">
              <LogoEmpresa empresa={o.empresa} />
              <div>
                <strong>{o.empresa.nombre}</strong>
                <p className="texto-suave">{o.empresa.localidad}</p>
              </div>
            </div>
            <Link to={`/empresas/${o.empresa.id}`} className="boton boton--secundario">Ver ficha de la empresa</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
