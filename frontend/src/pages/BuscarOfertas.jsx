// Búsqueda de ofertas con filtros combinables. Los filtros viven en la URL (?ciclo=DAW&modalidad=REMOTA...).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePeticion } from '../hooks/usePeticion.js';
import { buscarOfertas, opcionesBusqueda } from '../services/ofertasService.js';
import { listarCiclos } from '../services/ciclosService.js';
import { listarTecnologias } from '../services/tecnologiasService.js';
import { MODALIDADES, textoModalidad } from '../utils/formato.js';
import TarjetaOferta from '../components/TarjetaOferta.jsx';
import Paginacion from '../components/Paginacion.jsx';
import Cargando from '../components/Cargando.jsx';
import MensajeError from '../components/MensajeError.jsx';
import Icono from '../components/Icono.jsx';
import Boton from '../components/Boton.jsx';

const CLAVES = ['q', 'ciclo', 'localidad', 'modalidad', 'remunerada', 'empresa', 'tecnologias', 'abiertas'];

export default function BuscarOfertas() {
  const [params, setParams] = useSearchParams();
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [texto, setTexto] = useState(params.get('q') || '');

  const ciclos = usePeticion(listarCiclos);
  const tecnologias = usePeticion(listarTecnologias);
  const opciones = usePeticion(opcionesBusqueda);
  const consulta = params.toString();
  const resultados = usePeticion((o) => buscarOfertas(consulta, o), [consulta]);

  /** Cambia uno o varios filtros y vuelve a la página 1. */
  function cambiar(cambios) {
    const nuevos = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === '' || valor === null || valor === undefined) nuevos.delete(clave);
      else nuevos.set(clave, valor);
    }
    nuevos.delete('pagina');
    setParams(nuevos, { replace: true });
  }

  // La búsqueda por texto espera a que se deje de escribir
  useEffect(() => {
    if (texto === (params.get('q') || '')) return undefined;
    const t = setTimeout(() => cambiar({ q: texto.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);
  useEffect(() => setTexto(params.get('q') || ''), [params]);

  const tecSeleccionadas = (params.get('tecnologias') || '').split(',').filter(Boolean);
  const alternarTecnologia = (id) => {
    const lista = tecSeleccionadas.includes(String(id)) ? tecSeleccionadas.filter((t) => t !== String(id)) : [...tecSeleccionadas, String(id)];
    cambiar({ tecnologias: lista.join(',') });
  };
  const limpiar = () => { setTexto(''); setParams(new URLSearchParams(), { replace: true }); };
  const hayFiltros = CLAVES.some((k) => params.get(k));

  // Etiquetas de los filtros activos (para quitarlos con un clic)
  const nombreTec = (id) => tecnologias.datos?.find((t) => String(t.id) === id)?.nombre ?? id;
  const nombreEmpresa = (id) => opciones.datos?.empresas.find((e) => String(e.id) === id)?.nombre ?? 'Empresa';
  const activos = [
    params.get('q') && { clave: 'q', texto: `«${params.get('q')}»` },
    params.get('ciclo') && { clave: 'ciclo', texto: params.get('ciclo') },
    params.get('localidad') && { clave: 'localidad', texto: params.get('localidad') },
    params.get('modalidad') && { clave: 'modalidad', texto: textoModalidad(params.get('modalidad')) },
    params.get('remunerada') && { clave: 'remunerada', texto: params.get('remunerada') === 'si' ? 'Remuneradas' : 'No remuneradas' },
    params.get('empresa') && { clave: 'empresa', texto: nombreEmpresa(params.get('empresa')) },
    params.get('abiertas') === 'no' && { clave: 'abiertas', texto: 'Incluye cerradas' },
  ].filter(Boolean);

  const selector = (id, etiqueta, clave, lista) => (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} className="entrada" value={params.get(clave) || ''} onChange={(e) => cambiar({ [clave]: e.target.value })}>
        <option value="">Todos</option>
        {lista.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    </div>
  );

  return (
    <div className="contenedor busqueda">
      <aside className={`busqueda__filtros ${filtrosAbiertos ? 'busqueda__filtros--abiertos' : ''}`} aria-label="Filtros">
        <div className="tarjeta filtros">
          <div className="filtros__cabecera">
            <h2>Filtros</h2>
            {hayFiltros && <Boton variante="fantasma" tamano="pequeno" onClick={limpiar}>Limpiar</Boton>}
          </div>
          <div className="campo">
            <label htmlFor="f-q">Buscar</label>
            <input id="f-q" className="entrada" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Puesto, empresa…" />
          </div>
          {selector('f-ciclo', 'Ciclo formativo', 'ciclo', (ciclos.datos || []).map((c) => ({ valor: c.codigo, texto: `${c.codigo} · ${c.nombre}` })))}
          {selector('f-localidad', 'Localidad', 'localidad', (opciones.datos?.localidades || []).map((l) => ({ valor: l.nombre, texto: `${l.nombre} (${l.ofertas})` })))}
          {selector('f-modalidad', 'Modalidad', 'modalidad', MODALIDADES)}
          {selector('f-remunerada', 'Remuneración', 'remunerada', [{ valor: 'si', texto: 'Remuneradas' }, { valor: 'no', texto: 'No remuneradas' }])}
          {selector('f-empresa', 'Empresa', 'empresa', (opciones.datos?.empresas || []).map((e) => ({ valor: String(e.id), texto: e.nombre })))}
          <fieldset className="campo filtros__tecnologias">
            <legend>Tecnologías requeridas</legend>
            <div className="chips-seleccion">
              {(tecnologias.datos || []).map((t) => {
                const activa = tecSeleccionadas.includes(String(t.id));
                return (
                  <button key={t.id} type="button" className={activa ? 'activa' : ''} aria-pressed={activa} onClick={() => alternarTecnologia(t.id)}>
                    {t.nombre}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="casilla">
            <input type="checkbox" checked={params.get('abiertas') !== 'no'} onChange={(e) => cambiar({ abiertas: e.target.checked ? '' : 'no' })} />
            Solo ofertas activas y en plazo
          </label>
        </div>
      </aside>

      <section className="busqueda__resultados">
        <div className="busqueda__cabecera">
          <h1>Buscar ofertas</h1>
          <Boton variante="secundario" className="busqueda__boton-filtros" onClick={() => setFiltrosAbiertos((v) => !v)} aria-expanded={filtrosAbiertos}>
            <Icono nombre="filtro" tamano={16} /> {filtrosAbiertos ? 'Ocultar filtros' : 'Filtros'}
          </Boton>
        </div>

        <div className="busqueda__resumen">
          <span className="texto-suave" aria-live="polite">
            {resultados.datos && <><strong>{resultados.datos.total}</strong> {resultados.datos.total === 1 ? 'oferta encontrada' : 'ofertas encontradas'}</>}
          </span>
          <ul className="filtros-activos">
            {activos.map((a) => (
              <li key={a.clave}><button type="button" onClick={() => { if (a.clave === 'q') setTexto(''); cambiar({ [a.clave]: '' }); }} aria-label={`Quitar filtro ${a.texto}`}>{a.texto} <Icono nombre="x" tamano={14} /></button></li>
            ))}
            {tecSeleccionadas.map((id) => (
              <li key={`t${id}`}><button type="button" onClick={() => alternarTecnologia(id)} aria-label={`Quitar filtro ${nombreTec(id)}`}>{nombreTec(id)} <Icono nombre="x" tamano={14} /></button></li>
            ))}
          </ul>
        </div>

        {resultados.cargando && <Cargando texto="Buscando ofertas…" />}
        {resultados.error && <MensajeError mensaje={resultados.error.message} onReintentar={resultados.recargar} />}
        {resultados.datos && !resultados.cargando && (
          resultados.datos.ofertas.length ? (
            <>
              <h2 className="visualmente-oculto">Resultados</h2>
              <div className="rejilla-ofertas">{resultados.datos.ofertas.map((o) => <TarjetaOferta key={o.id} oferta={o} />)}</div>
              <Paginacion pagina={resultados.datos.pagina} paginas={resultados.datos.paginas}
                onCambiar={(p) => { const n = new URLSearchParams(params); n.set('pagina', p); setParams(n); window.scrollTo(0, 0); }} />
            </>
          ) : (
            <div className="vacio">
              <strong>No hay ofertas con estos filtros.</strong>
              <p>Prueba a quitar alguna tecnología o a desmarcar «Solo ofertas activas y en plazo».</p>
              {hayFiltros && <Boton variante="secundario" onClick={limpiar}>Limpiar filtros</Boton>}
            </div>
          )
        )}
      </section>
    </div>
  );
}
