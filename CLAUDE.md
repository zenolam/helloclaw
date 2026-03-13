# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

HelloClaw 是一个 OpenClaw 的桌面和 Web 客户端应用，支持与 AI Agent 进行对话、管理定时任务、编辑 Agent 文件，以及运行扩展应用。

## 常用命令

```bash
# 安装依赖
npm install

# Web 模式开发（仅前端，使用 Vite 代理）
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
  - Electron 模式: SQLite（`electron/main.ts` 中通过 better-sqlite3 实现）
  - Web 模式: localStorage
- **通信协议**: WebSocket (JSON-RPC 风格)

## 目录结构

```
electron/
  main.ts      # Electron 主进程：SQLite 数据库、IPC 处理、本地应用扫描
  preload.ts   # 预加载脚本：暴露 electronAPI 到渲染进程

src/
  App.tsx                  # 根组件，页面路由和实例切换逻辑
  main.tsx                 # 入口文件
  index.css                # 全局样式（CSS 变量、Tailwind）

  components/
    Sidebar.tsx            # 侧边栏（导航 + 实例切换）
    ConnectDialog.tsx      # 连接配置对话框
    InstanceSwitcher.tsx   # 实例管理下拉菜单
    AppView.tsx            # 应用中心视图容器
    ui/                    # shadcn/ui 组件库

  lib/
    gateway.ts             # GatewayClient 类：WebSocket 客户端
    openclaw-api.ts        # OpenClaw API 封装（chat、agents、cron 等）
    utils.ts               # 工具函数

  pages/
    ChatPage.tsx           # 聊天页面
    AgentsPage.tsx         # Agent 列表页面
    AgentDetailPage.tsx    # Agent 详情页面（定时任务、文件编辑）
    SettingsPage.tsx       # 设置页面
    AppCenterPage.tsx      # 应用中心

  store/
    connection.ts          # 连接状态管理 Hook（useOpenClawConnection）
    instances.ts           # 多实例管理 Hook（useInstances）

  apps/                    # 扩展应用系统
    types.ts               # AppManifest、HelloClawApp、SDK 类型定义
    sdk.ts                 # HelloClawSDKImpl 实现
    store.ts               # useApps、useLocalApps Hook
    loader.ts              # 应用加载器

apps/                      # 本地扩展应用目录（Electron 模式）
```

## 核心架构

### 多实例支持

应用支持同时管理多个 OpenClaw 服务器连接：
- 实例配置包含：`url`、`token`、`password`、`useProxy`
- Electron 模式：存储于 SQLite `instances` 表
- Web 模式：存储于 localStorage `helloclaw:instances`
- 活跃实例 ID 存储于 settings（Electron）或 localStorage `helloclaw:active-instance`

### 环境检测

通过检查 `window.electronAPI` 是否存在判断运行环境：
```typescript
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window
```

根据环境选择不同的存储后端和 WebSocket 连接方式。

### WebSocket 通信

`GatewayClient` 类（`src/lib/gateway.ts`）负责与 OpenClaw Gateway 通信：
- 使用 JSON-RPC 风格的请求/响应模式
- 支持 Token 和 Password 认证
- 自动重连（指数退避，最大 15 秒）
- 接收 `chat`、`tool`、`presence`、`health` 等事件

**连接流程**：
1. 建立 WebSocket 连接
2. 收到 `connect.challenge` 事件后发送 `connect` 请求
3. 认证成功后触发 `onConnected` 回调

**Web 开发代理**：Vite 代理 `/openclaw-ws` 到 OpenClaw 服务器（默认 `localhost:18789`），使浏览器 Origin 显示为本机地址，通过 OpenClaw 的 Origin 检查。

### IPC 通信（Electron 模式）

`electron/preload.ts` 通过 `contextBridge` 暴露 API：
- `instances.list/add/update/remove` - 实例管理
- `settings.get/set` - 设置存储
- `apps:list/get/add/update/remove/scanLocal` - 应用管理

主进程（`electron/main.ts`）处理 IPC 调用并操作 SQLite。

### API 层

`src/lib/openclaw-api.ts` 封装所有 OpenClaw Gateway API：

| 模块 | 方法 | 说明 |
|------|------|------|
| 聊天 | `chat.history` / `chat.send` / `chat.abort` | 对话相关 |
| 会话 | `sessions.list` | 会话列表 |
| Agent | `agents.list` / `agents.files.list/get/set` | Agent 管理和文件 |
| 定时任务 | `cron.list` / `cron.add` / `cron.remove` / `cron.runs` | 任务调度 |
| 渠道 | `channels.status` | 通信渠道状态 |
| 模型 | `models.list` | 可用模型列表 |
| 工具 | `tools.catalog` | Agent 工具目录 |

### 扩展应用系统

HelloClaw 支持类似 Obsidian 的插件架构，详见 `docs/app-engine-architecture.md`。

#### 应用生命周期

应用有四个核心状态：

```
应用市场 (Remote) → 已下载 (Downloaded) → 已实例化 (Instantiated) → 运行中 (Running)
```

1. **Remote**: 应用在市场中，未下载
2. **Downloaded**: 已下载到本地 `apps/{appId}/{version}/`，支持版本管理
3. **Instantiated**: 实例化后创建 Agent、安装 Skill、注册 CronJob
4. **Running**: 应用加载完成，可交互

**多实例支持**: 同一应用可实例化多次（如多个自媒体账号），每个实例有独立的 Agent 和配置。

#### 核心类型

```typescript
// 应用生命周期状态
type AppLifecycleState = 'remote' | 'downloaded' | 'instantiated' | 'running'

