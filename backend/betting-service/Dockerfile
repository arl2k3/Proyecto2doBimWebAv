# Build from backend/: docker build -f betting-service/Dockerfile .
FROM node:20-alpine

WORKDIR /app/betting-service

COPY betting-service/package*.json ./
RUN npm install --omit=dev

COPY betting-service/src ./src
COPY shared /app/shared
RUN cd /app/shared && npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "src/server.js"]
