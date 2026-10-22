// Arranca la preview completa con un solo comando: `node start.mjs`
// No necesita MySQL ni "npm install": usa sustitutos ligeros (ver PREVIEW.md) solo para esto.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.JWT_SECRET ||= 'clave-de-preview-no-usar-en-produccion';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';
process.env.PORT ||= '3001';

process.chdir(path.join(__dirname, 'backend'));
console.log('Cargando datos de ejemplo y arrancando el backend…\n');
await import('./backend/src/seed.js');
await import('./backend/src/index.js');

const DIR = path.join(__dirname, 'frontend', 'dist');
const TIPOS = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  fs.readFile(path.join(DIR, p), (err, data) => {
    if (err) { res.statusCode = 404; return res.end('No encontrado'); }
    res.setHeader('Content-Type', TIPOS[path.extname(p)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(5173, () => {
  console.log('\n¡Listo! Abre esto en tu navegador:\n');
  console.log('   http://localhost:5173\n');
  console.log('Cuentas de ejemplo:');
  console.log('  Alumno:  alumno@demo.es / alumno123');
  console.log('  Empresa: empresa@techsevilla.es / empresa123');
  console.log('  Admin:   admin@practifp.es / admin123');
  console.log('\n(Ctrl+C para parar. Los datos viven solo en memoria: al reiniciar, vuelven a su estado inicial.)');
});
