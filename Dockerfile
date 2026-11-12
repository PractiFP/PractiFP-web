# Imagen de producción de PractiFP: compila el frontend y lo sirve desde el backend.

# ---------- 1. Compilar el frontend ----------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2. Backend + frontend compilado ----------
FROM node:22-alpine
ENV NODE_ENV=production \
    SERVIR_FRONTEND=true \
    PORT=3000 \
    UPLOADS_DIR=/datos/uploads
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/server.js ./
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY database /app/database
COPY --from=frontend /app/frontend/dist /app/frontend/dist
# Carpeta de archivos subidos (se monta como volumen para que no se pierda)
RUN mkdir -p /datos/uploads && chown -R node:node /datos
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/salud > /dev/null || exit 1
CMD ["node", "server.js"]
