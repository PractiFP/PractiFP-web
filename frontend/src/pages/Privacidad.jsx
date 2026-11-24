// Política de privacidad (RGPD y LOPDGDD). Los datos del responsable están en config/legal.js.
import { Link } from 'react-router-dom';
import { RESPONSABLE, PRIVACIDAD_ACTUALIZADA } from '../config/legal.js';

export default function Privacidad() {
  return (
    <div className="contenedor">
      <article className="tarjeta texto-legal">
        <h1>Política de privacidad</h1>
        <p className="texto-suave">Última actualización: {PRIVACIDAD_ACTUALIZADA}</p>

        <h2>1. Quién es el responsable</h2>
        <p>
          El responsable del tratamiento de tus datos es <strong>{RESPONSABLE.nombre}</strong> ({RESPONSABLE.nif}),
          con dirección en {RESPONSABLE.direccion}. Para cualquier cuestión sobre tus datos puedes escribir a{' '}
          <strong>{RESPONSABLE.email}</strong>.
        </p>

        <h2>2. Qué datos tratamos</h2>
        <ul>
          <li><strong>Todas las cuentas:</strong> correo electrónico y contraseña (guardada cifrada, nadie puede leerla).</li>
          <li><strong>Alumnos:</strong> nombre y apellidos, ciclo formativo, curso, centro, localidad, descripción, currículum (PDF),
            tecnologías que conoces, proyectos del portfolio, ofertas guardadas, candidaturas y valoraciones que escribas.</li>
          <li><strong>Empresas:</strong> nombre, descripción, web, teléfono, dirección y ubicación en el mapa, ofertas y procesos de selección.</li>
        </ul>
        <p>No pedimos datos especialmente protegidos (salud, ideología, etc.). No los incluyas en tu perfil ni en tu currículum.</p>

        <h2>3. Para qué los usamos</h2>
        <p>
          Para que los alumnos de Formación Profesional encuentren prácticas y las empresas encuentren candidatos:
          mostrar perfiles y ofertas, gestionar candidaturas y procesos de selección, y enviarte los correos necesarios
          para usar tu cuenta (por ejemplo, el enlace para cambiar la contraseña). No enviamos publicidad ni vendemos tus datos.
        </p>

        <h2>4. Base legal</h2>
        <p>
          Tu <strong>consentimiento</strong>, que das al crear la cuenta (art. 6.1.a del RGPD), y la <strong>prestación del
          servicio</strong> que nos pides al usar la plataforma (art. 6.1.b). Puedes retirar el consentimiento cuando quieras
          eliminando tu cuenta.
        </p>
        <p>Si tienes menos de 14 años, necesitas el consentimiento de tu madre, padre o tutor legal para registrarte.</p>

        <h2>5. Quién puede ver tus datos</h2>
        <ul>
          <li><strong>Cualquier visitante</strong> puede ver el perfil público de los alumnos (nombre, ciclo, centro, localidad,
            descripción, tecnologías y proyectos), el perfil de las empresas y las ofertas.</li>
          <li><strong>El currículum</strong> de un alumno solo lo ven el propio alumno, la administración y las empresas
            a cuyas ofertas se ha inscrito.</li>
          <li><strong>El correo electrónico</strong> no se muestra públicamente.</li>
          <li><strong>La administración</strong> de PractiFP puede ver los datos de todas las cuentas para gestionar la plataforma.</li>
        </ul>

        <h2>6. Proveedores que tratan datos por nuestra cuenta</h2>
        <ul>
          <li><strong>Vercel Inc.</strong> aloja la web. Puede tratar datos fuera de la Unión Europea (Estados Unidos)
            con las garantías del Marco de Privacidad de Datos UE-EE. UU. y cláusulas contractuales tipo.</li>
          <li><strong>PingCAP (TiDB Cloud)</strong> guarda la base de datos en servidores de la Unión Europea (Fráncfort).</li>
          <li>El <strong>servicio de correo</strong> que envía los mensajes de la plataforma.</li>
          <li>El <strong>mapa de empresas</strong> carga las imágenes del mapa desde los servidores de OpenStreetMap,
            que reciben tu dirección IP al verlo.</li>
        </ul>

        <h2>7. Cuánto tiempo los guardamos</h2>
        <p>
          Mientras tengas la cuenta. Al eliminarla se borran al momento tu perfil, tu currículum, tus proyectos, candidaturas
          y demás datos asociados (en el caso de una empresa, también sus ofertas). Las copias de seguridad automáticas
          de la base de datos que pudieran contenerlos se eliminan cuando termina su plazo de conservación.
        </p>

        <h2>8. Tus derechos</h2>
        <p>Tienes derecho a:</p>
        <ul>
          <li><strong>Acceder</strong> a tus datos y llevártelos (portabilidad): en tu panel, en
            <em> Configuración → Descargar mis datos</em>.</li>
          <li><strong>Rectificarlos</strong>: desde tu perfil en cualquier momento.</li>
          <li><strong>Suprimirlos</strong>: en <em>Configuración → Eliminar mi cuenta</em>.</li>
          <li><strong>Oponerte</strong> al tratamiento o pedir que se <strong>limite</strong>: escribiendo a {RESPONSABLE.email}.</li>
        </ul>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos
          (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
        </p>

        <h2>9. Seguridad</h2>
        <p>
          La conexión está cifrada (HTTPS), las contraseñas se guardan cifradas con bcrypt y el acceso a los currículums
          está restringido. Limitamos los intentos de inicio de sesión para evitar ataques.
        </p>

        <h2>10. Cookies y almacenamiento local</h2>
        <p>
          PractiFP no usa cookies ni herramientas de analítica o publicidad. Para mantener tu sesión iniciada guarda un
          identificador en el almacenamiento local de tu navegador, que es imprescindible para el servicio y se borra al
          cerrar sesión. Las fuentes tipográficas se sirven desde nuestro propio servidor.
        </p>

        <p className="nota">¿Dudas? Escribe a {RESPONSABLE.email} o vuelve a <Link to="/">la página de inicio</Link>.</p>
      </article>
    </div>
  );
}
