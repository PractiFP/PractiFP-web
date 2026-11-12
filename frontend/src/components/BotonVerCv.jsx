// Descarga el currículum (ruta protegida) y lo muestra en una ventana modal.
import { useEffect, useState } from 'react';
import { obtenerCv } from '../services/alumnosService.js';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';
import Modal from './Modal.jsx';
import Cargando from './Cargando.jsx';
import MensajeError from './MensajeError.jsx';

export default function BotonVerCv({ alumnoId, nombre, variante = 'secundario', tamano, texto = 'Ver currículum' }) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto) return undefined;
    let enlace = null;
    let cancelado = false;
    setError(null);
    obtenerCv(alumnoId)
      .then((blob) => { if (!cancelado) { enlace = URL.createObjectURL(blob); setUrl(enlace); } })
      .catch((err) => { if (!cancelado) setError(err); });
    return () => { cancelado = true; if (enlace) URL.revokeObjectURL(enlace); setUrl(null); };
  }, [abierto, alumnoId]);

  const archivo = `CV_${(nombre || 'alumno').replace(/\s+/g, '_')}.pdf`;
  return (
    <>
      <Boton variante={variante} tamano={tamano} onClick={() => setAbierto(true)} aria-label={texto === 'Ver currículum' ? undefined : `Ver currículum de ${nombre}`}>
        <Icono nombre="archivo" tamano={16} /> {texto}
      </Boton>
      {abierto && (
        <Modal titulo={`Currículum${nombre ? ` · ${nombre}` : ''}`} onCerrar={() => setAbierto(false)} ancho="grande">
          {!url && !error && <Cargando texto="Cargando el currículum…" />}
          {error && <MensajeError titulo="No se ha podido abrir el currículum" mensaje={error.message} />}
          {url && (
            <>
              <iframe className="visor-pdf" src={url} title={`Currículum de ${nombre}`} />
              <div className="modal__acciones">
                <a className="boton boton--secundario" href={url} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a>
                <a className="boton boton--primario" href={url} download={archivo}>Descargar PDF</a>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
