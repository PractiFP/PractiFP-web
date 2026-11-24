# PractiFP

Plataforma web que conecta a estudiantes de Formación Profesional (DAM, DAW, ASIR y otros ciclos) con empresas que ofrecen prácticas.

- **Frontend:** React 18 + Vite (`frontend/`)
- **Backend:** Node.js + Express, API REST (`backend/`)
- **Base de datos:** MariaDB (`database/`)

> **Web publicada**: <https://practifp.vercel.app> (Vercel + TiDB Cloud, con datos de prueba; contraseña de las cuentas de prueba: `practifp123`).
>
> Estado actual: **las 8 fases están completadas**, además de recuperación de contraseña por correo, adaptación al RGPD (política de privacidad, descarga y borrado de los datos propios) y pruebas automáticas en GitHub. Incluye 94 pruebas automáticas de la API (`npm test`), revisión de seguridad y de accesibilidad, y modo de producción.

---

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | 20 o superior (probado con 22) |
| npm | 10 o superior |
| MariaDB | 10.6 o superior (probado con 10.11) |
| Git | cualquiera reciente |

---

## Puesta en marcha

### 1. Crear la base de datos y el usuario de MariaDB

Entra en MariaDB como administrador:

```bash
mariadb -u root -p
```

Crea un usuario para la aplicación (cambia la contraseña):

```sql
CREATE USER 'practifp'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON practifp.* TO 'practifp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> Si el backend se conecta por `127.0.0.1` y MariaDB lo rechaza, crea también el usuario `'practifp'@'127.0.0.1'` con los mismos permisos.

### 2. Configurar y arrancar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` y rellena al menos `DB_PASSWORD` (la contraseña del paso 1) y `JWT_SECRET`. Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Crea las tablas y carga los datos de prueba (**borra la base de datos `practifp` si ya existía**):

```bash
npm run db:reset
```

Arranca la API en modo desarrollo (se reinicia sola al guardar cambios):

```bash
npm run dev
```

Deberías ver `Conectado a MariaDB ...`. Comprueba en el navegador: <http://localhost:3000/api/salud>

## Autenticación y roles

- Las contraseñas se guardan con **bcrypt**; nunca en texto plano.
- Al iniciar sesión, el backend devuelve un **JWT** (válido 8 horas por defecto) que el frontend guarda en `localStorage` y envía en cada petición.
- En cada petición privada el backend comprueba el token **y** consulta la base de datos, de modo que una cuenta desactivada pierde el acceso al momento.
- `requireRole('ALUMNO' | 'EMPRESA' | 'ADMIN')` protege cada ruta de la API; en el frontend, `RutaProtegida` hace lo mismo con las páginas.
- El registro crea el usuario y su perfil (alumno o empresa) en una **transacción**.
- Los administradores no se pueden registrar desde la web: se crean en la base de datos.
- **Recuperar la contraseña**: «¿Has olvidado tu contraseña?» envía por correo un enlace que caduca en 1 hora y solo se puede usar una vez (en la base de datos solo se guarda su hash). La respuesta es la misma exista o no la cuenta, y se envía como mucho un correo cada 2 minutos por cuenta. Sin servidor de correo configurado, en desarrollo el enlace se muestra en la consola del backend; en producción la opción avisa de que no está disponible.
- **Cambiar la contraseña cierra las demás sesiones**: los tokens emitidos antes dejan de valer (columna `sesiones_desde`).

## Privacidad (RGPD)

- Página **Política de privacidad** (`/privacidad`), enlazada en el pie de todas las páginas. Los datos del responsable se rellenan en `frontend/src/config/legal.js`.
- Al registrarse hay que **aceptar la política de privacidad** con una casilla; se guarda la fecha (`privacidad_aceptada`).
- En **Configuración**, cada usuario puede **descargar todos sus datos** (archivo JSON) y **eliminar su cuenta** con todos sus datos y archivos, confirmando con su contraseña.
- Las fuentes tipográficas se sirven desde la propia web (sin Google Fonts) y no se usan cookies ni analítica.

