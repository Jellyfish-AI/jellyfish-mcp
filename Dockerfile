FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server/ ./server/

USER node
CMD ["node", "server/index.js"]
