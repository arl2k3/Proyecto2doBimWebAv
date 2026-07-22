# Build from backend directory:
#   docker build -f casino-service/Dockerfile -t betzone-casino-service .

FROM node:20-alpine

WORKDIR /app/casino-service

COPY casino-service/package*.json ./
RUN npm install --omit=dev

COPY casino-service/src ./src
COPY shared /app/shared
RUN cd /app/shared && npm install --omit=dev

EXPOSE 3004

CMD ["node", "src/server.js"]
