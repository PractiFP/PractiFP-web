// Pide confirmación antes de una acción que no se puede deshacer.
import Modal from './Modal.jsx';
import Boton from './Boton.jsx';

export default function ModalConfirmar({ titulo, children, textoConfirmar = 'Eliminar', onConfirmar, onCerrar, enviando = false }) {
  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <div className="modal__texto">{children}</div>
      <div className="modal__acciones">
        <Boton variante="fantasma" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
        <Boton variante="peligro-solido" onClick={onConfirmar} disabled={enviando}>{enviando ? 'Un momento…' : textoConfirmar}</Boton>
      </div>
    </Modal>
  );
}
