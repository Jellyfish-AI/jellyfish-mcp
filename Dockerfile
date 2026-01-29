FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node server/ ./server/

USER node
CMD ["node", "server/index.js"]