## Archivos subidos

- Los currículums se guardan en `backend/uploads/cv` con un nombre aleatorio; **no se publican** como archivos estáticos.
- Solo se aceptan PDF de hasta 4 MB. Además del tipo declarado, el backend comprueba que el archivo empieza por `%PDF-`.
- Se sirven únicamente por `GET /api/alumnos/:id/cv` tras comprobar el permiso. Al reemplazar o eliminar un currículum se borra el archivo anterior.
- Con `ALMACEN_ARCHIVOS=bd` (por ejemplo, en Vercel, que no tiene disco permanente) los currículums y las imágenes se guardan en la tabla `ARCHIVOS` de la base de datos en lugar de en carpetas.
- Las imágenes del portfolio se guardan en `backend/uploads/proyectos` (JPG, PNG o WebP de hasta 2 MB, comprobando la firma del archivo). Son públicas a través de `GET /api/proyectos/:id/imagen`. Al reemplazarlas, quitarlas o borrar el proyecto se elimina el archivo.

## Mapa

El mapa de empresas usa **Leaflet** con las teselas de **OpenStreetMap** (`tile.openstreetmap.org`), por lo que necesita conexión a Internet. Leaflet se descarga solo en las páginas que muestran un mapa. Las empresas sin coordenadas no aparecen en el mapa (se avisa debajo).

### 3. Configurar y arrancar el frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre <http://localhost:5173>. La tarjeta **Estado del sistema** debe mostrar la API y la base de datos como **Conectada**, con el número de registros de prueba.

### Alternativa: cargar la base de datos a mano

```bash
mariadb -u root -p < database/schema.sql
mariadb -u root -p practifp < database/seed.sql
```

---

## Datos de prueba

Todas las cuentas usan la contraseña **`practifp123`**. En desarrollo, la página de inicio de sesión muestra botones para rellenar las cuentas principales.

| Rol | Email |
|---|---|
| Administrador | `admin@practifp.es` |
| Alumna (DAM, Madrid) | `lucia.martin@correo.example` |
| Alumno (DAW, Sevilla) | `carlos.ruiz@correo.example` |
| Empresa verificada | `rrhh@nubalia.example` |
| Empresa sin verificar | `empleo@cantabricodata.example` |
| Cuenta desactivada | `pablo.sanz@correo.example` |

Incluye 4 ciclos, 20 tecnologías, currículums de ejemplo para 4 alumnos (`npm run db:reset` los copia a `backend/uploads/cv`), 6 alumnos, 8 empresas con coordenadas reales, 12 ofertas (10 activas), procesos de selección, candidaturas en todos los estados, favoritos, proyectos y valoraciones (una pendiente de moderar).

---

## Variables de entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `DB_HOST` / `DB_PORT` | Servidor de MariaDB | `127.0.0.1` / `3306` |
| `DB_USER` / `DB_PASSWORD` | Usuario de la aplicación | `practifp` / … |
| `DB_NAME` | Nombre de la base de datos | `practifp` |
| `DB_CONNECTION_LIMIT` | Conexiones máximas del pool | `10` |
| `JWT_SECRET` | Secreto para firmar los tokens (obligatorio, mínimo 32 caracteres) | cadena aleatoria larga |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `SMTP_HOST` / `SMTP_PORT` | Servidor de correo para la recuperación de contraseña (opcional en desarrollo) | `smtp-relay.brevo.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | Usuario y clave del servidor de correo | … |
| `SMTP_FROM` | Remitente de los correos | `PractiFP <no-responder@tu-dominio.es>` |

### `frontend/.env`

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API usada por el navegador | `/api` |
| `VITE_BACKEND_URL` | Destino del proxy de Vite en desarrollo | `http://localhost:3000` |

---

## Estructura del proyecto

