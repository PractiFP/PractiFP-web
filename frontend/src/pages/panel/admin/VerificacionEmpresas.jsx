// Empresas pendientes de verificación, con todos sus datos para revisarlos.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext.jsx';
import { useListaEditable } from '../../../hooks/useListaEditable.js';
import * as admin from '../../../services/adminService.js';
import { formatearFechaHora } from '../../../utils/formato.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import LogoEmpresa from '../../../components/LogoEmpresa.jsx';

export default function VerificacionEmpresas() {
  const toast = useToast();
  const { lista, cargando, error, recargar, quitar } = useListaEditable((o) => admin.empresas({ verificada: 'no' }, o), []);
  const [ocupada, setOcupada] = useState(null);

  async function verificar(e) {
    setOcupada(e.id);
    try {
      await admin.cambiarVerificada(e.id, true);
      quitar(e.id);
      toast(`${e.nombre} verificada.`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>Verificación de empresas</h1>
        <p className="texto-suave">Comprueba los datos de cada empresa antes de marcarla como verificada. Las verificadas muestran una insignia en sus ofertas.</p>
      </div>
      {cargando && !lista && <Cargando />}
      {error && <MensajeError mensaje={error.message} onReintentar={recargar} />}
      {lista && (lista.length ? (
        <div className="rejilla-2 rejilla-2--arriba">
          {lista.map((e) => (
            <article key={e.id} className="tarjeta pila">
              <div className="fila-centrada">
                <LogoEmpresa empresa={e} />
                <div>
                  <h2 className="tarjeta__titulo sin-margen">{e.nombre}</h2>
                  <p className="texto-suave texto-pequeno">Registrada el {formatearFechaHora(e.fechaRegistro)}{e.activo ? '' : ' · cuenta desactivada'}</p>
                </div>
              </div>
              <ul className="metadatos metadatos--columna">
                <li><Icono nombre="usuario" tamano={15} /> {e.email}</li>
                <li><Icono nombre="ubicacion" tamano={15} /> {[e.direccion, e.localidad].filter(Boolean).join(', ') || 'Sin dirección'}</li>
                <li><Icono nombre="web" tamano={15} /> {e.web ? <a href={e.web} target="_blank" rel="noopener noreferrer">{e.web}</a> : 'Sin página web'}</li>
                <li><Icono nombre="telefono" tamano={15} /> {e.telefono || 'Sin teléfono'}</li>
                <li><Icono nombre="maletin" tamano={15} /> {e.ofertas} {e.ofertas === 1 ? 'oferta publicada' : 'ofertas publicadas'}</li>
              </ul>
              <p className="perfil__descripcion">{e.descripcion || <span className="texto-suave">Sin descripción.</span>}</p>
              <div className="fila-botones">
                <Boton onClick={() => verificar(e)} disabled={ocupada === e.id}><Icono nombre="escudo" tamano={16} /> Verificar empresa</Boton>
                <Link to={`/empresas/${e.id}`} className="boton boton--fantasma">Ver ficha</Link>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="vacio"><Icono nombre="check" tamano={28} /><p>No hay empresas pendientes de verificación.</p></div>)}
    </>
  );
}
