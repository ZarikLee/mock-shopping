FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM nginx:alpine

RUN apk add --no-cache gettext

COPY --from=builder /app/docker-nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD export PORT=${PORT:-80} && envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
