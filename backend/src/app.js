// Configuración de la aplicación Express (sin arrancar el servidor).
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import rutas from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { cabecerasSeguridad } from './middlewares/seguridad.js';
import { esquemaAlDia } from './config/migraciones.js';

const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.use(cabecerasSeguridad);
app.use('/api', cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: '100kb' }));

// Añade a una base de datos ya instalada las tablas o columnas nuevas (una vez por proceso)
app.use('/api', esquemaAlDia);
app.use('/api', rutas);
app.use('/api', notFound);

// Producción: se sirve el frontend compilado y cualquier otra ruta devuelve index.html (React Router)
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (env.servirFrontend) {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.warn('SERVIR_FRONTEND=true pero no existe frontend/dist. Ejecuta "npm run build" en frontend.');
  } else {
    app.use(express.static(DIST, { index: false, maxAge: '7d', setHeaders: (res, f) => { if (f.endsWith('.html')) res.set('Cache-Control', 'no-cache'); } }));
    app.get('*', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(DIST, 'index.html')));
  }
}

app.use(notFound);
app.use(errorHandler);

export default app;