// 应用清单
interface AppManifest {
  id: string
  name: string
  version: string
  entry: string           // 入口文件 (main.js)
  style?: string          // 样式文件
  sidebar?: { show: boolean; icon: string; label: string }
  agent?: { id: string; name: string; skills?: string[]; cronjobs?: string[] }
}

// 已加载应用
interface LoadedApp {
  id: string
  manifest: AppManifest
  instance: HelloClawApp | null
  sdk: HelloClawSDK | null
  loadState: 'unloaded' | 'loading' | 'loaded' | 'error' | 'unloading'
}
```

#### 应用目录结构

```
apps/
└── {应用ID}/
    └── {版本}/
        ├── manifest.json       # 应用清单（必需）
        ├── AGENTS.md           # OpenClaw 运行规则（可选）
        ├── SOUL.md             # OpenClaw 个性设定（可选）
        ├── main.js             # 入口文件（必需）
        ├── styles.css          # 可选样式
        ├── skills/
        │   └── *.md            # 技能定义（Markdown + Frontmatter）
        └── cronjobs/
            └── *.json          # 定时任务配置
```

#### HelloClawApp 基类

```typescript
import { HelloClawApp, HelloClawSDK } from 'helloclaw-app'

export default class MyApp extends HelloClawApp {
  // 必须实现：应用加载时调用
  async onload() {
    this.helloclaw.ui.showNotice('App loaded!', 'success')
  }

  // 可选：应用卸载时调用
  onunload() {}

  // 可选：设置面板渲染
  onSettingsRender?(container: HTMLElement): void
}
```

#### SDK API

| API | 方法 | 说明 |
|-----|------|------|
| chat | `send(text)` / `abort()` / `onMessage(cb)` | 聊天能力 |
| agents | `list()` / `get(id)` / `create(config)` / `createSkill()` | Agent 管理 |
| cron | `list()` / `add(job)` / `remove(id)` / `setEnabled()` | 定时任务 |
| storage | `read/write/delete/list(path)` / `readFrontmatter()` / `parseMarkdown()` | 文件存储 |
| ui | `showNotice(msg, type)` / `showModal(config)` / `setSidebarBadge(count)` / `createView()` | UI 能力 |
| workspace | `registerCommand()` / `executeCommand(id)` / `openView(id)` | 工作区管理 |

#### Skill 文件格式

```markdown
---
name: publish-article
description: 将文章发布到指定平台
---

# Publish Article

在用户要求发布文章到多个平台时使用此 skill。

