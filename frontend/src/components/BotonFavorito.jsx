// Guarda o quita una oferta de favoritos (solo alumnos).
import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { guardarFavorito, quitarFavorito } from '../services/favoritosService.js';
import Icono from './Icono.jsx';

export default function BotonFavorito({ ofertaId, titulo, esFavorita, onCambio, conTexto = false }) {
  const toast = useToast();
  const [activa, setActiva] = useState(esFavorita);
  const [ocupado, setOcupado] = useState(false);

  async function alternar() {
    setOcupado(true);
    try {
      if (activa) await quitarFavorito(ofertaId); else await guardarFavorito(ofertaId);
      setActiva(!activa);
      toast(activa ? 'Oferta quitada de favoritos.' : 'Oferta guardada en favoritos.');
      onCambio?.(!activa);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupado(false);
    }
  }

  const etiqueta = activa ? `Quitar ${titulo ?? 'la oferta'} de favoritos` : `Guardar ${titulo ?? 'la oferta'} en favoritos`;
  return (
    <button type="button" className={`favorito ${activa ? 'favorito--activo' : ''} ${conTexto ? 'boton boton--secundario' : ''}`}
      onClick={alternar} disabled={ocupado} aria-pressed={activa} aria-label={conTexto ? undefined : etiqueta} title={etiqueta}>
      <Icono nombre="corazon" tamano={18} />
      {conTexto && (activa ? 'Guardada en favoritos' : 'Guardar en favoritos')}
    </button>
  );
}
