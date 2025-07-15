FROM node:22-alpine AS base

# 依赖安装阶段
FROM base AS deps
# 安装 libc6-compat 依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 拷贝依赖文件
COPY package.json pnpm-lock.yaml* ./
# 安装 pnpm
RUN npm install -g pnpm
# 安装依赖
RUN pnpm i --frozen-lockfile


# 构建阶段
FROM base AS builder
WORKDIR /app
# 拷贝 node_modules
COPY --from=deps /app/node_modules ./node_modules
# 拷贝项目文件
COPY . .

# 在 builder 阶段同样需要安装 pnpm
RUN npm install -g pnpm

# 构建时禁用 Next.js 遥测
# ENV NEXT_TELEMETRY_DISABLED=1

# 构建项目
RUN pnpm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# 运行时禁用 Next.js 遥测
# ENV NEXT_TELEMETRY_DISABLED=1

# 创建用户和用户组
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 拷贝 public 目录
COPY --from=builder /app/public ./public

# 设置 .next 目录权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 拷贝构建输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000

# 设置主机名
ENV HOSTNAME="0.0.0.0"
# 启动命令
CMD ["node", "server.js"]
