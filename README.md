# CES K线图表

这是一个基于 [Next.js](https://nextjs.org) 构建的交易图表应用，提供实时的K线图表、订单簿和交易动态展示功能。

## 功能特性

- 📊 **实时K线图表** - 基于 [lightweight-charts](https://github.com/tradingview/lightweight-charts) 的高性能图表组件
- 📈 **交易数据展示** - 显示开盘价、收盘价、成交量等交易信息
- 📋 **订单簿** - 实时买卖订单数据展示
- 🔄 **交易动态** - 最新交易记录和市场动态
- 🎨 **现代化UI** - 基于 TailwindCSS 的响应式设计
- ⚡ **实时更新** - 使用 React Query 进行数据管理和自动刷新

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **状态管理**: TanStack React Query
- **图表库**: Lightweight Charts
- **样式**: TailwindCSS 4
- **代码格式化**: Biome

## 快速开始

首先，安装依赖：

```bash
pnpm install
```

然后启动开发服务器：

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

访问时需要提供项目ID参数，例如：
```
http://localhost:3000?projectId=your-project-id
```

## 项目结构

```
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── ui/                # 通用UI组件
│   ├── BookList.tsx       # 订单簿组件
│   ├── TickersList.tsx    # 交易动态组件
│   ├── TradeHeader.tsx    # 交易头部信息
│   ├── TradeKCharts.tsx   # K线图表组件
│   └── TradeView.tsx      # 交易视图主组件
├── lib/                   # 工具函数和API
├── types/                 # TypeScript 类型定义
└── public/                # 静态资源
```

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码格式化
pnpm format

# 代码检查
pnpm lint
```

## API 接口

应用需要以下API接口支持：

- **交易摘要** - 获取K线数据和交易统计
- **订单簿** - 获取买卖订单数据
- **交易历史** - 获取历史交易记录

所有接口都支持授权认证，请在请求头中包含适当的授权信息。

## 部署

### Vercel 部署

最简单的部署方式是使用 [Vercel平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)。

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多部署选项。

### Docker 部署

项目包含 Dockerfile，支持容器化部署：

```bash
# 构建镜像
docker build -t ces-kcharts .

# 运行容器
docker run -p 3000:3000 ces-kcharts
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 许可证

此项目为私有项目。
