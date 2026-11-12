// Candidatos de las ofertas de la empresa: perfil, currículum y cambio de estado.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { candidatosEmpresa, cambiarEstadoCandidatura, cambiarFaseCandidatura } from '../../../services/candidaturasService.js';
import { misOfertas } from '../../../services/ofertasService.js';
import { formatearFechaHora, ESTADOS_CANDIDATURA } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import BotonVerCv from '../../../components/BotonVerCv.jsx';
import Avatar from '../../../components/Avatar.jsx';

export default function Candidatos() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const consulta = params.toString();
  const ofertas = usePeticion(misOfertas);
  const candidatos = usePeticion((o) => candidatosEmpresa(consulta, o), [consulta]);
  const [lista, setLista] = useState(null);
  const [ocupada, setOcupada] = useState(null);
  useEffect(() => setLista(candidatos.datos), [candidatos.datos]);

  const filtrar = (clave, valor) => {
    const n = new URLSearchParams(params);
    if (valor) n.set(clave, valor); else n.delete(clave);
    setParams(n, { replace: true });
  };

  async function cambiarEstado(c, estado) {
    setOcupada(c.id);
    try {
      await cambiarEstadoCandidatura(c.id, estado);
      setLista((l) => l.map((x) => (x.id === c.id ? { ...x, estado } : x)));
      toast(`Candidatura de ${c.alumno.nombre} marcada como ${estado}.`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  async function cambiarFase(c, valor) {
    const faseId = valor ? Number(valor) : null;
    setOcupada(c.id);
    try {
      await cambiarFaseCandidatura(c.id, faseId);
      setLista((l) => l.map((x) => (x.id === c.id ? { ...x, faseActualId: faseId } : x)));
      const fase = c.fases.find((f) => f.id === faseId);
      toast(fase ? `${c.alumno.nombre} está ahora en la fase «${fase.nombre}».` : `Fase de ${c.alumno.nombre} sin indicar.`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>Candidatos</h1>
        <p className="texto-suave">Revisa los perfiles y actualiza el estado de cada candidatura. El alumno verá el cambio en su panel.</p>
      </div>

      <div className="fila-formulario">
        <div className="campo">
          <label htmlFor="c-oferta">Oferta</label>
          <select id="c-oferta" className="entrada" value={params.get('oferta') || ''} onChange={(e) => filtrar('oferta', e.target.value)}>
            <option value="">Todas las ofertas</option>
            {(ofertas.datos || []).map((o) => <option key={o.id} value={o.id}>{o.titulo}{o.activa ? '' : ' (inactiva)'}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="c-estado">Estado</label>
          <select id="c-estado" className="entrada" value={params.get('estado') || ''} onChange={(e) => filtrar('estado', e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_CANDIDATURA.map((e) => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
          </select>
        </div>
      </div>

      {candidatos.cargando && <Cargando />}
      {candidatos.error && <MensajeError mensaje={candidatos.error.message} onReintentar={candidatos.recargar} />}
      {lista && !candidatos.cargando && (lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla tabla--candidatos">
            <thead>
              <tr><th>Alumno</th><th>Oferta</th><th title="Tecnologías obligatorias de la oferta que conoce el alumno">Tecnologías</th><th>Inscripción</th><th>Estado y fase</th></tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const nombre = `${c.alumno.nombre} ${c.alumno.apellidos}`;
                const { obligatorias, tiene } = c.coincidencia;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="fila-centrada fila-centrada--arriba">
                        <Avatar usuario={{ rol: 'ALUMNO', nombre }} tamano={32} />
                        <div>
                          <Link to={`/alumnos/${c.alumno.id}`} className="enlace-fuerte">{nombre}</Link>
                          <div className="texto-suave texto-pequeno">{c.alumno.ciclo && <span className="ciclo">{c.alumno.ciclo}</span>} {c.alumno.localidad}</div>
                          <div className="celda-cv">
                            {c.alumno.tieneCv ? <BotonVerCv alumnoId={c.alumno.id} nombre={nombre} tamano="pequeno" variante="fantasma" texto="Ver CV" /> : <span className="texto-suave texto-pequeno">Sin currículum</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><Link to={`/ofertas/${c.oferta.id}`}>{c.oferta.titulo}</Link></td>
                    <td>
                      <span className={`coincidencia ${obligatorias && tiene === obligatorias ? 'coincidencia--total' : ''}`} title="Tecnologías obligatorias que conoce">{tiene} de {obligatorias}</span>
                    </td>
                    <td className="sin-salto">{formatearFechaHora(c.fecha)}</td>
                    <td>
                      <select className={`entrada entrada--compacta selector-estado selector-estado--${c.estado.toLowerCase()}`} value={c.estado}
                        disabled={ocupada === c.id} onChange={(e) => cambiarEstado(c, e.target.value)} aria-label={`Estado de la candidatura de ${nombre}`}>
                        {ESTADOS_CANDIDATURA.map((e) => <option key={e.valor} value={e.valor}>{e.valor}</option>)}
                      </select>
                      {c.fases.length > 0 && (
                        <select className="entrada entrada--compacta selector-fase" value={c.faseActualId ?? ''} disabled={ocupada === c.id}
                          onChange={(e) => cambiarFase(c, e.target.value)} aria-label={`Fase del proceso de ${nombre}`}>
                          <option value="">Sin fase indicada</option>
                          {c.fases.map((f) => <option key={f.id} value={f.id}>{f.orden}. {f.nombre}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vacio"><p>{params.toString() ? 'No hay candidaturas con estos filtros.' : 'Todavía no has recibido candidaturas.'}</p></div>
      ))}
    </>
  );
}
