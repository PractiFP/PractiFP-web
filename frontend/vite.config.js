import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // En desarrollo, /api se redirige al backend para evitar problemas de CORS
      proxy: {
        '/api': { target: env.VITE_BACKEND_URL || 'http://localhost:3000', changeOrigin: true },
      },
    },
  };
});
