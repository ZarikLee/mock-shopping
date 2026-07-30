# 构建前端
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 运行后端 + 前端静态文件
FROM node:24
WORKDIR /app

# 复制前端构建产物
COPY --from=builder /app/dist ./dist

# 复制后端代码
COPY server/package.json ./server/
COPY server/pnpm-lock.yaml ./server/

WORKDIR /app/server
RUN corepack enable && pnpm install --prod

COPY server/ .

# 复制商品数据给后端
COPY --from=builder /app/src/data/products.json ./src/data/products.json

WORKDIR /app/server

# 环境变量
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
