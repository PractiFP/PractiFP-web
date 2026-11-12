# Desplegar PractiFP en Vercel (gratis y sin tarjeta)

Guía para publicar PractiFP con:

- **Vercel** (plan *Hobby*, gratuito y sin tarjeta): aloja la web y ejecuta la API Express como una función *serverless*. Se vuelve a desplegar sola cada vez que subes cambios a GitHub.
- **TiDB Cloud** (plan *Starter*, gratuito y sin tarjeta): base de datos **compatible con MySQL/MariaDB**, con 25 GiB gratis.

Tiempo aproximado: 30 minutos.

## Diferencias con el despliegue en un servidor

| | Vercel + TiDB Cloud | Servidor con Docker (`docs/despliegue.md`) |
|---|---|---|
| Coste | Gratis, sin tarjeta | Gratis (Oracle pide tarjeta para verificar) |
| Base de datos | TiDB (compatible con MySQL) | MariaDB |
| Currículums e imágenes | Se guardan **dentro de la base de datos** (Vercel no tiene disco permanente) | En una carpeta del servidor |
| Tamaño máximo del currículum | 4 MB (límite de Vercel: 4,5 MB por petición) | 4 MB |
| Arranque | La primera petición tras un rato sin visitas tarda 1–2 segundos más | Siempre activo |
| Uso | Proyectos personales y demos (el plan Hobby no es para uso comercial) | Cualquiera |

La aplicación es la misma: el modo se elige con variables de entorno (`ALMACEN_ARCHIVOS=bd`, `DB_SSL=true`).

---

## 1. Crear la base de datos en TiDB Cloud

1. Entra en <https://tidbcloud.com> y regístrate (puedes usar tu cuenta de GitHub o de Google).
2. Crea un clúster **Starter** (gratuito). Elige una región cercana, por ejemplo **Frankfurt (eu-central-1)**.
3. Cuando esté listo, pulsa **Connect**:
   - En *Connect With* elige **General**.
   - Pulsa **Generate Password** y **guarda la contraseña** (solo se muestra una vez).
   - Apunta **HOST**, **PORT** (4000) y **USERNAME** (tiene la forma `XXXXXXXX.root`).

## 2. Crear las tablas desde tu ordenador

Necesitas el proyecto descargado y Node.js instalado (lo mismo que para trabajar en local).

```bash
cd backend
npm install
cp .env.tidb.example .env.tidb
```

Edita `backend/.env.tidb` con los datos del paso anterior (`DB_HOST`, `DB_USER`, `DB_PASSWORD`). Deja `DB_SSL=true` y `ALMACEN_ARCHIVOS=bd`. Este archivo **no se sube a GitHub**.

Después elige **una** opción:

**Demo con datos de prueba** (contraseña de todas las cuentas: `practifp123`):

```bash
# Linux / macOS
DOTENV_CONFIG_PATH=.env.tidb npm run db:reset
```

```powershell
# Windows (PowerShell)
$env:DOTENV_CONFIG_PATH=".env.tidb"; npm run db:reset
```

**Instalación real** (solo tablas y catálogos) y tu cuenta de administrador:

```bash
DOTENV_CONFIG_PATH=.env.tidb npm run db:esquema
DOTENV_CONFIG_PATH=.env.tidb npm run crear-admin -- tu-correo@ejemplo.es "una contraseña de al menos 12 caracteres"
```

(En PowerShell, ejecuta primero `$env:DOTENV_CONFIG_PATH=".env.tidb"` y luego los comandos `npm run …`.)

> Si aparece el aviso «no se han podido activar las restricciones CHECK en TiDB», no pasa nada: la aplicación valida igualmente todos los datos (plazas, salario, puntuaciones, coordenadas…).

### Alternativa: instalar desde la web (sin ejecutar nada en tu ordenador)

Si añades en Vercel la variable `INSTALACION_TOKEN` (un valor aleatorio de al menos 32 caracteres), la API ofrece `POST /api/instalacion`, que crea las tablas en la base de datos **vacía**. Se llama enviando el token en la cabecera `X-Token-Instalacion` y el cuerpo JSON `{"datosDePrueba": true}` (o `false` para una instalación sin datos de prueba).

Por seguridad solo funciona con el token correcto y si la base de datos todavía no tiene tablas (nunca borra datos), y tiene límite de intentos. **Cuando termines, borra la variable `INSTALACION_TOKEN`** en Vercel y vuelve a desplegar.

## 3. Desplegar en Vercel

1. Entra en <https://vercel.com/signup> y regístrate **con tu cuenta de GitHub** (plan *Hobby*).
2. Pulsa **Add New… → Project** y, en *Import Git Repository*, da acceso a Vercel al repositorio **PractiFP** (si es privado, pulsa *Adjust GitHub App Permissions* y selecciónalo).
3. Pulsa **Import**. En la configuración:
   - **Framework Preset**: *Other*.
   - **Root Directory**: déjalo vacío (la raíz del repositorio). El archivo `vercel.json` ya indica cómo instalar, compilar y dónde está la API.
4. Despliega **Environment Variables** y añade:

   | Nombre | Valor |
   |---|---|
   | `DB_HOST` | el HOST de TiDB |
   | `DB_PORT` | `4000` |
   | `DB_USER` | el USERNAME de TiDB (`XXXXXXXX.root`) |
   | `DB_PASSWORD` | la contraseña de TiDB |
   | `DB_NAME` | `practifp` |
   | `DB_SSL` | `true` |
   | `DB_CONNECTION_LIMIT` | `2` |
   | `ALMACEN_ARCHIVOS` | `bd` |
   | `JWT_SECRET` | un valor largo y aleatorio (genera uno con `openssl rand -hex 32` o en <https://generate-secret.vercel.app/64>) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |

5. Pulsa **Deploy**. En uno o dos minutos tendrás la web en una dirección como `https://practifp-xxxx.vercel.app`.
6. Comprueba que funciona abriendo `https://TU-DIRECCION.vercel.app/api/salud`: debe indicar `"conectada": true`.

Desde ese momento, **cada `git push` a `main` vuelve a desplegar la web automáticamente**.

### Cambiar la dirección (opcional)

En el proyecto de Vercel: **Settings → Domains**. Puedes cambiar el nombre gratuito `*.vercel.app` (por ejemplo, `practifp.vercel.app` si está libre) o añadir un dominio propio. Después, añade la variable `FRONTEND_URL` con la dirección final y vuelve a desplegar (**Deployments → ⋯ → Redeploy**).

---

## Problemas habituales

- **`/api/salud` da error 503**: revisa las variables `DB_*` en Vercel (**Settings → Environment Variables**) y vuelve a desplegar. En TiDB Cloud, comprueba en **Networking** que el acceso público está permitido.
- **La función falla al arrancar con «Faltan variables de entorno»**: falta alguna variable (sobre todo `JWT_SECRET`, que debe tener al menos 32 caracteres).
- **«El archivo supera los 4 MB»**: es el límite de Vercel para cada petición; reduce el PDF.
- **Ver los registros**: en Vercel, **Deployments → (el último) → Functions / Logs**.

## Copias de seguridad

Desde la consola de TiDB Cloud puedes exportar los datos (**Import/Export**). También puedes hacer una copia desde tu ordenador con el cliente de MariaDB o MySQL:

```bash
mariadb-dump -h TU_HOST -P 4000 -u "XXXXXXXX.root" -p --ssl practifp > copia.sql
```

La copia incluye también los currículums y las imágenes, porque en este modo se guardan en la tabla `ARCHIVOS`.
