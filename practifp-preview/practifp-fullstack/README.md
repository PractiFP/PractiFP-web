# PractiFP — React + Node.js + MySQL

Backend en `backend/` (Node.js, Express, MySQL) y frontend en `frontend/` (React, Vite).

## 1. Base de datos

Necesitas un MySQL en marcha. Lo más rápido si tienes Docker:

```
docker compose up -d
```

Esto crea la base de datos `practifp` con el esquema de `backend/sql/schema.sql` ya cargado
(usuario, alumno, empresa, empresa_ciclo, oferta, tecnologia, oferta_tecnologia,
alumno_tecnologia, candidatura, favorito).

Sin Docker: crea la base de datos tú mismo y ejecuta ese `.sql` contra tu servidor MySQL.

## 2. Backend

```
cd backend
cp .env.example .env      # y ajusta usuario/contraseña de MySQL si hace falta
npm install
npm run seed               # datos de ejemplo (solo si la BD está vacía)
npm run dev                 # http://localhost:3001
```

Cuentas de ejemplo tras el seed: `alumno@demo.es` / `alumno123`,
`empresa@techsevilla.es` / `empresa123`, `admin@practifp.es` / `admin123`.

## 3. Frontend

```
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                 # http://localhost:5173
```

## Qué incluye

- **Auth**: registro/login con JWT y contraseñas con bcrypt.
- **Alumno**: buscador con filtros (texto, ciclo, modalidad, tecnología, remunerada),
  compatibilidad alumno↔oferta, favoritos, candidaturas, empresas que aceptan su ciclo
  aunque no tengan oferta abierta, perfil con subida de CV.
- **Empresa**: CRUD de ofertas, pausar/reactivar, ver candidatos con CV descargable y
  cambiar el estado de cada candidatura, perfil con los ciclos que acepta.
- **Admin**: estadísticas, gestión de usuarios (bloquear/eliminar), moderación de ofertas.

## Notas para producción

- Cambia `JWT_SECRET` por una cadena larga y aleatoria.
- El CV se guarda en `backend/uploads/`; en producción usa almacenamiento persistente
  (o un bucket tipo S3) en vez del disco local.
- Configura HTTPS y ajusta `CORS_ORIGIN` al dominio real del frontend.
