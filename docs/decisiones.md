# Decisiones de diseño

Decisiones que el documento de requisitos no especificaba. Se aplicó la opción recomendada; cualquiera se puede cambiar.

| # | Tema | Decisión aplicada | Fase |
|---|---|---|---|
| 1 | Ciclos formativos | Tabla `CICLOS` referenciada desde ALUMNOS y OFERTAS | 1 ✔ |
| 2 | Fase actual de cada candidatura | Columna opcional `CANDIDATURAS.fase_actual_id` | 1 ✔ |
| 3 | Quién puede valorar | Solo alumnos con candidatura ACEPTADA en la empresa; se publican tras moderación | 6 ✔ |
| 4 | Imagen de los proyectos | Subida con Multer (JPG, PNG o WebP, máx. 2 MB) | 6 ✔ |
| 5 | Empresas cercanas | Filtrar el mapa por localidad y centrarlo en ella | 6 ✔ |
| 6 | Coordenadas de la empresa | Se escriben a mano o se eligen pulsando en el mapa del perfil | 3 ✔ / 6 ✔ |
| 7 | Eliminar ofertas con candidaturas | Se avisa y se recomienda desactivar; el borrado elimina en cascada | 4 ✔ |
| 8 | Iconos | SVG propios en el componente `Icono` (sin librerías) | 1 ✔ |
| 9 | Validación | Validadores propios, sin librerías externas | 2 ✔ |
| 10 | Empresas sin verificar | Pueden publicar, con insignia "Sin verificar" | 4 ✔ |
| 11 | Configuración | Cambio de email y de contraseña (para los tres roles) | 3 ✔ |

Otras decisiones técnicas de la Fase 1:

- **Conector `mariadb`** (oficial) en lugar de `mysql2`.
- **JWT en la cabecera `Authorization: Bearer`**, guardado en `localStorage` en el frontend (Fase 2).
- **Proxy de Vite** en desarrollo: el frontend llama a `/api` y Vite lo redirige al backend, sin problemas de CORS.
- **Fechas `DATE` como texto** `YYYY-MM-DD` (`dateStrings`) para evitar desfases de zona horaria.
- **React Router 7** (`react-router-dom`), porque las versiones 6 tienen avisos de seguridad sin corregir.

Decisiones de la Fase 2:

- **Límite de intentos** propio (sin librerías): 10 intentos fallidos por IP cada 15 minutos en login y registro. Se guarda en memoria, así que se reinicia al reiniciar el servidor.
- **Mismo mensaje** («Correo o contraseña incorrectos») tanto si el correo no existe como si la contraseña es incorrecta, y mismo tiempo de respuesta, para no revelar qué correos están registrados.
- **El rol se comprueba en la base de datos** en cada petición, no solo en el token.
- **Tras cerrar sesión** se vuelve a la página de inicio; si la sesión caduca, se lleva al inicio de sesión con un aviso.
- **Dashboards con datos reales** (resúmenes de solo lectura). El menú lateral de cada panel crecerá en cada fase; no se muestran enlaces a secciones aún no implementadas.

Decisiones de la Fase 3:

- **Configuración para todos los roles**: el documento la incluye en el panel del alumno; también se ha añadido a empresa y administrador, porque cambiar la contraseña es necesario en cualquier cuenta.
- **Cambiar el correo exige la contraseña actual**, y ambos cambios tienen límite de intentos.
- **Perfiles de cuentas desactivadas** no se muestran públicamente (solo al propio usuario y al administrador).
- **Quién ve un currículum**: el propio alumno, los administradores y las empresas en cuyas ofertas se haya inscrito el alumno (con cualquier estado de candidatura).
- **Tecnologías del alumno**: cada cambio se guarda al momento, sin botón de guardar.
- **Fichas públicas** de alumno y empresa creadas ya en esta fase; el portfolio, las ofertas y las valoraciones se añadirán en sus fases.

Decisiones de la Fase 4:

