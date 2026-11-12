// Formulario para valorar una empresa. La valoración queda pendiente de moderación.
import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { valorarEmpresa } from '../services/valoracionesService.js';
import Modal from './Modal.jsx';
import Boton from './Boton.jsx';
import Campo from './Campo.jsx';
import Icono from './Icono.jsx';
import SelectorEstrellas from './SelectorEstrellas.jsx';

export default function ModalValorar({ empresa, onCerrar, onValorada }) {
  const toast = useToast();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const errs = {};
    if (!puntuacion) errs.puntuacion = 'Elige una puntuación del 1 al 5.';
    if (comentario.trim().length < 10) errs.comentario = 'Escribe al menos 10 caracteres.';
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    try {
      const valoracion = await valorarEmpresa(empresa.id, puntuacion, comentario.trim());
      toast('Valoración enviada. Se publicará cuando la revise el equipo de moderación.');
      onValorada(valoracion);
    } catch (err) {
      if (err.detalles) setErrores(err.detalles);
      else toast(err.message, 'error');
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Valorar ${empresa.nombre}`} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        <SelectorEstrellas valor={puntuacion} onCambiar={(n) => { setPuntuacion(n); setErrores((e) => ({ ...e, puntuacion: undefined })); }} error={errores.puntuacion} />
        <Campo como="textarea" etiqueta="Comentario" name="comentario" value={comentario} onChange={(e) => { setComentario(e.target.value); setErrores((x) => ({ ...x, comentario: undefined })); }}
          error={errores.comentario} maxLength={1000} rows={5} placeholder="¿Qué tal fueron tus prácticas? Tutor, tareas, ambiente, horarios…" />
        <p className="aviso"><Icono nombre="info" /> Tu valoración se publicará cuando la revise el equipo de moderación. Solo puedes valorar una vez cada empresa.</p>
        <div className="modal__acciones">
          <Boton variante="fantasma" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
          <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar valoración'}</Boton>
        </div>
      </form>
    </Modal>
  );
}
