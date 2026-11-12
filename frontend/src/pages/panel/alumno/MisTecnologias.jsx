// Tecnologías que conoce el alumno y su nivel. Cada cambio se guarda al momento.
import { useMemo, useState } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { miPerfil, guardarTecnologia, quitarTecnologia } from '../../../services/alumnosService.js';
import { listarTecnologias } from '../../../services/tecnologiasService.js';
import { NIVELES } from '../../../utils/formato.js';
import Boton from '../../../components/Boton.jsx';
import Icono from '../../../components/Icono.jsx';
import Cargando from '../../../components/Cargando.jsx';
import MensajeError from '../../../components/MensajeError.jsx';
import NivelTecnologia from '../../../components/NivelTecnologia.jsx';

export default function MisTecnologias() {
  const perfil = usePeticion(miPerfil);
  const catalogo = usePeticion(listarTecnologias);

  if (perfil.cargando || catalogo.cargando) return <Cargando />;
  if (perfil.error || catalogo.error) {
    return <MensajeError mensaje={(perfil.error || catalogo.error).message} onReintentar={() => { perfil.recargar(); catalogo.recargar(); }} />;
  }
  return <Gestor inicial={perfil.datos.tecnologias} catalogo={catalogo.datos} />;
}

function Gestor({ inicial, catalogo }) {
  const toast = useToast();
  const [lista, setLista] = useState(inicial);
  const [ocupado, setOcupado] = useState(null); // id de la tecnología que se está guardando
  const disponibles = useMemo(() => catalogo.filter((t) => !lista.some((x) => x.id === t.id)), [catalogo, lista]);
  const [nueva, setNueva] = useState({ id: '', nivel: 'INTERMEDIO' });

  async function ejecutar(id, accion, mensaje) {
    setOcupado(id);
    try {
      setLista(await accion());
      toast(mensaje);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupado(null);
    }
  }

  function anadir(e) {
    e.preventDefault();
    const id = Number(nueva.id || disponibles[0]?.id);
    if (!id) return;
    const nombre = catalogo.find((t) => t.id === id)?.nombre;
    ejecutar(id, () => guardarTecnologia(id, nueva.nivel), `${nombre} añadida.`).then(() => setNueva((n) => ({ ...n, id: '' })));
  }

  return (
    <>
      <div className="panel__cabecera">
        <h1>Mis tecnologías</h1>
        <p className="texto-suave">Indica qué conoces y tu nivel. Las empresas lo comparan con lo que piden en sus ofertas.</p>
      </div>

      <section className="tarjeta">
        <form className="fila-formulario" onSubmit={anadir}>
          <div className="campo">
            <label htmlFor="nueva-tec">Tecnología</label>
            <select id="nueva-tec" className="entrada" value={nueva.id} onChange={(e) => setNueva((n) => ({ ...n, id: e.target.value }))} disabled={!disponibles.length}>
              {disponibles.length ? disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>) : <option>Ya has añadido todas</option>}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="nueva-nivel">Nivel</label>
            <select id="nueva-nivel" className="entrada" value={nueva.nivel} onChange={(e) => setNueva((n) => ({ ...n, nivel: e.target.value }))}>
              {NIVELES.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
            </select>
          </div>
          <Boton type="submit" disabled={!disponibles.length || ocupado !== null}><Icono nombre="mas" tamano={16} /> Añadir</Boton>
        </form>
      </section>

      {lista.length ? (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Tecnología</th><th>Nivel</th><th><span className="visualmente-oculto">Nivel visual</span></th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.nombre}</strong></td>
                  <td>
                    <select className="entrada entrada--compacta" value={t.nivel} aria-label={`Nivel de ${t.nombre}`} disabled={ocupado === t.id}
                      onChange={(e) => ejecutar(t.id, () => guardarTecnologia(t.id, e.target.value), `Nivel de ${t.nombre} actualizado.`)}>
                      {NIVELES.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
                    </select>
                  </td>
                  <td><NivelTecnologia nivel={t.nivel} /></td>
                  <td className="tabla__acciones">
                    <Boton variante="fantasma" tamano="pequeno" disabled={ocupado === t.id} aria-label={`Quitar ${t.nombre}`}
                      onClick={() => ejecutar(t.id, () => quitarTecnologia(t.id), `${t.nombre} eliminada.`)}>
                      <Icono nombre="papelera" tamano={16} />
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vacio"><p>Todavía no has añadido tecnologías. Elige la primera arriba.</p></div>
      )}
    </>
  );
}
