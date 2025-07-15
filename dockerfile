# 第一阶段：构建
FROM node:22.16.0-alpine3.21 AS deps
ENV NODE_ENV=production
WORKDIR /app
RUN pnpm config set registry https://mirrors.cloud.tencent.com/npm/
# 先复制依赖相关文件
COPY package.json pnpm-lock.yaml/
# 复制所有 workspace 源码（而不仅仅是 package.json）
COPY packages ./packages
COPY apps ./apps
# 安装依赖
RUN pnpm install --frozen-lockfile
WORKDIR /app/{{APP_PATH}}
RUN pnpm i
RUN pnpm build:{{BUILD_CUSTOM}}

EXPOSE 3000
CMD ["pnpm", "start"]