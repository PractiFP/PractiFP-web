# Desplegar PractiFP gratis

Guía para publicar PractiFP en Internet **sin coste**, con:

- **Oracle Cloud «Always Free»**: un servidor gratuito para siempre, con disco permanente (los currículums y las imágenes no se pierden).
- **DuckDNS**: un dominio gratuito, por ejemplo `practifp.duckdns.org`.
- **Docker Compose**: arranca con un solo comando la base de datos MariaDB, la aplicación y **Caddy**, que obtiene y renueva solo el certificado **HTTPS** (Let's Encrypt).

Tiempo aproximado: 45 minutos la primera vez.

> **Sobre el coste**: Oracle pide una tarjeta al registrarse **solo para verificar tu identidad**. Mientras uses recursos marcados como «Always Free» no se cobra nada. No cambies la cuenta a «Pay As You Go» si no quieres pagar.

---

## 1. Crear la cuenta de Oracle Cloud

1. Entra en <https://www.oracle.com/es/cloud/free/> y pulsa **Empieza gratis**.
2. Rellena tus datos. Al elegir la **región principal** (home region), elige una cercana (por ejemplo, *Spain Central (Madrid)* o *Germany Central (Frankfurt)*). **No se puede cambiar después.**
3. Verifica la tarjeta (se hace una retención temporal de 1 € o similar que se devuelve).

## 2. Crear el servidor

1. En el panel de Oracle: **Menú ☰ → Compute → Instances → Create instance**.
2. **Name**: `practifp`.
3. **Image and shape → Edit**:
   - **Image**: *Canonical Ubuntu 24.04*.
   - **Shape**: *Ampere* → `VM.Standard.A1.Flex` con **2 OCPU y 12 GB de memoria** (dentro del límite gratuito de 4 OCPU y 24 GB).
   - Si aparece «Out of capacity», prueba otro *Availability domain* o vuelve a intentarlo más tarde (a veces hay que insistir). Como alternativa, el shape `VM.Standard.E2.1.Micro` también es gratuito, pero solo tiene 1 GB de memoria (ver el apartado de memoria al final).
4. **Add SSH keys**: elige **Generate a key pair for me** y pulsa **Download private key**. Guarda el archivo (`ssh-key-….key`): sin él no podrás entrar al servidor.
5. Pulsa **Create**. Cuando el estado sea *Running*, apunta la **Public IP address**.

## 3. Abrir los puertos 80 y 443

Oracle bloquea el tráfico web por defecto en **dos sitios**.

**a) En la red de Oracle**

1. En la página de la instancia, pulsa el enlace de la **Subnet** → **Security Lists** → *Default Security List*.
2. **Add Ingress Rules**, dos veces:
   - Source CIDR `0.0.0.0/0`, IP Protocol `TCP`, Destination Port Range `80`.
   - Source CIDR `0.0.0.0/0`, IP Protocol `TCP`, Destination Port Range `443`.

**b) En el cortafuegos del propio servidor** (se hace en el paso 5, tras conectarte).

## 4. Conseguir un dominio gratuito en DuckDNS

1. Entra en <https://www.duckdns.org> e inicia sesión (por ejemplo, con tu cuenta de GitHub).
2. Escribe un subdominio (por ejemplo, `practifp`) y pulsa **add domain**.
3. En el campo **current ip**, escribe la IP pública de tu servidor y pulsa **update ip**.

Tu web estará en `https://practifp.duckdns.org` (o el nombre que hayas elegido).

## 5. Preparar el servidor

Conéctate desde tu ordenador (en Windows, usa PowerShell; en Linux o macOS, la Terminal):

```bash
chmod 600 ruta/a/ssh-key.key        # solo Linux/macOS
ssh -i ruta/a/ssh-key.key ubuntu@IP_DEL_SERVIDOR
```

Ya dentro del servidor, abre los puertos en su cortafuegos:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Instala Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

Vuelve a conectarte con el mismo comando `ssh` (para que se aplique el permiso de Docker) y comprueba:

```bash
docker compose version
```

## 6. Descargar PractiFP

El repositorio es privado, así que necesitas un **token de GitHub de solo lectura**:

1. En GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access**: *Only select repositories* → `PractiFP-web`. **Permissions → Contents**: *Read-only*. Genera el token y cópialo.
3. En el servidor:

```bash
git clone https://TU_TOKEN@github.com/PractiFP/PractiFP-web.git
cd PractiFP-web
```

