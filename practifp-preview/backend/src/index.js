import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './db.js';
import { auth } from './middleware/auth.js';
import { HttpError, selOferta, fmtOferta } from './util.js';
import authRoutes from './routes/auth.js';
import perfilRoutes from './routes/perfil.js';
import ofertasRoutes from './routes/ofertas.js';
import candidaturasRoutes from './routes/candidaturas.js';
import adminRoutes from './routes/admin.js';
import proyectosRoutes from './routes/proyectos.js';
import valoracionesRoutes from './routes/valoraciones.js';

if (!process.env.JWT_SECRET) throw new Error('Falta JWT_SECRET en backend/.env');
fs.mkdirSync('uploads', { recursive: true });

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/valoraciones', valoracionesRoutes);
app.use('/api', candidaturasRoutes);

// Imágenes de proyectos del portfolio: no son datos sensibles, se sirven en estático
app.use('/uploads/proyectos', express.static('uploads/proyectos'));

// Público: últimas ofertas para la landing
app.get('/api/publico/ofertas', async (req, res) => {
  const [rows] = await pool.query(`${selOferta()} WHERE o.activa = 1 ORDER BY o.id DESC LIMIT 30`);
  res.json(rows.map((o) => fmtOferta(o)));
});

app.get('/api/tecnologias', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT nombre FROM tecnologia ORDER BY nombre');
  res.json(rows.map((r) => r.nombre));
});

app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.name === 'MulterError')
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera los 2 MB' : err.message });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'No encontrado' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API PractiFP en http://localhost:${port}`));
