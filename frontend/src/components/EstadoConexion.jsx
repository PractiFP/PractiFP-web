// Tarjeta que muestra si la API y la base de datos responden (Fase 1).
import { usePeticion } from '../hooks/usePeticion.js';
import { obtenerSalud } from '../services/saludService.js';
import Icono from './Icono.jsx';
import Boton from './Boton.jsx';
import Cargando from './Cargando.jsx';
import MensajeError from './MensajeError.jsx';

const ETIQUETAS = {
  usuarios: 'Usuarios',
  alumnos: 'Alumnos',
  empresas: 'Empresas',
  ofertasActivas: 'Ofertas activas',
  candidaturas: 'Candidaturas',
  tecnologias: 'Tecnologías',
};

function Fila({ icono, nombre, ok, detalle }) {
  return (
    <div className="estado__fila">
      <Icono nombre={icono} />
      <span className="estado__nombre">{nombre}</span>
      <span className={`pastilla ${ok ? 'pastilla--ok' : 'pastilla--error'}`}>{ok ? 'Conectada' : 'Sin conexión'}</span>
      {detalle && <span className="estado__detalle">{detalle}</span>}
    </div>
  );
}

export default function EstadoConexion() {
  const { datos, cargando, error, recargar } = usePeticion(obtenerSalud);

  return (
    <section className="tarjeta estado-sistema" aria-labelledby="titulo-estado">
      <div className="tarjeta__cabecera">
        <h2 id="titulo-estado">Estado del sistema</h2>
        <Boton variante="fantasma" tamano="pequeno" onClick={recargar} disabled={cargando}>
          <Icono nombre="recargar" tamano={16} /> Comprobar de nuevo
        </Boton>
      </div>

      {cargando && <Cargando texto="Comprobando la conexión…" />}

      {!cargando && error && (
        <MensajeError
          titulo={error.status === 503 ? 'La base de datos no responde' : 'La API no responde'}
          mensaje={error.status === 503 ? 'El backend está arrancado, pero no puede conectar con MariaDB. Revisa las variables DB_* del archivo backend/.env.' : error.message}
          onReintentar={recargar}
        />
      )}

      {!cargando && datos && (
        <>
          <div className="estado__filas">
            <Fila icono="servidor" nombre="API (Express)" ok={datos.api === 'ok'} />
            <Fila icono="baseDatos" nombre="Base de datos (MariaDB)" ok={datos.baseDatos.conectada}
              detalle={`${datos.baseDatos.version} · ${datos.baseDatos.latenciaMs} ms`} />
          </div>
          <dl className="estado__cifras">
            {Object.entries(datos.baseDatos.registros).map(([clave, valor]) => (
              <div key={clave}>
                <dt>{ETIQUETAS[clave] ?? clave}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