(Si haces el repositorio público, basta con `git clone https://github.com/PractiFP/PractiFP-web.git`).

## 7. Configurar

```bash
cp .env.produccion.example .env
nano .env
```

Rellena:

- `DOMINIO`: tu dominio, por ejemplo `practifp.duckdns.org`.
- `DB_ROOT_PASSWORD`, `DB_PASSWORD` y `JWT_SECRET`: valores largos y aleatorios. Genera cada uno con:

  ```bash
  openssl rand -hex 32
  ```

- Opcional: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` para que funcione «¿Has olvidado tu contraseña?» (por ejemplo, con Brevo, gratis: ver `docs/despliegue-vercel.md`, apartado «Correo para recuperar la contraseña»).

Guarda con `Ctrl+O`, `Enter` y sal con `Ctrl+X`.

## 8. Arrancar

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos (descarga las imágenes y compila la web). Comprueba que los tres servicios están en marcha:

```bash
docker compose ps
```

## 9. Crear la base de datos

Elige **una** de las dos opciones:

**Demo con datos de prueba** (alumnos, empresas y ofertas de ejemplo; contraseña de todas las cuentas: `practifp123`):

```bash
docker compose exec app npm run db:reset
```

**Instalación real** (solo las tablas y los catálogos de ciclos y tecnologías) y creación de tu cuenta de administrador:

```bash
docker compose exec app npm run db:esquema
docker compose exec app npm run crear-admin -- tu-correo@ejemplo.es "una contraseña de al menos 12 caracteres"
```

> **Atención**: los dos primeros comandos **borran** la base de datos si ya existía. Úsalos solo la primera vez.

Abre `https://TU_DOMINIO` en el navegador. La primera visita puede tardar unos segundos mientras Caddy obtiene el certificado HTTPS.

---

## Mantenimiento

**Ver los registros** (útil si algo falla):

```bash
docker compose logs -f app
docker compose logs caddy
```

**Actualizar** a la última versión del código:

```bash
cd ~/PractiFP-web
git pull
docker compose up -d --build
```

Si la versión nueva añade tablas o columnas, la aplicación las crea sola al arrancar (solo añade, nunca borra datos).

**Copias de seguridad** (base de datos y archivos subidos):

```bash
cd ~/PractiFP-web
docker compose exec db sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" practifp' > copia-$(date +%F).sql
docker run --rm -v practifp_archivos:/datos -v "$PWD":/copia alpine tar czf /copia/archivos-$(date +%F).tgz -C /datos .
```

Descárgalas a tu ordenador con `scp -i ruta/a/ssh-key.key ubuntu@IP:~/PractiFP-web/copia-*.sql .`.

**Restaurar** una copia de la base de datos:

```bash
docker compose exec -T db sh -c 'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" practifp' < copia-AAAA-MM-DD.sql
```

**Parar y volver a arrancar**:

```bash
docker compose down        # los datos se conservan en volúmenes de Docker
docker compose up -d
```

> No uses `docker compose down -v`: la opción `-v` **borra** los volúmenes con la base de datos y los archivos.

---

## Problemas habituales

- **La web no carga**: comprueba que abriste los puertos 80 y 443 en la *Security List* de Oracle **y** en el servidor (paso 5), y que la IP de DuckDNS es la del servidor.
- **Error de certificado HTTPS**: el dominio debe apuntar ya a la IP del servidor antes de arrancar. Revisa `docker compose logs caddy` y reinicia con `docker compose restart caddy`.
- **La aplicación aparece como `unhealthy`**: es normal hasta que crees la base de datos (paso 9).
- **Poca memoria (shape de 1 GB)**: añade memoria de intercambio antes de `docker compose up --build`:

  ```bash
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

- **Instancias inactivas**: Oracle puede recuperar instancias «Always Free» que pasen mucho tiempo casi sin uso. Si la web es solo una demo, entra de vez en cuando; si deja de funcionar, crea otra instancia y repite la guía restaurando tu copia de seguridad.

## Qué se ha desplegado

| Servicio | Imagen | Función |
|---|---|---|
| `db` | `mariadb:11.4` | Base de datos (volumen `datos_db`) |
| `app` | se construye con el `Dockerfile` | API de Node.js que sirve también la web compilada; archivos subidos en el volumen `archivos` |
| `caddy` | `caddy:2.8-alpine` | Proxy inverso con HTTPS automático en los puertos 80 y 443 |

Solo Caddy está expuesto a Internet; la base de datos y la aplicación solo son accesibles dentro de la red interna de Docker.