```
PractiFP/
├── frontend/
│   ├── public/              favicon
│   └── src/
│       ├── components/      Header, Footer, Logo, Boton, Icono, Campo, Avatar, Cifra, BarrasEstado, Modal,
│       │                    TarjetaOferta, LogoEmpresa, PlazoOferta, Paginacion, BotonFavorito,
│       │                    PanelInscripcion, EstadoCandidatura, ProgresoCandidatura, ProcesoSeleccion,
│       │                    TarjetaProyecto, ModalProyecto, Estrellas, SelectorEstrellas, ModalValorar,
│       │                    SeccionValoraciones,
│       │                    mapa/ (MapaEmpresas, MapaUbicacion con Leaflet, cargados bajo demanda),
│       │                    ModalConfirmar, BotonVerCv, NivelTecnologia, InsigniaVerificada, BotonVolver,
│       │                    Cargando, MensajeError, EstadoConexion, RutaProtegida, SoloInvitados
│       ├── pages/           Inicio, BuscarOfertas, DetalleOferta, Empresas, DetalleEmpresa, PerfilAlumno,
│       │                    Login, Registro, SinAcceso, NoEncontrada
│       │   └── panel/       Dashboards de cada rol, Configuracion, IrAlPanel
│       │       ├── alumno/  MiPerfil (datos y currículum), MiPortfolio, MisTecnologias, MisCandidaturas, MisFavoritos
│       │       ├── admin/   GestionUsuarios, GestionEmpresas, VerificacionEmpresas, GestionOfertas,
│       │       │            ModeracionValoraciones
│       │       └── empresa/ PerfilEmpresa, MisOfertas, FormularioOferta (crear y editar), Candidatos,
│       │                    ProcesosSeleccion, ValoracionesRecibidas
│       ├── layouts/         PublicLayout, PanelLayout (menú lateral según el rol)
│       ├── services/        api.js (cliente HTTP común) y un servicio por recurso
│       ├── hooks/           usePeticion (carga con estados de carga y error), useListaEditable, useDiferido, useTitulo
│       ├── context/         AuthContext (sesión), ToastContext (avisos)
│       ├── utils/           validadores.js, rutas.js, formato.js
│       ├── assets/
│       └── styles/          variables.css (paleta y modo oscuro), global.css, componentes.css
├── backend/
│   ├── server.js            arranque del servidor
│   ├── scripts/             db-reset.js y reiniciarBaseDatos.js (recrean la base de datos con schema.sql + seed.sql)
│   ├── tests/               pruebas automáticas de la API (node --test)
│   ├── uploads/             archivos subidos (privados, fuera de Git)
│   └── src/
│       ├── app.js           configuración de Express
│       ├── config/          env.js (variables), db.js (pool de MariaDB, query, transaction)
│       ├── config/          archivos.js (carpetas de subida y límites)
│       ├── routes/          index, salud, auth, ciclos, tecnologias, panel, alumnos, empresas, ofertas,
│       │                    candidaturas, proyectos, admin, cuenta
│       ├── controllers/     uno por grupo de rutas
│       ├── middlewares/     auth (requireAuth, requireRole, optionalAuth), subirCv y subirImagen (Multer), validarId,
│       │                    seguridad (cabeceras HTTP),
│       │                    limitarIntentos, notFound, errorHandler
│       ├── models/          usuario, alumno, empresa, oferta, fase, candidatura, favorito, proyecto, valoracion, admin,
│       │                    ciclo, tecnologia, panel
│       ├── services/        auth, alumno (perfil, CV, tecnologías), empresa, oferta, fase, candidatura, favorito,
│       │                    proyecto, valoracion, admin, cuenta
│       └── utils/           HttpError, asyncHandler, validadores
├── database/
│   ├── schema.sql           13 tablas del documento + CICLOS
│   ├── seed.sql             datos de prueba
│   └── archivos/            cv_ejemplo.pdf (currículum de los alumnos de prueba)
└── docs/
    ├── modelo-er.md         diagrama entidad-relación (Mermaid)
    ├── modelo-relacional.md tablas, claves y restricciones
    ├── decisiones.md        decisiones de diseño tomadas
    └── prototipo.html       prototipo visual navegable de todas las pantallas
```

