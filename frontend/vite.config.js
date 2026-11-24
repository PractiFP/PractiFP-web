import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      // Las fuentes van siempre como archivos aparte (no incrustadas como data:), para que
      // la política de seguridad (CSP) pueda limitarlas a font-src 'self'
      assetsInlineLimit: (archivo) => (/\.(woff2?|ttf|otf)$/.test(archivo) ? false : undefined),
    },
    server: {
      port: 5173,
      // En desarrollo, /api se redirige al backend para evitar problemas de CORS
      proxy: {
        '/api': { target: env.VITE_BACKEND_URL || 'http://localhost:3000', changeOrigin: true },
      },
    },
  };
});
