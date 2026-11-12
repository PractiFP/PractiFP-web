// Bloque lateral del detalle de oferta: inscribirse, estado de la candidatura y favoritos.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { inscribirse } from '../services/candidaturasService.js';
import { miPerfil } from '../services/alumnosService.js';
import { formatearFechaHora, textoSalario } from '../utils/formato.js';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';
import Modal from './Modal.jsx';
import BotonFavorito from './BotonFavorito.jsx';
import EstadoCandidatura from './EstadoCandidatura.jsx';
import PlazoOferta from './PlazoOferta.jsx';

export default function PanelInscripcion({ oferta, onInscrito }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (oferta.esPropia) {
    return (
      <section className="tarjeta pila tarjeta--destacada">
        <p><strong>Es una oferta de tu empresa.</strong></p>
        <Link to={`/panel/empresa/candidatos?oferta=${oferta.id}`} className="boton boton--primario"><Icono nombre="usuarios" tamano={16} /> Ver candidatos</Link>
        <Link to={`/panel/empresa/ofertas/${oferta.id}/editar`} className="boton boton--secundario"><Icono nombre="editar" tamano={16} /> Editar oferta</Link>
        <Link to={`/panel/empresa/procesos?oferta=${oferta.id}`} className="boton boton--secundario"><Icono nombre="capas" tamano={16} /> Editar proceso de selección</Link>
      </section>
    );
  }

  const cabecera = (
    <div className="inscripcion__cabecera">
      <strong>{textoSalario(oferta)}</strong>
      <PlazoOferta oferta={oferta} />
    </div>
  );

  if (!usuario) {
    return (
      <section className="tarjeta pila tarjeta--destacada">
        {cabecera}
        {oferta.abierta ? (
          <>
            <Link to="/login" state={{ desde: location.pathname }} className="boton boton--primario">Inicia sesión para inscribirte</Link>
            <Link to="/registro" className="boton boton--secundario">Crear cuenta de alumno</Link>
          </>
        ) : <p className="texto-suave">Esta oferta no admite inscripciones.</p>}
      </section>
    );
  }

  if (usuario.rol !== 'ALUMNO') {
    return (
      <section className="tarjeta pila">
        {cabecera}
        <p className="nota"><Icono nombre="info" tamano={16} /> Solo las cuentas de alumno pueden inscribirse en ofertas.</p>
      </section>
    );
  }

  return <PanelAlumno oferta={oferta} cabecera={cabecera} onInscrito={onInscrito} />;
}

function PanelAlumno({ oferta, cabecera, onInscrito }) {
  const toast = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [tieneCv, setTieneCv] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const c = oferta.miCandidatura;

  async function abrirConfirmacion() {
    setConfirmar(true);
    // Se comprueba si tiene currículum para avisarle antes de inscribirse
    miPerfil().then((p) => setTieneCv(p.tieneCv)).catch(() => setTieneCv(true));
  }

  async function confirmarInscripcion() {
    setEnviando(true);
    try {
      const candidatura = await inscribirse(oferta.id);
      toast('Candidatura enviada.');
      setConfirmar(false);
      onInscrito(candidatura);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta pila tarjeta--destacada">
      {cabecera}
      {c ? (
        <div className="pila pila--compacta">
          <p className="texto-suave">Te inscribiste el {formatearFechaHora(c.fecha)}.</p>
          <p>Estado: <EstadoCandidatura estado={c.estado} /></p>
          <Link to="/panel/alumno/candidaturas" className="boton boton--secundario">Ver mis candidaturas</Link>
        </div>
      ) : oferta.abierta ? (
        <Boton onClick={abrirConfirmacion}>Inscribirme en la oferta</Boton>
      ) : (
        <p className="texto-suave">Esta oferta no admite inscripciones.</p>
      )}
      <BotonFavorito ofertaId={oferta.id} titulo={oferta.titulo} esFavorita={oferta.esFavorita} conTexto />

      {confirmar && (
        <Modal titulo="Confirmar inscripción" onCerrar={() => setConfirmar(false)}>
          <div className="modal__texto">
            <p>Vas a inscribirte en <strong>{oferta.titulo}</strong> de {oferta.empresa.nombre}.</p>
            <p className="texto-suave">La empresa podrá ver tu perfil{tieneCv ? ' y tu currículum' : ''}. Solo puedes inscribirte una vez en cada oferta.</p>
            {oferta.resumenFases?.total > 0 && (
              <p className="texto-suave">El proceso tiene {oferta.resumenFases.total} fases y dura unos {oferta.resumenFases.diasMinimo === oferta.resumenFases.diasMaximo ? oferta.resumenFases.diasMaximo : `${oferta.resumenFases.diasMinimo} a ${oferta.resumenFases.diasMaximo}`} días.</p>
            )}
            {tieneCv === false && (
              <p className="aviso"><Icono nombre="info" /> No has subido tu currículum. Puedes inscribirte igualmente, pero te recomendamos añadirlo en <Link to="/panel/alumno/perfil">Mi perfil</Link>.</p>
            )}
          </div>
          <div className="modal__acciones">
            <Boton variante="fantasma" onClick={() => setConfirmar(false)} disabled={enviando}>Cancelar</Boton>
            <Boton onClick={confirmarInscripcion} disabled={enviando}>{enviando ? 'Enviando…' : 'Confirmar inscripción'}</Boton>
          </div>
        </Modal>
      )}
    </section>
  );
}