## Pruebas automáticas

Las pruebas de la API usan el corredor de pruebas que trae Node (`node --test`), sin librerías adicionales. Cubren autenticación y permisos por rol, perfiles y currículum, ofertas y filtros, candidaturas y favoritos, fases de selección, portfolio, valoraciones, administración y seguridad (cabeceras, tokens manipulados, inyección SQL, tamaño de las peticiones y datos personales en las respuestas).

Se ejecutan sobre una base de datos aparte (`practifp_test`) y una carpeta temporal para los archivos, así que **no tocan los datos de desarrollo**. La primera vez, da permisos al usuario de la aplicación sobre esa base de datos:

```sql
GRANT ALL PRIVILEGES ON practifp_test.* TO 'practifp'@'localhost';
FLUSH PRIVILEGES;
```

Después:

```bash
cd backend
npm test
```

Además, **GitHub ejecuta las pruebas automáticamente** en cada `push` y en cada pull request (`.github/workflows/pruebas.yml`): las de la API con MariaDB, guardando los archivos en disco y en la base de datos, la compilación de la web y la revisión de vulnerabilidades de las dependencias. El resultado aparece en la pestaña **Actions** del repositorio y junto a cada commit.

## Seguridad

- Contraseñas con **bcrypt**; tokens **JWT** firmados con HS256 (se rechazan tokens sin firma o con otro algoritmo).
- En cada petición privada se comprueba el token **y** el usuario en la base de datos (una cuenta desactivada pierde el acceso al momento).
- Permisos por rol en cada ruta (`requireRole`) y comprobación de propiedad en ofertas, candidaturas, fases y proyectos.
- **Consultas SQL parametrizadas** en toda la aplicación.
- Validación de datos en el frontend y, de nuevo, en el backend, con errores por campo.
- Límite de intentos fallidos en el inicio de sesión, el registro, la recuperación y los cambios de correo o contraseña. El contador se guarda en la base de datos (tabla `INTENTOS`, sin guardar direcciones IP), así que funciona aunque haya varias copias del servidor, como en Vercel.
- Archivos subidos: tipo, tamaño y firma del archivo comprobados; nombres aleatorios; currículums solo accesibles con permiso.
- Cabeceras HTTP de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` y, en producción, `Strict-Transport-Security`).
- Cuerpos JSON limitados a 100 KB; los errores internos no muestran detalles en producción.
- Las respuestas públicas no incluyen correos ni datos internos; las valoraciones muestran solo el nombre y la inicial del apellido.

## Accesibilidad

- Revisada con axe-core (reglas WCAG 2 A y AA) en todas las páginas, en modo claro y oscuro, sin incidencias.
- Enlace «Saltar al contenido», título de pestaña propio en cada página, navegación completa con teclado (incluidos los formularios, el selector de estrellas y las ventanas modales, que se cierran con Escape y devuelven el foco).
- Colores con contraste mínimo de 4,5:1 y modo oscuro automático según el sistema.
- Diseño adaptable revisado en todas las páginas desde 360 px de ancho.

## Despliegue en producción

> **Despliegue gratuito en Vercel + TiDB Cloud (sin tarjeta)**: la guía [`docs/despliegue-vercel.md`](docs/despliegue-vercel.md) explica cómo publicar la web y la API en Vercel con la base de datos en TiDB Cloud (compatible con MySQL). Se despliega sola con cada `git push`. Archivos: `vercel.json`, `api/index.js` y `backend/.env.tidb.example`.
>
> **Despliegue gratuito con Docker**: la guía paso a paso [`docs/despliegue.md`](docs/despliegue.md) explica cómo publicar PractiFP sin coste en un servidor de Oracle Cloud «Always Free» con un dominio de DuckDNS y HTTPS automático. Con `docker compose up -d --build` se arrancan MariaDB, la aplicación y Caddy (proxy con HTTPS). Archivos: `Dockerfile`, `docker-compose.yml`, `Caddyfile` y `.env.produccion.example`.

### Despliegue manual (sin Docker)

En producción, el backend sirve también el frontend compilado, así que solo hay que arrancar un proceso.

1. Compila el frontend:

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. Prepara el backend: copia `.env.example` a `.env` y ajusta al menos:

   ```
   NODE_ENV=production
   SERVIR_FRONTEND=true
   JWT_SECRET=<secreto largo y aleatorio>
   DB_PASSWORD=<contraseña de MariaDB>
   FRONTEND_URL=https://tu-dominio.es
   TRUST_PROXY=1          # si hay un proxy inverso (Nginx, Apache) delante
   ```

3. Instala las dependencias, crea la base de datos (solo la primera vez) y arranca:

   ```bash
   cd backend
   npm ci --omit=dev
   npm run db:reset    # solo la primera vez: crea las tablas y los datos de prueba
   npm start
   ```

   Para una instalación real sin datos de prueba, usa `npm run db:esquema` en lugar de `db:reset` y crea tu cuenta con `npm run crear-admin -- correo "contraseña"`.

4. Pon delante un proxy inverso con **HTTPS** (Nginx, Apache o el panel del hosting) que redirija al puerto de `PORT`. Mantén el proceso en marcha con el gestor de servicios del sistema (por ejemplo, systemd).

Haz copias de seguridad de la base de datos y de la carpeta `backend/uploads` (o la indicada en `UPLOADS_DIR`).

## API

Todas las respuestas usan el mismo formato:

- Éxito: `{ "data": ... }`
- Error: `{ "error": { "mensaje": "...", "detalles": ... } }`

Las rutas privadas necesitan la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/salud` | Público | Estado de la API y de la base de datos, con recuento de registros |
| GET | `/api/ciclos` | Público | Catálogo de ciclos formativos |
| POST | `/api/auth/registro` | Público | Crea una cuenta de alumno o empresa y devuelve `{ token, usuario }` |
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve `{ token, usuario }` |
| GET | `/api/auth/yo` | Con sesión | Datos del usuario de la sesión |
| GET | `/api/panel/alumno` | Alumno | Resumen del dashboard del alumno |
| GET | `/api/panel/empresa` | Empresa | Resumen del dashboard de la empresa |
| GET | `/api/panel/admin` | Administrador | Resumen del dashboard de administración |
| GET | `/api/tecnologias` | Público | Catálogo de tecnologías |
| GET / PUT | `/api/alumnos/yo` | Alumno | Ver y editar el propio perfil |
| POST / DELETE | `/api/alumnos/yo/cv` | Alumno | Subir (campo `cv`, PDF ≤ 4 MB) o eliminar el currículum |
| PUT / DELETE | `/api/alumnos/yo/tecnologias/:tecnologiaId` | Alumno | Añadir o cambiar el nivel (`{ nivel }`) / quitar una tecnología |
| GET | `/api/alumnos/:id` | Público | Perfil público (sin correo); indica `puedeVerCv` según quien consulta |
| GET | `/api/alumnos/:id/cv` | Con permiso | Currículum en PDF: el propio alumno, un administrador o una empresa en cuyas ofertas se ha inscrito |
| GET / PUT | `/api/empresas/yo` | Empresa | Ver y editar el perfil de la empresa |
| GET | `/api/empresas` | Público | Listado de empresas (`?q=&localidad=`) con ofertas abiertas y valoración media |
| GET | `/api/empresas/:id` | Público | Ficha pública de la empresa |
| GET | `/api/empresas/yo/ofertas` | Empresa | Todas sus ofertas (también inactivas) con número de candidaturas |
| GET | `/api/ofertas` | Público | Búsqueda: `?q=&ciclo=DAW&localidad=&modalidad=PRESENCIAL\|HIBRIDA\|REMOTA&remunerada=si\|no&empresa=&tecnologias=1,4&abiertas=no&pagina=` |
| GET | `/api/ofertas/opciones` | Público | Localidades con ofertas y empresas, para los filtros |
| GET | `/api/ofertas/:id` | Público | Detalle de una oferta (`esPropia` indica si es de la empresa que consulta) |
| POST | `/api/ofertas` | Empresa | Publicar una oferta con sus tecnologías (`[{ id, obligatoria }]`) |
| PUT | `/api/ofertas/:id` | Empresa propietaria | Editar la oferta |
| PATCH | `/api/ofertas/:id/estado` | Empresa propietaria | Activar o desactivar (`{ activa }`) |
| DELETE | `/api/ofertas/:id` | Empresa propietaria | Eliminar (borra también sus candidaturas, fases y favoritos) |
| POST | `/api/ofertas/:id/candidaturas` | Alumno | Inscribirse (solo ofertas abiertas; una vez por oferta) |
| GET | `/api/alumnos/yo/candidaturas` | Alumno | Sus candidaturas con estado y fase actual del proceso |
| GET | `/api/alumnos/yo/favoritos` | Alumno | Sus ofertas favoritas |
| PUT / DELETE | `/api/alumnos/yo/favoritos/:ofertaId` | Alumno | Guardar / quitar una oferta de favoritos |
| GET | `/api/empresas/yo/candidaturas` | Empresa | Candidatos de sus ofertas (`?oferta=&estado=`) con coincidencia de tecnologías |
| PATCH | `/api/candidaturas/:id/estado` | Empresa propietaria | Cambiar el estado (`ENVIADA`, `REVISADA`, `ENTREVISTA`, `ACEPTADA`, `RECHAZADA`) |
| PATCH | `/api/candidaturas/:id/fase` | Empresa propietaria | Indicar la fase del proceso en la que está el candidato (`{ faseId }` o `null`) |
| GET | `/api/alumnos/yo/proyectos` | Alumno | Sus proyectos del portfolio |
| POST | `/api/alumnos/yo/proyectos` | Alumno | Crear un proyecto (multipart: `titulo`, `descripcion`, `urlGithub`, `urlDemo`, `fechaCreacion`, `tecnologias` en JSON e `imagen` opcional JPG/PNG/WebP ≤ 2 MB) |
| PUT / DELETE | `/api/proyectos/:id` | Alumno propietario | Editar (mismos campos; `quitarImagen=true` elimina la imagen) / eliminar |
| GET | `/api/proyectos/:id/imagen` | Público | Imagen del proyecto |
| GET | `/api/empresas/:id/valoraciones` | Público | Valoraciones aprobadas, media y distribución; para un alumno, también `puedeValorar` y `miValoracion` |
| POST | `/api/empresas/:id/valoraciones` | Alumno con candidatura aceptada | Valorar (`{ puntuacion: 1-5, comentario }`); queda `PENDIENTE` de moderación |
| GET | `/api/empresas/yo/valoraciones` | Empresa | Sus valoraciones publicadas |
| GET | `/api/admin/usuarios` | Administrador | Usuarios (`?q=&rol=&activo=si\|no`) |
| PATCH | `/api/admin/usuarios/:id/activo` | Administrador | Activar o desactivar una cuenta (`{ activo }`); no se aplica a administradores |
| GET | `/api/admin/empresas` | Administrador | Empresas con correo, ofertas y valoración (`?q=&verificada=si\|no`) |
| PATCH | `/api/admin/empresas/:id/verificada` | Administrador | Verificar o quitar la verificación (`{ verificada }`) |
| GET | `/api/admin/ofertas` | Administrador | Todas las ofertas (`?q=&estado=abiertas\|cerradas\|inactivas`) |
| PATCH / DELETE | `/api/admin/ofertas/:id/activa` · `/api/admin/ofertas/:id` | Administrador | Activar o desactivar (`{ activa }`) / eliminar |
| GET | `/api/admin/valoraciones` | Administrador | Valoraciones por estado (`?estado=PENDIENTE\|APROBADA\|RECHAZADA`) con totales |
| PATCH / DELETE | `/api/admin/valoraciones/:id` | Administrador | Moderar (`{ estado }`) / eliminar |
| PUT | `/api/ofertas/:id/fases` | Empresa propietaria | Guardar las fases del proceso en orden (`{ fases: [{ id?, nombre, descripcion, duracionDias, obligatoria }] }`) |

