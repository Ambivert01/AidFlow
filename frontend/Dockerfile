# Multi-stage: build the static Vite bundle, then serve it with nginx.
# VITE_* env vars are baked in at BUILD time, not runtime - pass them as
# build args (see docker-compose.yml / your CI build step).
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_CHAIN_ID
ARG VITE_BLOCKCHAIN_EXPLORER
ARG VITE_APP_NAME=AidFlow
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CHAIN_ID=$VITE_CHAIN_ID \
    VITE_BLOCKCHAIN_EXPLORER=$VITE_BLOCKCHAIN_EXPLORER \
    VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