- **Oferta abierta** = activa y con la fecha límite no superada. El filtro «Solo ofertas activas y en plazo» (marcado por defecto) muestra solo las abiertas; al desmarcarlo aparecen también las inactivas y las de plazo cerrado.
- **Tecnologías combinadas con «y»**: si se eligen varias, la oferta debe pedirlas todas.
- **Filtros en la URL** (`/ofertas?ciclo=DAW&modalidad=REMOTA`), para poder compartir o guardar una búsqueda. La búsqueda por texto mira el título, la descripción y el nombre de la empresa.
- **12 ofertas por página**, primero las abiertas y después por fecha de publicación.
- **Fecha límite**: al crear no puede ser anterior a hoy; al editar, no anterior a la fecha de publicación.
- **Salario**: obligatorio solo si la oferta es remunerada; si no lo es, se guarda vacío.
- **Ofertas de empresas desactivadas** no aparecen en búsquedas ni fichas públicas.
- **El detalle de la oferta todavía no tiene los botones de inscribirse y favoritos** (llegan en la Fase 5) ni las fases del proceso (Fase 6), para no mostrar botones sin funcionalidad.
- **El listado de empresas** es de momento una cuadrícula con filtro por nombre y localidad; el mapa se añade en la Fase 6.
- **El estado de la conexión** en la portada solo se muestra en modo desarrollo.

Decisiones de la Fase 5:

- **Solo se puede inscribir en ofertas abiertas** (activas y en plazo). La restricción única de la base de datos impide duplicados incluso con dos peticiones simultáneas.
- **Antes de inscribirse** se pide confirmación y, si el alumno no tiene currículum, se le avisa (puede inscribirse igualmente).
- **El alumno no puede retirar una candidatura**: el documento no lo contempla. Se puede añadir si se quiere.
- **La empresa puede poner cualquier estado** en cualquier orden (por ejemplo, volver de RECHAZADA a REVISADA si se equivocó). El alumno ve el cambio al momento en «Mis candidaturas».
- **Coincidencia de tecnologías**: en la lista de candidatos se indica cuántas de las tecnologías obligatorias de la oferta conoce cada alumno (por ejemplo, «2 de 3»).
- **La fase actual del proceso** se muestra al alumno cuando existe; su gestión llega en la Fase 6.
- **Favoritos**: guardar una oferta que ya estaba guardada no da error ni la duplica.
- **Tras iniciar sesión** se vuelve a la página desde la que se pidió (por ejemplo, la oferta en la que se quería inscribir).

Decisiones de la Fase 6 (primera parte: fases y mapa):

- **Las fases se guardan todas a la vez** desde un editor (subir, bajar, añadir, quitar), en una transacción. Las fases existentes conservan su identificador al reordenarlas, así no se pierde la fase actual de los candidatos.
- **Duración estimada**: mínimo = suma de las fases obligatorias; máximo = suma de todas.
- **Plantilla de fases habituales** (las cinco del documento) para empezar rápido en ofertas sin proceso.
- **Tras publicar una oferta** se lleva a la empresa a definir su proceso de selección.
- **Fase actual del candidato**: la empresa la elige en la lista de candidatos; el alumno la ve marcada como «Estás aquí» en el proceso.
- **Mapa**: marcadores propios (sin imágenes externas), encuadre automático según el filtro de localidad, y lista y mapa sincronizados («Ver en el mapa»). Rueda del ratón desactivada para que no se haga zoom sin querer al desplazarse por la página.
- **Leaflet se carga bajo demanda** (solo en las páginas con mapa) para no hacer más pesada el resto de la web.

Decisiones de la Fase 6 (segunda parte: portfolio y valoraciones):

