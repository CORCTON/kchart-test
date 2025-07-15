# --- Stage 1: Build ---
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置 pnpm 源
RUN npm install -g pnpm && pnpm config set registry https://mirrors.cloud.tencent.com/npm/

# 复制依赖描述文件
COPY package.json pnpm-lock.yaml ./

# 安装生产环境依赖
RUN pnpm install --prod --frozen-lockfile

# 复制所有项目文件
COPY . .

# 构建应用
RUN pnpm build

# --- Stage 2: Production ---
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production

# 从构建阶段复制必要的产物
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# 安装生产依赖
RUN npm install -g pnpm && pnpm config set registry https://mirrors.cloud.tencent.com/npm/
RUN pnpm install --prod --frozen-lockfile

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
