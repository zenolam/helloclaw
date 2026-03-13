/**
 * HelloClaw App SDK Implementation
 *
 * This module provides the SDK that apps use to interact with HelloClaw.
 * Inspired by Obsidian's this.app API design.
 */

import type { HelloClawSDKInterface } from './types'
import type {
  AppManifest,
  ChatAPI,
  ChatMessage,
  Attachment,
  AgentsAPI,
  AgentInfo,
  CreateAgentConfig,
  SkillConfig,
  CronAPI,
  CronJobInfo,
  CreateCronJobConfig,
  CronSchedule,
  CronPayload,
  StorageAPI,
  StorageEntry,
  Frontmatter,
  ParsedMarkdown,
  UIAPI,
  ModalConfig,
  NoticeType,
  ViewConfig,
  View,
  WorkspaceAPI,
  CommandConfig,
  SDKEventMap,
} from './types'
import { translate } from '@/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// Event Emitter
// ─────────────────────────────────────────────────────────────────────────────

type EventCallback<T = unknown> = (data: T) => void

class EventEmitter<EventMap extends Record<string, any>> {
  private listeners = new Map<keyof EventMap, Set<EventCallback>>()

  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)

    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback)
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data)
      } catch (err) {
        console.error(`Error in event listener for ${String(event)}:`, err)
      }
    })
  }

  removeAllListeners(): void {
    this.listeners.clear()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HelloClaw SDK Implementation
 *
 * Provides access to all HelloClaw capabilities for apps.
 */
export class HelloClawSDKImpl extends EventEmitter<SDKEventMap> implements HelloClawSDKInterface {
  readonly appId: string
  readonly manifest: AppManifest
  readonly chat: ChatAPI
  readonly agents: AgentsAPI
  readonly cron: CronAPI
  readonly storage: StorageAPI
  readonly ui: UIAPI
  readonly workspace: WorkspaceAPI

  private files: Record<string, string>
  private dataStore: Map<string, string>
  public views: Map<string, View>
  private commands: Map<string, CommandConfig>
  private activeView: View | null = null
  private globalCallbacks: {
    sendMessage?: (text: string, attachments?: Attachment[]) => Promise<string>
    abortChat?: () => Promise<void>
    onChatMessage?: (callback: (msg: ChatMessage) => void) => () => void
    listAgents?: () => Promise<AgentInfo[]>
    getAgent?: (id: string) => Promise<AgentInfo | null>
    createAgent?: (config: CreateAgentConfig) => Promise<AgentInfo>
    createSkill?: (agentId: string, skill: SkillConfig) => Promise<void>
    listCronJobs?: () => Promise<CronJobInfo[]>
    addCronJob?: (job: CreateCronJobConfig) => Promise<CronJobInfo>
    removeCronJob?: (id: string) => Promise<void>
    setCronEnabled?: (id: string, enabled: boolean) => Promise<void>
  }

  constructor(
    appId: string,
    manifest: AppManifest,
    files: Record<string, string>,
    callbacks?: HelloClawSDKImpl['globalCallbacks']
  ) {
    super()
    this.appId = appId
    this.manifest = manifest
    this.files = files
    this.dataStore = new Map()
    this.views = new Map()
    this.commands = new Map()
    this.globalCallbacks = callbacks || {}

    // Initialize API implementations
    this.chat = this.createChatAPI()
    this.agents = this.createAgentsAPI()
    this.cron = this.createCronAPI()
    this.storage = this.createStorageAPI()
    this.ui = this.createUIAPI()
    this.workspace = this.createWorkspaceAPI()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Chat API
  // ───────────────────────────────────────────────────────────────────────────

  private createChatAPI(): ChatAPI {
    return {
      send: async (text: string, attachments?: Attachment[]): Promise<string> => {
        if (this.globalCallbacks.sendMessage) {
          return this.globalCallbacks.sendMessage(text, attachments)
        }
        // Fallback: emit event for main app to handle
        this.emit('chat:message', {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: 'user',
          content: text,
          ts: Date.now(),
        })
        return `${Date.now()}`
      },

      abort: async (): Promise<void> => {
        if (this.globalCallbacks.abortChat) {
          return this.globalCallbacks.abortChat()
        }
      },

      onMessage: (callback: (msg: ChatMessage) => void): (() => void) => {
        if (this.globalCallbacks.onChatMessage) {
          return this.globalCallbacks.onChatMessage(callback)
        }
        // Fallback: use event system
        return this.on('chat:message', callback)
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Agents API
  // ───────────────────────────────────────────────────────────────────────────

  private createAgentsAPI(): AgentsAPI {
    return {
      list: async (): Promise<AgentInfo[]> => {
        if (this.globalCallbacks.listAgents) {
          return this.globalCallbacks.listAgents()
        }
        return []
      },

      get: async (id: string): Promise<AgentInfo | null> => {
        if (this.globalCallbacks.getAgent) {
          return this.globalCallbacks.getAgent(id)
        }
        return null
      },

      create: async (config: CreateAgentConfig): Promise<AgentInfo> => {
        if (this.globalCallbacks.createAgent) {
          return this.globalCallbacks.createAgent(config)
        }
        throw new Error('Agent creation not available')
      },

      createSkill: async (agentId: string, skill: SkillConfig): Promise<void> => {
        if (this.globalCallbacks.createSkill) {
          return this.globalCallbacks.createSkill(agentId, skill)
        }
        throw new Error('Skill creation not available')
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cron API
  // ───────────────────────────────────────────────────────────────────────────

  private createCronAPI(): CronAPI {
    return {
      list: async (): Promise<CronJobInfo[]> => {
        if (this.globalCallbacks.listCronJobs) {
          return this.globalCallbacks.listCronJobs()
        }
        return []
      },

      add: async (job: CreateCronJobConfig): Promise<CronJobInfo> => {
        if (this.globalCallbacks.addCronJob) {
          return this.globalCallbacks.addCronJob(job)
        }
        throw new Error('Cron job creation not available')
      },

      remove: async (id: string): Promise<void> => {
        if (this.globalCallbacks.removeCronJob) {
          return this.globalCallbacks.removeCronJob(id)
        }
        throw new Error('Cron job removal not available')
      },

      setEnabled: async (id: string, enabled: boolean): Promise<void> => {
        if (this.globalCallbacks.setCronEnabled) {
          return this.globalCallbacks.setCronEnabled(id, enabled)
        }
        throw new Error('Cron job enable/disable not available')
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Storage API
  // ───────────────────────────────────────────────────────────────────────────

  private createStorageAPI(): StorageAPI {
    const getStorageKey = (path: string) => `helloclaw_app_data_${this.appId}_${path}`

    return {
      read: async (path: string): Promise<string> => {
        // Check in-memory store first
        const key = getStorageKey(path)
        if (this.dataStore.has(key)) {
          return this.dataStore.get(key)!
        }

        // Check localStorage (Web mode)
        if (typeof localStorage !== 'undefined') {
          const data = localStorage.getItem(key)
          if (data !== null) {
            this.dataStore.set(key, data)
            return data
          }
        }

        // Check app bundled files
        if (this.files[path]) {
          return this.files[path]
        }

        throw new Error(`File not found: ${path}`)
      },

      write: async (path: string, content: string): Promise<void> => {
        const key = getStorageKey(path)
        this.dataStore.set(key, content)

        // Persist to localStorage (Web mode)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, content)
        }
      },

      delete: async (path: string): Promise<void> => {
        const key = getStorageKey(path)
        this.dataStore.delete(key)

        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key)
        }
      },

      list: async (dir: string): Promise<StorageEntry[]> => {
        const entries: StorageEntry[] = []
        const prefix = getStorageKey(dir)

        // Check localStorage
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
              const relativePath = key.slice(prefix.length + 1)
              entries.push({
                path: relativePath,
                isDirectory: false,
                size: localStorage.getItem(key)?.length || 0,
              })
            }
          }
        }

        // Check in-memory store
        this.dataStore.forEach((value, key) => {
          if (key.startsWith(prefix)) {
            const relativePath = key.slice(prefix.length + 1)
            if (!entries.find((e) => e.path === relativePath)) {
              entries.push({
                path: relativePath,
                isDirectory: false,
                size: value.length,
              })
            }
          }
        })

        // Check bundled files
        Object.keys(this.files).forEach((path) => {
          if (path.startsWith(dir)) {
            const relativePath = path.slice(dir.length + 1)
            if (!entries.find((e) => e.path === relativePath)) {
              entries.push({
                path: relativePath,
                isDirectory: false,
                size: this.files[path].length,
              })
            }
          }
        })

        return entries
      },

      exists: async (path: string): Promise<boolean> => {
        const key = getStorageKey(path)

        if (this.dataStore.has(key)) return true
        if (typeof localStorage !== 'undefined' && localStorage.getItem(key) !== null) return true
        if (this.files[path]) return true

        return false
      },

      readFrontmatter: async (path: string): Promise<Frontmatter> => {
        const content = await this.createStorageAPI().read(path)
        const parsed = parseMarkdownWithFrontmatter(content)
        return parsed.frontmatter
      },

      writeFrontmatter: async (path: string, fm: Frontmatter): Promise<void> => {
        const content = await this.createStorageAPI().read(path)
        const parsed = parseMarkdownWithFrontmatter(content)
        const newFm = { ...parsed.frontmatter, ...fm }
        const newContent = serializeMarkdownWithFrontmatter(newFm, parsed.body)
        await this.createStorageAPI().write(path, newContent)
      },

      parseMarkdown: async (path: string): Promise<ParsedMarkdown> => {
        const content = await this.createStorageAPI().read(path)
        return parseMarkdownWithFrontmatter(content)
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI API
  // ───────────────────────────────────────────────────────────────────────────

  private createUIAPI(): UIAPI {
    let badgeCount = 0

    return {
      showNotice: (message: string, type: NoticeType = 'info'): void => {
        // Create a toast notification
        const toast = document.createElement('div')
        toast.className = `helloclaw-notice helloclaw-notice-${type}`
        toast.textContent = message
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
          color: white;
          font-size: 14px;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        `
        document.body.appendChild(toast)

        setTimeout(() => {
          toast.style.animation = 'slideOut 0.3s ease'
          setTimeout(() => toast.remove(), 300)
        }, 3000)
      },

      showModal: (config: ModalConfig): void => {
        // Create modal overlay
        const overlay = document.createElement('div')
        overlay.className = 'helloclaw-modal-overlay'
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `

        const modal = document.createElement('div')
        modal.className = 'helloclaw-modal'
        modal.style.cssText = `
          background: var(--bg-primary, #1a1a1a);
          border-radius: 12px;
          padding: 24px;
          min-width: 320px;
          max-width: 480px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `

        modal.innerHTML = `
          <h3 style="margin: 0 0 16px; color: var(--text-primary, white); font-size: 18px;">${config.title}</h3>
          <div style="color: var(--text-secondary, #a0a0a0); margin-bottom: 20px;">${config.content}</div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="helloclaw-modal-cancel" style="
              padding: 8px 16px;
              border-radius: 6px;
              border: 1px solid var(--border-color, #333);
              background: transparent;
              color: var(--text-secondary, #a0a0a0);
              cursor: pointer;
            ">${config.cancelText || translate('common.cancel')}</button>
            <button class="helloclaw-modal-confirm" style="
              padding: 8px 16px;
              border-radius: 6px;
              border: none;
              background: var(--primary, #3b82f6);
              color: white;
              cursor: pointer;
            ">${config.confirmText || translate('common.confirm')}</button>
          </div>
        `

        const closeModal = () => overlay.remove()

        modal.querySelector('.helloclaw-modal-cancel')?.addEventListener('click', () => {
          closeModal()
          config.onCancel?.()
        })

        modal.querySelector('.helloclaw-modal-confirm')?.addEventListener('click', async () => {
          await config.onConfirm?.()
          closeModal()
        })

        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            closeModal()
            config.onCancel?.()
          }
        })

        overlay.appendChild(modal)
        document.body.appendChild(overlay)
      },

      setSidebarBadge: (count: number): void => {
        badgeCount = count
        // Emit event for main app to handle
        this.emit('layout:changed', undefined)
        // In production, this would update the sidebar badge
      },

      createView: (config: ViewConfig): View => {
        const container = document.createElement('div')
        container.id = `view-${config.id}`
        container.className = 'helloclaw-view w-full h-full'

        const view: View = {
          id: config.id,
          container,
          destroy: () => {
            config.destroy?.()
            container.remove()
            this.views.delete(config.id)
            if (this.activeView === view) {
              this.activeView = null
            }
          },
        }

        this.views.set(config.id, view)
        config.render(container)

        return view
      },

      getActiveView: (): View | null => {
        return this.activeView
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Workspace API
  // ───────────────────────────────────────────────────────────────────────────

  private createWorkspaceAPI(): WorkspaceAPI {
    return {
      registerCommand: (config: CommandConfig): (() => void) => {
        this.commands.set(config.id, config)
        return () => {
          this.commands.delete(config.id)
        }
      },

      executeCommand: (id: string): void => {
        const cmd = this.commands.get(id)
        if (cmd) {
          cmd.callback()
        }
      },

      openView: (viewId: string): void => {
        const view = this.views.get(viewId)
        if (view) {
          this.activeView = view
          this.emit('view:activated', view)
        }
      },

      getActiveView: (): View | null => {
        return this.activeView
      },

      onLayoutChange: (callback: () => void): (() => void) => {
        return this.on('layout:changed', callback)
      },
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Destroy all views
    this.views.forEach((view) => view.destroy())
    this.views.clear()

    // Clear commands
    this.commands.clear()

    // Remove all event listeners
    this.removeAllListeners()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown Parsing Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse markdown file with YAML frontmatter
 */
function parseMarkdownWithFrontmatter(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (match) {
    const frontmatterStr = match[1]
    const body = match[2]

    // Simple YAML parser for frontmatter
    const frontmatter: Frontmatter = {}
    frontmatterStr.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        let value: unknown = line.slice(colonIndex + 1).trim()

        // Parse basic types
        if (value === 'true') value = true
        else if (value === 'false') value = false
        else if (value === 'null') value = null
        else if (/^\d+$/.test(value as string)) value = parseInt(value as string, 10)
        else if (/^\d+\.\d+$/.test(value as string)) value = parseFloat(value as string)
        else if (/^\[.*\]$/.test(value as string)) {
          // Simple array parsing
          try {
            value = JSON.parse(value as string)
          } catch {
            // Keep as string
          }
        }
        else if (/^".*"$/.test(value as string) || /^'.*'$/.test(value as string)) {
          value = (value as string).slice(1, -1)
        }

        frontmatter[key] = value
      }
    })

    return {
      frontmatter,
      body,
      content,
    }
  }

  return {
    frontmatter: {},
    body: content,
    content,
  }
}

/**
 * Serialize frontmatter and body back to markdown
 */
function serializeMarkdownWithFrontmatter(frontmatter: Frontmatter, body: string): string {
  const lines: string[] = ['---']

  Object.entries(frontmatter).forEach(([key, value]) => {
    if (value === null) {
      lines.push(`${key}: null`)
    } else if (value === true) {
      lines.push(`${key}: true`)
    } else if (value === false) {
      lines.push(`${key}: false`)
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`)
    } else if (Array.isArray(value)) {
      lines.push(`${key}: ${JSON.stringify(value)}`)
    } else if (typeof value === 'string' && (value.includes(':') || value.includes('#'))) {
      lines.push(`${key}: "${value}"`)
    } else {
      lines.push(`${key}: ${value}`)
    }
  })

  lines.push('---', '', body)
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Exports
// ─────────────────────────────────────────────────────────────────────────────

export type { HelloClawSDKInterface as HelloClawSDK } from './types'
