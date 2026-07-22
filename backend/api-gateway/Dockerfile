FROM node:20-alpine

WORKDIR /app/api-gateway

COPY api-gateway/package.json ./
RUN npm install --omit=dev

COPY api-gateway/src ./src
COPY shared /app/shared
RUN cd /app/shared && npm install --omit=dev

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "src/server.js"]
