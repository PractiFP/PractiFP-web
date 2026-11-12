// Tarjeta de oferta para listados. Toda la tarjeta enlaza al detalle.
import { Link } from 'react-router-dom';
import { textoModalidad, textoSalario, textoPlazas } from '../utils/formato.js';
import LogoEmpresa from './LogoEmpresa.jsx';
import PlazoOferta from './PlazoOferta.jsx';
import Icono from './Icono.jsx';
import BotonFavorito from './BotonFavorito.jsx';
import EstadoCandidatura from './EstadoCandidatura.jsx';

// Si la oferta trae `esFavorita` (búsqueda hecha por un alumno) se muestra el botón de favoritos
export default function TarjetaOferta({ oferta, onFavoritoCambio }) {
  const visibles = oferta.tecnologias.slice(0, 4);
  const resto = oferta.tecnologias.length - visibles.length;
  return (
    <article className="tarjeta-oferta">
      <div className="tarjeta-oferta__cabecera">
        <LogoEmpresa empresa={oferta.empresa} />
        <div className="tarjeta-oferta__titulos">
          <h3><Link to={`/ofertas/${oferta.id}`} className="tarjeta-oferta__enlace">{oferta.titulo}</Link></h3>
          <p>
            {oferta.empresa.nombre}
            {oferta.empresa.verificada
              ? <Icono nombre="escudo" tamano={14} className="icono-verificada" titulo="Empresa verificada" />
              : <span className="sin-verificar">Sin verificar</span>}
          </p>
        </div>
        {oferta.esFavorita !== undefined && (
          <BotonFavorito ofertaId={oferta.id} titulo={oferta.titulo} esFavorita={oferta.esFavorita} onCambio={onFavoritoCambio} />
        )}
      </div>
      <ul className="metadatos">
        <li><span className="ciclo">{oferta.ciclo.codigo}</span></li>
        <li><Icono nombre="ubicacion" tamano={15} /> {oferta.localidad}</li>
        <li><Icono nombre="maletin" tamano={15} /> {textoModalidad(oferta.modalidad)}</li>
        <li><Icono nombre="usuarios" tamano={15} /> {textoPlazas(oferta.plazas)}</li>
      </ul>
      <ul className="etiquetas" aria-label="Tecnologías">
        {visibles.map((t) => <li key={t.id} className={t.obligatoria ? 'etiqueta' : 'etiqueta etiqueta--opcional'}>{t.nombre}</li>)}
        {resto > 0 && <li className="etiqueta etiqueta--opcional">+{resto}</li>}
      </ul>
      <div className="tarjeta-oferta__pie">
        <span className={oferta.remunerada ? 'salario' : 'salario salario--no'}>{textoSalario(oferta)}</span>
        {oferta.miEstado ? <EstadoCandidatura estado={oferta.miEstado} /> : <PlazoOferta oferta={oferta} />}
      </div>
    </article>
  );
}