Cuando un alumno consulta `/api/ofertas` o `/api/ofertas/:id`, cada oferta incluye además `esFavorita` y `miEstado` (estado de su candidatura); el detalle incluye `miCandidatura`. El detalle de una oferta incluye siempre sus `fases` y `resumenFases` (número de fases y duración mínima y máxima en días).
| PUT | `/api/cuenta/email` | Con sesión | Cambiar el correo (`{ email, password }`) |
| PUT | `/api/cuenta/password` | Con sesión | Cambiar la contraseña (`{ actual, nueva }`); devuelve un `token` nuevo y cierra las demás sesiones |
| GET | `/api/cuenta/datos` | Con sesión | Todos los datos de la cuenta (descarga JSON) |
| DELETE | `/api/cuenta` | Con sesión | Eliminar la cuenta y todos sus datos (`{ password }`) |
| POST | `/api/auth/recuperar` | Público | Enviar el enlace para cambiar la contraseña (`{ email }`) |
| POST | `/api/auth/restablecer` | Público | Cambiar la contraseña con el código del enlace (`{ token, password }`) |

Códigos de error habituales: `400` datos no válidos (con `detalles` por campo), `401` sin sesión o token no válido, `403` sin permiso o cuenta desactivada, `409` correo ya registrado, `429` demasiados intentos (10 fallos en 15 minutos en login o registro; 5 peticiones de recuperación en 15 minutos), `503` recuperación por correo no configurada.

