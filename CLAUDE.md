# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

HelloClaw 是一个 OpenClaw 的桌面和 Web 客户端应用，支持与 AI Agent 进行对话、管理定时任务和编辑 Agent 文件。

## 常用命令

```bash
# 安装依赖
npm install

# Web 模式开发（仅前端）
npm run dev

# Electron 模式开发（同时启动 Vite 和 Electron）
npm run dev:electron

# 构建产物
npm run build              # 类型检查 + Vite 构建
npm run build:web          # 仅 Web 版本
npm run build:electron     # Electron 应用打包（生成 DMG/ZIP/NSIS 等）

# 代码检查
npm run lint

# 预览构建产物
npm run preview
```

## 技术栈

- **前端框架**: React 19 + TypeScript + Vite
- **桌面框架**: Electron 34
- **样式方案**: TailwindCSS + shadcn/ui (Radix UI)
- **状态管理**: React Hooks（无 Redux/Zustand）
- **数据存储**:
  - Electron 模式: SQLite（`electron/main.ts` 中通过 `node:sqlite` 实现）
  - Web 模式: localStorage

## 架构说明

### 目录结构

```
electron/
  main.ts      # Electron 主进程，SQLite 数据库，IPC 处理
  preload.ts   # 预加载脚本，暴露 electronAPI 到渲染进程

src/
  App.tsx                  # 根组件，页面路由和实例切换逻辑
  main.tsx                 # 入口文件
  index.css                # 全局样式（CSS 变量、Tailwind）

  components/
    Sidebar.tsx            # 侧边栏（导航 + 实例切换）
    ConnectDialog.tsx      # 连接配置对话框
    InstanceSwitcher.tsx   # 实例管理下拉菜单
    ui/                    # shadcn/ui 组件库

  lib/
    gateway.ts             # WebSocket 客户端，连接 OpenClaw Gateway
    openclaw-api.ts        # OpenClaw API 封装（chat、agents、cron 等）
    utils.ts               # 工具函数

  pages/
    ChatPage.tsx           # 聊天页面
    AgentsPage.tsx         # Agent 列表页面
    AgentDetailPage.tsx    # Agent 详情页面（定时任务、文件编辑）
    SettingsPage.tsx       # 设置页面

  store/
    connection.ts          # 连接状态管理 Hook（useOpenClawConnection）
    instances.ts           # 多实例管理 Hook（useInstances）
```

### 核心架构要点

1. **多实例支持**: 应用支持同时管理多个 OpenClaw 服务器连接。实例配置在 Electron 模式下存储于 SQLite，Web 模式下存储于 localStorage。

2. **WebSocket 通信**: 通过 `GatewayClient` 类（`src/lib/gateway.ts`）与 OpenClaw Gateway 建立 WebSocket 连接，使用 JSON-RPC 风格的请求/响应模式。

3. **环境检测**: 代码通过检查 `window.electronAPI` 是否存在来判断当前运行环境（Electron 或 Web），并据此选择不同的存储后端。

4. **Vite 代理**: Web 开发模式下，Vite 代理 `/openclaw-ws` 路径到 OpenClaw 服务器（默认 `localhost:18789`），以绕过浏览器的 Origin 限制。可通过 `OPENCLAW_URL` 环境变量修改目标地址。

5. **API 层**: `src/lib/openclaw-api.ts` 封装了所有 OpenClaw Gateway API，包括：
   - `chat.history` / `chat.send` / `chat.abort` - 聊天相关
   - `agents.list` / `agents.files.*` - Agent 管理
   - `cron.list` / `cron.add` / `cron.remove` - 定时任务
   - `channels.status` / `models.list` / `tools.catalog` - 系统信息

### 环境变量

- `VITE_WEB_ONLY=true` - 仅构建/运行 Web 版本（不包含 Electron）
- `OPENCLAW_URL` - Vite 开发代理目标地址（默认 `http://localhost:18789`）

### Electron 构建配置

`package.json` 中的 `build` 字段定义了 electron-builder 配置：
- macOS: DMG + ZIP
- Windows: NSIS + Portable
- Linux: AppImage + DEB
