# AidFlow backend API. The same image is used for both the API server and
# the worker process (see docker-compose.yml) - only the CMD differs.
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads/proofs

ENV NODE_ENV=production
EXPOSE 5000

# Overridden to `node src/workers/index.js` for the worker container in
# docker-compose.yml / the k8s worker deployment.
CMD ["node", "server.js"]
