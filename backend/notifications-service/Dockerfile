# Build from backend/: docker build -f notifications-service/Dockerfile .
FROM node:20-alpine

WORKDIR /app/notifications-service

COPY notifications-service/package*.json ./
RUN npm install --omit=dev

COPY notifications-service/src ./src
COPY shared /app/shared
RUN cd /app/shared && npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3006/health || exit 1

CMD ["node", "src/server.js"]
