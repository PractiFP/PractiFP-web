// Crear o editar un proyecto del portfolio, con imagen opcional.
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { crearProyecto, actualizarProyecto, urlImagenProyecto } from '../services/proyectosService.js';
import { validar, reglas } from '../utils/validadores.js';
import { hoyISO, MB } from '../utils/formato.js';
import Modal from './Modal.jsx';
import Campo from './Campo.jsx';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

export default function ModalProyecto({ proyecto, catalogo, onCerrar, onGuardado }) {
  const toast = useToast();
  const editando = Boolean(proyecto);
  const [datos, setDatos] = useState({
    titulo: proyecto?.titulo ?? '',
    descripcion: proyecto?.descripcion ?? '',
    urlGithub: proyecto?.urlGithub ?? '',
    urlDemo: proyecto?.urlDemo ?? '',
    fechaCreacion: proyecto?.fechaCreacion ?? hoyISO(),
  });
  const [tecnologias, setTecnologias] = useState(() => proyecto?.tecnologias.map((t) => t.id) ?? []);
  const [imagen, setImagen] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const vistaPrevia = useMemo(() => (imagen ? URL.createObjectURL(imagen) : null), [imagen]);
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);
  const imagenActual = vistaPrevia || (proyecto?.tieneImagen && !quitarImagen ? urlImagenProyecto(proyecto.id, Date.now()) : null);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setDatos((d) => ({ ...d, [name]: value }));
    setErrores((x) => ({ ...x, [name]: undefined }));
  };
  const alternarTec = (id) => setTecnologias((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  function elegirImagen(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) return setErrores((x) => ({ ...x, imagen: 'La imagen debe ser JPG, PNG o WebP.' }));
    if (archivo.size > 2 * MB) return setErrores((x) => ({ ...x, imagen: 'La imagen supera los 2 MB.' }));
    setErrores((x) => ({ ...x, imagen: undefined }));
    setImagen(archivo);
    setQuitarImagen(false);
  }

  async function enviar(e) {
    e.preventDefault();
    const errs = validar({ ...datos, tecnologias }, {
      titulo: [reglas.requerido(), reglas.longitudMax(150)],
      descripcion: [reglas.requerido(), reglas.longitudMax(2000)],
      urlGithub: [reglas.url()],
      urlDemo: [reglas.url()],
      fechaCreacion: [reglas.requerido('Indica la fecha.'), (v) => (v > hoyISO() ? 'La fecha no puede ser futura.' : null)],
      tecnologias: [(v) => (v.length > 10 ? 'Máximo 10 tecnologías.' : null)],
    });
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    try {
      const cuerpo = { ...datos, tecnologias };
      const guardado = editando
        ? await actualizarProyecto(proyecto.id, cuerpo, imagen, quitarImagen)
        : await crearProyecto(cuerpo, imagen);
      toast(editando ? 'Proyecto actualizado.' : 'Proyecto añadido al portfolio.');
      onGuardado(guardado);
    } catch (err) {
      if (err.detalles) setErrores(err.detalles);
      toast(err.message, 'error');
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={editando ? 'Editar proyecto' : 'Nuevo proyecto'} onCerrar={onCerrar} ancho="grande">
      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="rejilla-2">
          <Campo etiqueta="Título *" name="titulo" value={datos.titulo} onChange={cambiar} error={errores.titulo} />
          <Campo etiqueta="Fecha de creación *" name="fechaCreacion" tipo="date" max={hoyISO()} value={datos.fechaCreacion} onChange={cambiar} error={errores.fechaCreacion} />
        </div>
        <Campo como="textarea" etiqueta="Descripción *" name="descripcion" value={datos.descripcion} onChange={cambiar} error={errores.descripcion} maxLength={2000} rows={4}
          placeholder="Qué hace el proyecto, qué parte hiciste tú y qué aprendiste." />
        <div className="rejilla-2">
          <Campo etiqueta="Repositorio de GitHub" name="urlGithub" tipo="url" value={datos.urlGithub} onChange={cambiar} error={errores.urlGithub} placeholder="https://github.com/…" />
          <Campo etiqueta="Demo (opcional)" name="urlDemo" tipo="url" value={datos.urlDemo} onChange={cambiar} error={errores.urlDemo} placeholder="https://…" />
        </div>

        <fieldset className="grupo">
          <legend>Imagen representativa</legend>
          <div className="imagen-proyecto">
            {imagenActual ? <img src={imagenActual} alt="Vista previa de la imagen del proyecto" /> : <div className="imagen-proyecto__vacia"><Icono nombre="subir" tamano={22} /></div>}
            <div className="pila pila--compacta">
              <label className="boton boton--secundario boton--pequeno">
                <Icono nombre="subir" tamano={15} /> {imagenActual ? 'Cambiar imagen' : 'Elegir imagen'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="visualmente-oculto" onChange={elegirImagen} />
              </label>
              {imagenActual && (
                <Boton variante="fantasma" tamano="pequeno" onClick={() => { setImagen(null); setQuitarImagen(Boolean(proyecto?.tieneImagen)); }}>
                  <Icono nombre="papelera" tamano={15} /> Quitar imagen
                </Boton>
              )}
              <span className="campo__ayuda">JPG, PNG o WebP de 2 MB como máximo.</span>
              {errores.imagen && <span className="campo__error">{errores.imagen}</span>}
            </div>
          </div>
        </fieldset>

        <fieldset className="grupo">
          <legend>Tecnologías utilizadas</legend>
          <div className="chips-seleccion">
            {catalogo.map((t) => (
              <button key={t.id} type="button" className={tecnologias.includes(t.id) ? 'activa' : ''} aria-pressed={tecnologias.includes(t.id)} onClick={() => alternarTec(t.id)}>{t.nombre}</button>
            ))}
          </div>
          {errores.tecnologias && <span className="campo__error">{errores.tecnologias}</span>}
        </fieldset>

        <div className="modal__acciones">
          <Boton variante="fantasma" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
          <Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Añadir proyecto'}</Boton>
        </div>
      </form>
    </Modal>
  );
}
