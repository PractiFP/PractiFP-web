// Función de Vercel: toda la API Express de PractiFP se ejecuta como una única función serverless.
// vercel.json redirige aquí todas las peticiones a /api/... (Express recibe la ruta original).
import app from '../backend/src/app.js';

export default app;
