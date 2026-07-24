# 多阶段构建
FROM node:22 AS builder

# 设置工作目录
WORKDIR /app

# 拷贝依赖文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装 pnpm 并安装依赖
RUN corepack enable && pnpm install --frozen-lockfile

# 拷贝源码
COPY . .

# 构建前端
RUN pnpm build

# 生产镜像
FROM nginx:alpine

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/docker-nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
