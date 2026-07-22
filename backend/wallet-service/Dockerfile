# Build from backend/: docker build -f wallet-service/Dockerfile .
FROM node:20-alpine

WORKDIR /app/wallet-service

COPY wallet-service/package*.json ./
RUN npm install --omit=dev

COPY wallet-service/src ./src
COPY shared /app/shared
RUN cd /app/shared && npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "src/server.js"]