- **Imágenes del portfolio públicas**: el portfolio es público, así que sus imágenes también. Se comprueba la firma real del archivo (JPG, PNG o WebP), no solo el tipo que declara el navegador.
- **Proyectos sin imagen** muestran una portada generada con el título.
- **Fecha de creación del proyecto**: por defecto hoy; no puede ser futura. Hasta 10 tecnologías por proyecto.
- **Valoraciones**: puntuación entera de 1 a 5 y comentario de 10 a 1000 caracteres. Quedan **pendientes** hasta que un administrador las apruebe (la moderación llega en la Fase 7); mientras tanto, el alumno ve el estado de la suya.
- **En público** se muestra el nombre del alumno con la inicial del apellido (por ejemplo, «Marta G.») y su ciclo, para proteger sus datos personales.
- **Valorar** se puede hacer desde la ficha de la empresa o desde «Mis candidaturas», en las candidaturas aceptadas.
- **La empresa ve sus valoraciones publicadas** en su panel; no puede responderlas ni ocultarlas (no está en el documento).

Decisiones de la Fase 7 (administración):

- **Desactivar en lugar de borrar cuentas**: una cuenta desactivada no puede iniciar sesión, pierde el acceso al momento aunque tenga la sesión abierta y su perfil y sus ofertas dejan de ser públicos. Se puede reactivar. No se borran cuentas para no perder el historial (candidaturas, valoraciones).
- **El administrador no puede desactivarse a sí mismo** ni gestionar otras cuentas de administrador desde el panel.
- **Verificación reversible**: se puede quitar la verificación a una empresa.
- **Ofertas inapropiadas**: el administrador puede desactivarlas (para revisarlas) o eliminarlas (con confirmación y aviso de las candidaturas que se perderán).
- **Moderación**: aprobar, rechazar, devolver a pendientes o eliminar. Si se elimina una valoración, el alumno puede volver a valorar la empresa. Las pendientes se muestran de la más antigua a la más reciente.
- **El dashboard** muestra avisos con enlace directo cuando hay empresas por verificar o valoraciones por moderar.
- **Listados sin paginación** en el panel de administración (el volumen de datos de un centro o una comunidad es pequeño); se puede añadir en la Fase 8 si hace falta.

Decisiones de la Fase 8 (pruebas y mejoras):

- **Pruebas con `node --test`**: el corredor de pruebas de Node, sin añadir dependencias. Usan una base de datos (`practifp_test`) y una carpeta de archivos separadas.
- **Cabeceras de seguridad propias** en lugar de una librería como Helmet, para no añadir dependencias; la política de contenidos solo permite lo que usa la aplicación (Google Fonts y las teselas de OpenStreetMap).
- **El backend sirve el frontend compilado** en producción (`SERVIR_FRONTEND=true`): un solo proceso, sin problemas de CORS.
- **Colores de estado más oscuros** en modo claro para cumplir el contraste mínimo de WCAG AA.
- **El botón del currículum** pasa a la celda del alumno en la lista de candidatos, para que la tabla quepa sin desplazamiento horizontal.

Decisiones del despliegue:

- **Dos formas gratuitas de desplegar**: servidor con Docker (MariaDB, archivos en disco, HTTPS con Caddy; `docs/despliegue.md`) o Vercel + TiDB Cloud (sin tarjeta; `docs/despliegue-vercel.md`).
- **Almacén de archivos configurable** (`ALMACEN_ARCHIVOS=disco|bd`): Vercel no tiene disco permanente, así que en ese modo los currículums y las imágenes se guardan en la tabla `ARCHIVOS`. Las subidas se procesan en memoria y solo se guardan después de validarlas.
- **Currículum de 4 MB como máximo** (antes 5 MB) en todos los modos, porque Vercel no admite peticiones de más de 4,5 MB.
- **`bcryptjs` en lugar de `bcrypt`**: mismo algoritmo y hashes compatibles, pero sin código nativo, que da problemas al empaquetar la función de Vercel.
- **TiDB Cloud** como base de datos gratuita compatible con MySQL (el plan gratuito de MySQL de otros proveedores ya no existe). Las pruebas automáticas pasan tanto en MariaDB como en TiDB. TiDB no aplica las restricciones `CHECK` salvo que se activen; el script de instalación intenta activarlas y, en cualquier caso, la aplicación valida esos datos.
