# HelloClaw

OpenClaw 的桌面客户端与 Web 应用，支持与 AI Agent 进行对话、管理定时任务、编辑 Agent 文件以及应用扩展。

## 功能特性

- **AI 对话**: 与 OpenClaw Agent 进行实时对话交流
- **多实例管理**: 同时管理多个 OpenClaw 服务器连接
- **Agent 管理**: 查看 Agent 列表、详情、定时任务和文件
- **定时任务**: 创建、查看、删除 Agent 的定时任务
- **文件编辑**: 在线编辑 Agent 配置和代码文件
- **应用中心**: 扩展应用支持
- **跨平台**: 支持 macOS、Windows、Linux 桌面端和 Web 浏览器

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 桌面框架 | Electron 34 |
| 样式方案 | TailwindCSS + shadcn/ui |
| 数据存储 | SQLite (Electron) / localStorage (Web) |
| 通信协议 | WebSocket (JSON-RPC) |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# Web 模式（仅前端，需要配置代理）
npm run dev

# Electron 模式（同时启动 Vite 和 Electron）
npm run dev:electron
```

### 构建产物

```bash
# 类型检查 + Vite 构建
npm run build

# 仅构建 Web 版本
npm run build:web

# 打包 Electron 应用（生成 DMG/ZIP/NSIS 等）
npm run build:electron
```

## 项目结构

```
helloclaw/
├── electron/
│   ├── main.ts          # Electron 主进程、SQLite 数据库、IPC 处理
│   └── preload.ts       # 预加载脚本，暴露 electronAPI
├── src/
│   ├── App.tsx          # 根组件，页面路由和实例切换
│   ├── main.tsx         # 入口文件
│   ├── index.css        # 全局样式
│   ├── components/
│   │   ├── Sidebar.tsx          # 侧边栏导航
│   │   ├── ConnectDialog.tsx    # 连接配置对话框
│   │   ├── InstanceSwitcher.tsx # 实例管理
│   │   └── ui/                  # shadcn/ui 组件
│   ├── pages/
│   │   ├── ChatPage.tsx         # 聊天页面
│   │   ├── AgentsPage.tsx       # Agent 列表
│   │   ├── AgentDetailPage.tsx  # Agent 详情
│   │   ├── SettingsPage.tsx     # 设置页面
│   │   └── AppCenterPage.tsx    # 应用中心
│   ├── lib/
│   │   ├── gateway.ts           # WebSocket 客户端
│   │   ├── openclaw-api.ts      # OpenClaw API 封装
│   │   └── utils.ts             # 工具函数
│   ├── store/
│   │   ├── connection.ts        # 连接状态管理
│   │   └── instances.ts         # 多实例管理
│   └── apps/                    # 扩展应用
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 架构说明

### 多实例支持

应用支持同时管理多个 OpenClaw 服务器连接：
- Electron 模式: 实例配置存储于 SQLite 数据库
- Web 模式: 实例配置存储于 localStorage

### WebSocket 通信

通过 `GatewayClient` 类（`src/lib/gateway.ts`）与 OpenClaw Gateway 建立 WebSocket 连接，采用 JSON-RPC 风格的请求/响应模式。

### API 层

`src/lib/openclaw-api.ts` 封装了所有 OpenClaw Gateway API：

| 模块 | 方法 | 说明 |
|------|------|------|
| 聊天 | `chat.history` / `chat.send` / `chat.abort` | 对话相关 |
| Agent | `agents.list` / `agents.files.*` | Agent 管理 |
| 定时任务 | `cron.list` / `cron.add` / `cron.remove` | 任务调度 |
| 系统 | `channels.status` / `models.list` / `tools.catalog` | 系统信息 |

### 环境检测

代码通过检查 `window.electronAPI` 是否存在来判断运行环境，并选择对应的存储后端。

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_WEB_ONLY=true` | 仅构建/运行 Web 版本 |
| `OPENCLAW_URL` | Vite 开发代理目标地址（默认 `http://localhost:18789`） |

## Electron 构建

`package.json` 中的 `build` 字段定义了打包配置：

- **macOS**: DMG + ZIP
- **Windows**: NSIS + Portable
- **Linux**: AppImage + DEB

构建产物输出到 `release/` 目录。

## 开发指南

```bash
# 代码检查
npm run lint

# 预览构建产物
npm run preview
```

## 许可证

MIT
