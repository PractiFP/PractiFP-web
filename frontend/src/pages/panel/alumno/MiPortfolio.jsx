// Portfolio del alumno: añadir, editar y eliminar proyectos.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { misProyectos, eliminarProyecto } from '../../../services/proyectosService.js';
import { listarTecnologias } from '../../../services/tecnologiasService.js';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import TarjetaProyecto from '../../../components/TarjetaProyecto.jsx';
import ModalProyecto from '../../../components/ModalProyecto.jsx';
import ModalConfirmar from '../../../components/ModalConfirmar.jsx';

export default function MiPortfolio() {
  const { usuario } = useAuth();
  const toast = useToast();
  const proyectos = usePeticion(misProyectos);
  const catalogo = usePeticion(listarTecnologias);
  const [lista, setLista] = useState(null);
  const [version, setVersion] = useState(Date.now());
  const [editando, setEditando] = useState(null); // null: cerrado · 'nuevo' · proyecto
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  useEffect(() => setLista(proyectos.datos), [proyectos.datos]);

  function guardado(p) {
    setLista((l) => {
      const resto = l.filter((x) => x.id !== p.id);
      return [p, ...resto].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id - a.id);
    });
    setVersion(Date.now()); // vuelve a cargar la imagen si ha cambiado
    setEditando(null);
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await eliminarProyecto(aEliminar.id);
      setLista((l) => l.filter((x) => x.id !== aEliminar.id));
      toast('Proyecto eliminado.');
      setAEliminar(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setEliminando(false);
    }
  }

  if (proyectos.cargando || catalogo.cargando || (proyectos.datos && !lista)) return <Cargando />;
  const error = proyectos.error || catalogo.error;
  if (error) return <MensajeError mensaje={error.message} onReintentar={() => { proyectos.recargar(); catalogo.recargar(); }} />;

  return (
    <>
      <div className="panel__cabecera panel__cabecera--acciones">
        <div>
          <h1>Mi portfolio</h1>
          <p className="texto-suave">Tus proyectos aparecen en tu <Link to={`/alumnos/${usuario.alumnoId}`}>perfil público</Link>.</p>
        </div>
        <Boton onClick={() => setEditando('nuevo')}><Icono nombre="mas" tamano={16} /> Añadir proyecto</Boton>
      </div>

      {lista.length ? (
        <div className="rejilla-proyectos">
          <h2 className="visualmente-oculto">Proyectos</h2>
          {lista.map((p) => (
            <TarjetaProyecto key={p.id} proyecto={p} version={version} acciones={(
              <span className="proyecto__acciones">
                <Boton variante="fantasma" tamano="pequeno" onClick={() => setEditando(p)} aria-label={`Editar ${p.titulo}`}><Icono nombre="editar" tamano={15} /></Boton>
                <Boton variante="fantasma" tamano="pequeno" onClick={() => setAEliminar(p)} aria-label={`Eliminar ${p.titulo}`}><Icono nombre="papelera" tamano={15} /></Boton>
              </span>
            )} />
          ))}
        </div>
      ) : (
        <div className="vacio">
          <p>Todavía no tienes proyectos. Añade el primero para que las empresas vean lo que sabes hacer.</p>
          <Boton onClick={() => setEditando('nuevo')}><Icono nombre="mas" tamano={16} /> Añadir proyecto</Boton>
        </div>
      )}

      {editando && (
        <ModalProyecto proyecto={editando === 'nuevo' ? null : editando} catalogo={catalogo.datos} onCerrar={() => setEditando(null)} onGuardado={guardado} />
      )}
      {aEliminar && (
        <ModalConfirmar titulo="Eliminar proyecto" onCerrar={() => setAEliminar(null)} onConfirmar={eliminar} enviando={eliminando}>
          <p>Se eliminará <strong>{aEliminar.titulo}</strong> de tu portfolio.</p>
        </ModalConfirmar>
      )}
    </>
  );
}
