/**
 * HelloClaw App Center Type Definitions
 *
 * This module defines all types for the application center system,
 * inspired by Obsidian's plugin architecture.
 */

// ─────────────────────────────────────────────────────────────────────────────
// i18n Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Localized string type for i18n support
 *
 * Can be a simple string (used as default) or an object with locale keys.
 *
 * @example
 * // Simple string (backward compatible)
 * name: "My App"
 *
 * @example
 * // With i18n support
 * name: {
 *   default: "My App",
 *   "zh-CN": "我的应用",
 *   "zh-TW": "我的應用",
 *   "ja": "マイアプリ"
 * }
 */
export type LocalizedString = string | {
  /** Default value when locale not matched */
  default: string
  /** Locale-specific values (e.g., "zh-CN", "en-US", "ja") */
  [locale: string]: string | undefined
}

/**
 * Resolve a localized string for a given locale
 *
 * Resolution order:
 * 1. If string, return as-is
 * 2. Try exact locale match (e.g., "zh-CN")
 * 3. Try language prefix match (e.g., "zh" for "zh-CN")
 * 4. Fallback to default
 *
 * @param value Localized string value
 * @param locale Target locale (e.g., "zh-CN", "en-US")
 * @returns Resolved string
 */
export function resolveLocalizedString(value: LocalizedString, locale: string): string {
  if (typeof value === 'string') {
    return value
  }
  // Try exact locale match (e.g., "zh-CN")
  if (value[locale]) {
    return value[locale] as string
  }
  // Try language prefix match (e.g., "zh" for "zh-CN")
  const lang = locale.split('-')[0]
  if (value[lang]) {
    return value[lang] as string
  }
  // Fallback to default
  return value.default
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sidebar configuration in manifest
 */
export interface SidebarConfig {
  /** Whether to show in sidebar */
  show: boolean
  /** Lucide icon name */
  icon: string
  /** Display label (supports i18n) */
  label: LocalizedString
}

/**
 * OpenClaw bootstrap file names supported by agent workspaces
 */
export type BootstrapFileName =
  | 'AGENTS.md'
  | 'SOUL.md'
  | 'TOOLS.md'
  | 'IDENTITY.md'
  | 'USER.md'
  | 'HEARTBEAT.md'
  | 'BOOTSTRAP.md'
  | 'MEMORY.md'
  | 'memory.md'

/**
 * OpenClaw bootstrap file contents keyed by filename
 */
export type BootstrapFiles = Partial<Record<BootstrapFileName, string>>

/**
 * Agent configuration in manifest
 */
export interface AgentConfig {
  /** Unique agent ID */
  id: string
  /** Display name */
  name: string
  /** Bootstrap files like SOUL.md and AGENTS.md are synced from the app root */
  /** Glob patterns for skill files */
  skills?: string[]
  /** Glob patterns for cronjob files */
  cronjobs?: string[]
}

/**
 * Application category
 */
export type AppCategory =
  | 'productivity'
  | 'communication'
  | 'development'
  | 'entertainment'
  | 'utilities'
  | 'other'

/**
 * Application manifest (manifest.json)
 *
 * This is the core configuration file for each app.
 * All fields are designed to be simple and extensible.
 */
export interface AppManifest {
  /** Unique app ID (e.g., "helloclaw-social-media") */
  id: string
  /** Display name */
  name: string
  /** Semantic version */
  version: string
  /** Short description */
  description: string
  /** Author name or organization */
  author: string
  /** Minimum HelloClaw version required */
  minAppVersion: string
  /** App icon file path */
  icon?: string
  /** Category for organization */
  category: AppCategory
  /** Homepage or repository URL */
  homepage?: string
  /** Repository URL for updates */
  repository?: string

  /** Sidebar configuration */
  sidebar?: SidebarConfig

  /** Agent configuration */
  agent?: AgentConfig

  /** Entry file (compiled JavaScript) */
  entry: string

  /** Optional stylesheet */
  style?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// App Lifecycle Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * App lifecycle state
 *
 * The app goes through three main states:
 * 1. remote - App exists in marketplace, not downloaded
 * 2. downloaded - App downloaded to local filesystem (apps/{appId}/{version}/)
 * 3. instantiated - App instantiated with Agent, Skills, and CronJobs
 */
export type AppLifecycleState =
  | 'remote'        // Not downloaded (in marketplace)
  | 'downloaded'    // Downloaded to local
  | 'instantiated'  // Instantiated with Agent
  | 'running'       // Currently running

// ─────────────────────────────────────────────────────────────────────────────
// Downloaded App Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Downloaded app record (stored in database)
 *
 * Apps are stored in a versioned structure: apps/{appId}/{version}/*
 */
export interface DownloadedApp {
  /** App ID */
  id: string
  /** Parsed manifest (from current version) */
  manifest: AppManifest
  /** Available versions */
  versions: string[]
  /** Currently active version */
  currentVersion: string
  /** Download timestamp */
  downloadedAt: number
  /** Local storage path (apps/{appId}/) */
  path: string
}

/**
 * Installed app record (legacy, for backward compatibility)
 * @deprecated Use DownloadedApp instead
 */
export interface InstalledApp {
  /** App ID */
  id: string
  /** Parsed manifest */
  manifest: AppManifest
  /** Installation timestamp */
  installedAt: number
  /** Whether the app is enabled */
  enabled: boolean
  /** Local installation path */
  installPath: string
}

// ─────────────────────────────────────────────────────────────────────────────
// App Instance Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * App instance (instantiated app with Agent)
 *
 * After instantiation:
 * - Page files are copied to appInstances/{instanceId}/
 * - Agent is created in OpenClaw with name: {appName}-{agentName}-{sequence}
 * - Skills are installed to Agent's workspace
 * - CronJobs are registered
 * - Sidebar tab is added with label: {appName}-{sequence}
 */
export interface AppInstance {
  /** Unique instance ID (e.g., "social-media-1") */
  id: string
  /** Parent app ID */
  appId: string
  /** App version used */
  appVersion: string
  /** Associated Agent ID in OpenClaw */
  agentId: string
  /** Display name in sidebar ({appName}-{sequence}) */
  displayName: string
  /** Sequence number for this app */
  sequence: number
  /** Creation timestamp */
  createdAt: number
  /** Whether instance is enabled */
  enabled: boolean
  /** Data storage path (appInstances/{instanceId}/) */
  dataPath: string
}

/**
 * Configuration for instantiating an app
 */
export interface InstantiateConfig {
  /** App ID to instantiate */
  appId: string
  /** Specific version (defaults to current version) */
  version?: string
  /** Custom display name (defaults to {appName}-{sequence}) */
  displayName?: string
  /** Agent configuration overrides */
  agentConfig?: {
    /** Override agent name */
    name?: string
    /** Override bootstrap file contents */
    bootstrapFiles?: BootstrapFiles
    /** Additional skills to install */
    additionalSkills?: string[]
  }
}

/**
 * Result of instantiation operation
 */
export interface InstantiateResult {
  success: boolean
  instance?: AppInstance
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Local App Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Local app discovered from apps/ directory (bundled with application)
 */
export interface LocalApp {
  /** App ID */
  id: string
  /** Parsed manifest */
  manifest: AppManifest
  /** Absolute path to app directory */
  path: string
  /** App version */
  version: string
  /** App files content (keyed by relative path) */
  files: Record<string, string>
  /** Marker for local apps */
  isLocal: true
}

// ─────────────────────────────────────────────────────────────────────────────
// Loaded App Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * App loading state
 */
export type AppLoadState =
  | 'unloaded'    // Not loaded yet
  | 'loading'     // Currently loading
  | 'loaded'      // Successfully loaded
  | 'error'       // Failed to load
  | 'unloading'   // Currently unloading

/**
 * Loaded app instance (runtime state)
 */
export interface LoadedApp {
  /** App ID */
  id: string
  /** Parsed manifest */
  manifest: AppManifest
  /** App class instance */
  instance: HelloClawApp | null
  /** SDK instance */
  sdk: HelloClawSDK | null
  /** Current load state */
  loadState: AppLoadState
  /** Error message if load failed */
  error?: string
  /** Associated app instance ID (if instantiated) */
  appInstanceId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * View configuration for UI API
 */
export interface ViewConfig {
  /** Unique view ID */
  id: string
  /** Render function */
  render: (container: HTMLElement) => void
  /** Optional destroy function */
  destroy?: () => void
}

/**
 * Modal configuration for UI API
 */
export interface ModalConfig {
  /** Modal title */
  title: string
  /** HTML content */
  content: string
  /** Confirm button text */
  confirmText?: string
  /** Cancel button text */
  cancelText?: string
  /** Confirm callback */
  onConfirm?: () => void | Promise<void>
  /** Cancel callback */
  onCancel?: () => void
}

/**
 * Notice type
 */
export type NoticeType = 'info' | 'success' | 'error' | 'warning'

/**
 * Command configuration
 */
export interface CommandConfig {
  /** Unique command ID */
  id: string
  /** Display name */
  name: string
  /** Callback function */
  callback: () => void | Promise<void>
}

/**
 * View interface
 */
export interface View {
  /** View ID */
  id: string
  /** Container element */
  container: HTMLElement
  /** Destroy the view */
  destroy: () => void
}

/**
 * File entry for storage API
 */
export interface StorageEntry {
  /** File path */
  path: string
  /** Whether it's a directory */
  isDirectory: boolean
  /** File size in bytes */
  size?: number
  /** Last modified timestamp */
  modifiedAt?: number
}

/**
 * Frontmatter metadata from MD file
 */
export type Frontmatter = Record<string, unknown>

/**
 * Parsed markdown file
 */
export interface ParsedMarkdown {
  /** Frontmatter metadata */
  frontmatter: Frontmatter
  /** Body content (without frontmatter) */
  body: string
  /** Full content */
  content: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK API Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chat API interface
 *
 * Provides access to chat functionality including sending messages,
 * aborting runs, and listening for new messages.
 */
export interface ChatAPI {
  /**
   * Send a text message
   * @param text Message text
   * @param attachments Optional attachments
   * @returns Promise resolving to message ID
   */
  send(text: string, attachments?: Attachment[]): Promise<string>

  /**
   * Abort the current chat run
   */
  abort(): Promise<void>

  /**
   * Listen for new messages
   * @param callback Message callback
   * @returns Unsubscribe function
   */
  onMessage(callback: (msg: ChatMessage) => void): () => void
}

/**
 * Attachment for chat messages
 */
export interface Attachment {
  mimeType: string
  content: string
  name?: string
}

/**
 * Chat message type for SDK
 */
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'tool'
  content?: string
  text?: string
  ts?: number
}

/**
 * Agents API interface
 *
 * Provides access to agent management including listing, creating,
 * and managing agent skills.
 */
export interface AgentsAPI {
  /**
   * List all agents
   */
  list(): Promise<AgentInfo[]>

  /**
   * Get a specific agent by ID
   */
  get(id: string): Promise<AgentInfo | null>

  /**
   * Create a new agent
   * @deprecated Agent creation should be done through manifest configuration
   */
  create(config: CreateAgentConfig): Promise<AgentInfo>

  /**
   * Create a skill for an agent
   */
  createSkill(agentId: string, skill: SkillConfig, options?: CreateSkillOptions): Promise<void>
}

/**
 * Agent information
 */
export interface AgentInfo {
  id: string
  name: string
  description?: string
  status?: 'active' | 'idle' | 'error'
  model?: string
}

/**
 * Agent creation config
 */
export interface CreateAgentConfig {
  id: string
  name: string
  bootstrapFiles?: BootstrapFiles
  description?: string
}

/**
 * Skill configuration
 */
export interface SkillConfig {
  /** Directory slug under skills/<slug>/SKILL.md */
  slug: string
  /** Parsed skill name from SKILL.md frontmatter, if available */
  name?: string
  /** Parsed skill description from SKILL.md frontmatter, if available */
  description?: string
  /** Raw OpenClaw-compatible SKILL.md content */
  content: string
  /** Additional files inside the skill directory */
  files?: Record<string, string>
}

export interface CreateSkillOptions {
  /** Agent workspace path, when known by the caller */
  workspace?: string
}

/**
 * Remote skill definition from skills/remote.json
 */
export interface RemoteSkillDefinition {
  /** Skill slug; inferred from url when omitted */
  slug?: string
  /** Direct URL to SKILL.md */
  url?: string
  /** Optional extra files to download into the skill directory */
  files?: Record<string, string>
}

/**
 * Cron API interface
 *
 * Provides access to scheduled job management.
 */
export interface CronAPI {
  /**
   * List all cron jobs
   */
  list(): Promise<CronJobInfo[]>

  /**
   * Add a new cron job
   */
  add(job: CreateCronJobConfig): Promise<CronJobInfo>

  /**
   * Remove a cron job
   */
  remove(id: string): Promise<void>

  /**
   * Enable/disable a cron job
   */
  setEnabled(id: string, enabled: boolean): Promise<void>
}

/**
 * Cron job information
 */
export interface CronJobInfo {
  id: string
  name: string
  description?: string
  enabled: boolean
  schedule: CronSchedule
  agentId?: string
  state?: {
    lastRunAt?: number
    nextRunAt?: number
    runCount?: number
    lastStatus?: 'ok' | 'error' | 'skipped'
  }
}

/**
 * Cron schedule configuration
 */
export type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number }
  | { kind: 'cron'; expr: string; tz?: string }

/**
 * Cron job creation config
 */
export interface CreateCronJobConfig {
  name: string
  agentId?: string
  schedule: CronSchedule
  payload: CronPayload
  enabled?: boolean
}

/**
 * Cron payload configuration
 */
export type CronPayload =
  | { kind: 'systemEvent'; text: string }
  | { kind: 'agentTurn'; message: string; model?: string }

/**
 * Storage API interface
 *
 * Provides file storage for app data using Markdown format.
 * Files are stored in the app's data directory.
 */
export interface StorageAPI {
  /**
   * Read file content
   * @param path Relative path from app data directory
   */
  read(path: string): Promise<string>

  /**
   * Write file content
   * @param path Relative path from app data directory
   * @param content File content
   */
  write(path: string, content: string): Promise<void>

  /**
   * Delete a file
   * @param path Relative path from app data directory
   */
  delete(path: string): Promise<void>

  /**
   * List files in a directory
   * @param dir Directory path (relative to app data directory)
   */
  list(dir: string): Promise<StorageEntry[]>

  /**
   * Check if file exists
   * @param path Relative path from app data directory
   */
  exists(path: string): Promise<boolean>

  /**
   * Read and parse frontmatter from MD file
   * @param path Relative path from app data directory
   */
  readFrontmatter(path: string): Promise<Frontmatter>

  /**
   * Update frontmatter in MD file
   * @param path Relative path from app data directory
   * @param fm Frontmatter object to merge
   */
  writeFrontmatter(path: string, fm: Frontmatter): Promise<void>

  /**
   * Parse a markdown file into frontmatter and body
   * @param path Relative path from app data directory
   */
  parseMarkdown(path: string): Promise<ParsedMarkdown>
}

/**
 * UI API interface
 *
 * Provides UI manipulation capabilities including notices,
 * modals, and sidebar badges.
 */
export interface UIAPI {
  /**
   * Show a notice message
   */
  showNotice(message: string, type?: NoticeType): void

  /**
   * Show a modal dialog
   */
  showModal(config: ModalConfig): void

  /**
   * Set badge count on sidebar icon
   */
  setSidebarBadge(count: number): void

  /**
   * Create a custom view
   */
  createView(config: ViewConfig): View

  /**
   * Get the active view
   */
  getActiveView(): View | null
}

/**
 * Workspace API interface
 *
 * Provides workspace and command management.
 */
export interface WorkspaceAPI {
  /**
   * Register a command
   */
  registerCommand(config: CommandConfig): () => void

  /**
   * Execute a command by ID
   */
  executeCommand(id: string): void

  /**
   * Open a specific view
   */
  openView(viewId: string): void

  /**
   * Get the currently active view
   */
  getActiveView(): View | null

  /**
   * Listen for layout changes
   */
  onLayoutChange(callback: () => void): () => void
}

/**
 * Event types for SDK
 */
export interface SDKEventMap {
  'chat:message': ChatMessage
  'chat:aborted': { runId: string }
  'agent:created': AgentInfo
  'agent:deleted': { id: string }
  'cron:triggered': CronJobInfo
  'view:activated': View
  'view:deactivated': View
  'layout:changed': void
}

// ─────────────────────────────────────────────────────────────────────────────
// HelloClawSDK Class Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HelloClaw SDK
 *
 * Main API interface for apps, similar to Obsidian's this.app.
 * All capabilities are accessed through this object.
 */
export interface HelloClawSDKInterface {
  /** App ID */
  readonly appId: string

  /** App manifest */
  readonly manifest: AppManifest

  /** Chat API */
  readonly chat: ChatAPI

  /** Agents API */
  readonly agents: AgentsAPI

  /** Cron API */
  readonly cron: CronAPI

  /** Storage API */
  readonly storage: StorageAPI

  /** UI API */
  readonly ui: UIAPI

  /** Workspace API */
  readonly workspace: WorkspaceAPI

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Event callback
   * @returns Unsubscribe function
   */
  on<K extends keyof SDKEventMap>(
    event: K,
    callback: (data: SDKEventMap[K]) => void
  ): () => void

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  emit<K extends keyof SDKEventMap>(
    event: K,
    data: SDKEventMap[K]
  ): void
}

// Re-export SDK as both interface and type
export type HelloClawSDK = HelloClawSDKInterface

// ─────────────────────────────────────────────────────────────────────────────
// App Base Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HelloClaw App Base Class
 *
 * All apps must extend this class. Provides lifecycle hooks
 * and access to the SDK.
 *
 * @example
 * ```typescript
 * import { HelloClawApp, HelloClawSDK } from 'helloclaw-app'
 *
 * export default class MyApp extends HelloClawApp {
 *   async onload() {
 *     console.log('App loaded!')
 *     this.helloclaw.ui.showNotice('Hello!', 'success')
 *   }
 *
 *   onunload() {
 *     console.log('App unloaded!')
 *   }
 * }
 * ```
 */
export abstract class HelloClawApp {
  /**
   * SDK instance
   *
   * Access all HelloClaw capabilities through this object.
   */
  protected readonly helloclaw: HelloClawSDK

  constructor(sdk: HelloClawSDK) {
    this.helloclaw = sdk
  }

  /**
   * Called when the app is loaded.
   *
   * Use this to:
   * - Register views and commands
   * - Set up event listeners
   * - Initialize UI components
   */
  abstract onload(): Promise<void> | void

  /**
   * Called when the app is unloaded.
   *
   * Use this to:
   * - Clean up resources
   * - Remove event listeners
   * - Save state
   */
  onunload(): Promise<void> | void {}

  /**
   * Called to render settings panel.
   *
   * Override this to provide app-specific settings UI.
   * @param container Container element to render into
   */
  onSettingsRender?(container: HTMLElement): void
}

// ─────────────────────────────────────────────────────────────────────────────
// App Market Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * App market entry (for browsing available apps)
 */
export interface AppMarketEntry {
  /** App ID */
  id: string
  /** App name */
  name: string
  /** Short description */
  description: string
  /** Author name */
  author: string
  /** Version */
  version: string
  /** Category */
  category: AppCategory
  /** Download URL (ZIP file) */
  downloadUrl: string
  /** Icon URL */
  iconUrl?: string
  /** Homepage URL */
  homepage?: string
  /** Repository URL */
  repository?: string
  /** Download count */
  downloads?: number
  /** Rating (0-5) */
  rating?: number
  /** Whether this app is already installed */
  installed?: boolean
}

/**
 * App installation result
 * @deprecated Use DownloadResult instead
 */
export interface InstallResult {
  success: boolean
  app?: InstalledApp
  error?: string
}

/**
 * App download result
 */
export interface DownloadResult {
  success: boolean
  app?: DownloadedApp
  error?: string
}

/**
 * App uninstallation result
 */
export interface UninstallResult {
  success: boolean
  error?: string
}