---

## Plan de desarrollo

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Estructura, MariaDB, conexión frontend-backend-BD | ✔ Completada |
| 2 | Registro, login con JWT, roles, rutas protegidas | ✔ Completada |
| 3 | Perfiles de alumno y empresa, subida de currículum | ✔ Completada |
| 4 | Ofertas: crear, editar, eliminar, buscar y filtrar | ✔ Completada |
| 5 | Candidaturas y favoritos | ✔ Completada |
| 6 | Mapa (Leaflet + OpenStreetMap), portfolio, valoraciones, fases de selección | ✔ Completada |
| 7 | Panel de administración | ✔ Completada |
| 8 | Pruebas, seguridad, responsive y corrección de errores | ✔ Completada |

El prototipo visual navegable con el diseño de todas las pantallas está en `docs/prototipo.html` (ábrelo con el navegador).

## Scripts

| Carpeta | Comando | Qué hace |
|---|---|---|
| backend | `npm run dev` | API con recarga automática (nodemon) |
| backend | `npm start` | API en modo normal |
| backend | `npm run db:reset` | Recrea la base de datos y carga los datos de prueba |
| backend | `npm test` | Ejecuta las pruebas automáticas de la API (sobre la base de datos `practifp_test`) |
| backend | `npm run db:esquema` | Crea solo las tablas y los catálogos, sin datos de prueba (instalación real) |
| backend | `npm run crear-admin -- correo "contraseña"` | Crea una cuenta de administrador |
| frontend | `npm run dev` | Servidor de desarrollo de Vite |
| frontend | `npm run build` | Compila el frontend para producción en `dist/` |
| frontend | `npm run preview` | Sirve la compilación de producción |