## Parameters
- `article_id` (string): 文章 ID
- `platforms` (string[]): 目标平台列表
```

#### 远程 Skill 定义

`skills/remote.json` 用于声明需要联网下载的 skill，支持多个条目：

```json
{
  "skills": [
    {
      "slug": "github",
      "url": "https://example.com/skills/github/SKILL.md"
    },
    {
      "slug": "ops-helper",
      "url": "https://example.com/skills/ops-helper/SKILL.md",
      "files": {
        "scripts/run.sh": "https://example.com/skills/ops-helper/scripts/run.sh"
      }
    }
  ]
}
```

#### CronJob 文件格式

```json
{
  "name": "周报生成",
  "schedule": { "kind": "cron", "expr": "0 9 * * 1" },
  "payload": { "kind": "agentTurn", "message": "请生成本周报告" },
  "enabled": true
}
```

#### 动态模块加载

使用 Function Constructor 创建隔离作用域：
```typescript
const moduleFactory = new Function('helloclaw', 'HelloClawApp', `
  const module = { exports: {} };
  ${entryContent}
  return module.exports.default || module.exports;
`)
const AppClass = moduleFactory(sdk, HelloClawApp)
```

#### 实例化流程

1. 选择已下载应用及版本
2. 生成实例 ID（格式：`{appId}-{序号}`）
3. 创建 OpenClaw Agent（名称：`{appName}-{agentName}-{序号}`）
4. 安装 Skills 到 Agent workspace
5. 注册 CronJobs
6. 在侧边栏显示入口（`{应用名}-{序号}`）

### 路径别名

TypeScript 配置了 `@/*` 别名指向 `./src/*`：
```typescript
import { Sidebar } from '@/components/Sidebar'
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_WEB_ONLY=true` | 仅构建/运行 Web 版本（不包含 Electron） |
| `OPENCLAW_URL` | Vite 开发代理目标地址（默认 `http://localhost:18789`） |

## Electron 构建

`package.json` 中的 `build` 字段定义了 electron-builder 配置：
- **macOS**: DMG + ZIP
- **Windows**: NSIS + Portable
- **Linux**: AppImage + DEB

构建产物输出到 `release/` 目录。

## SQLite 数据库表结构

```sql
-- OpenClaw 实例配置
CREATE TABLE instances (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  token       TEXT,
  password    TEXT,
  use_proxy   INTEGER,
  status      TEXT NOT NULL DEFAULT 'disconnected',
  created_at  INTEGER NOT NULL
)

-- 全局设置
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
)

-- 已安装应用（基础表）
CREATE TABLE apps (
  id           TEXT PRIMARY KEY,
  manifest     TEXT NOT NULL,
  installed_at INTEGER NOT NULL,
  enabled      INTEGER DEFAULT 1,
  install_path TEXT NOT NULL
)

-- 已下载应用（版本化存储）
CREATE TABLE IF NOT EXISTS downloaded_apps (
  id TEXT PRIMARY KEY,
  manifest TEXT NOT NULL,
  versions TEXT NOT NULL,        -- JSON array of versions
  current_version TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL,
  path TEXT NOT NULL
)

-- 应用实例表
CREATE TABLE IF NOT EXISTS app_instances (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  app_version TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  enabled INTEGER DEFAULT 1,
  data_path TEXT NOT NULL,
  FOREIGN KEY (app_id) REFERENCES downloaded_apps(id)
)

-- 应用文件缓存表（版本化存储）
CREATE TABLE IF NOT EXISTS app_files (
  app_id TEXT NOT NULL,
  version TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY (app_id, version, path)
)

-- 实例数据表
CREATE TABLE IF NOT EXISTS instance_data (
  instance_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (instance_id, key),
  FOREIGN KEY (instance_id) REFERENCES app_instances(id)
)
```

**Web 模式 localStorage 键**：
- `helloclaw:instances` - OpenClaw 实例列表
- `helloclaw:active-instance` - 活跃实例 ID
- `helloclaw_apps` - 已安装应用
- `helloclaw_downloaded_apps` - 已下载应用
- `helloclaw_app_instances` - 应用实例
- `helloclaw_app_files_{id}_{version}` - 应用文件
- `helloclaw_instance_data_{instanceId}` - 实例数据
