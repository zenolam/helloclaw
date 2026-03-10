/**
 * HelloClaw App Loader
 *
 * Handles loading, unloading, and lifecycle management of apps.
 * Inspired by Obsidian's plugin loading system.
 */

import type {
  AppManifest,
  InstalledApp,
  LoadedApp,
  HelloClawApp,
  HelloClawSDKInterface,
  AgentConfig,
  SkillConfig,
  CreateCronJobConfig,
  CreateAgentConfig,
  AgentInfo,
  CronJobInfo,
  ChatMessage,
  Attachment,
} from './types'
import { HelloClawSDKImpl } from './sdk'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global callbacks for SDK to communicate with main app
 */
interface GlobalCallbacks {
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

// ─────────────────────────────────────────────────────────────────────────────
// App Loader Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * App Loader
 *
 * Responsible for:
 * - Reading and validating manifests
 * - Loading app modules
 * - Creating SDK instances
 * - Managing app lifecycle
 * - Setting up Agent/Skill/CronJob from manifest
 */
export class AppLoader {
  private loadedApps: Map<string, LoadedApp> = new Map()
  private appFiles: Map<string, Record<string, string>> = new Map()

  // Global callbacks for SDK to communicate with main app
  private globalCallbacks: GlobalCallbacks

  constructor(callbacks?: GlobalCallbacks) {
    this.globalCallbacks = callbacks || {}
  }

  // ───────────────────────────────────────────────────────────────────────────
  // App Registration
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Register app files (for web mode)
   * In Electron mode, files would be read from disk
   */
  registerAppFiles(appId: string, files: Record<string, string>): void {
    this.appFiles.set(appId, files)
  }

  /**
   * Unregister app files
   */
  unregisterAppFiles(appId: string): void {
    this.appFiles.delete(appId)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Manifest Handling
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Validate app manifest
   */
  validateManifest(manifest: unknown): manifest is AppManifest {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be an object')
    }

    const m = manifest as Record<string, unknown>

    // Required fields
    if (typeof m.id !== 'string' || !m.id) {
      throw new Error('Manifest must have a valid "id" field')
    }
    if (typeof m.name !== 'string' || !m.name) {
      throw new Error('Manifest must have a valid "name" field')
    }
    if (typeof m.version !== 'string' || !m.version) {
      throw new Error('Manifest must have a valid "version" field')
    }
    if (typeof m.description !== 'string') {
      throw new Error('Manifest must have a "description" field')
    }
    if (typeof m.author !== 'string') {
      throw new Error('Manifest must have an "author" field')
    }
    if (typeof m.entry !== 'string' || !m.entry) {
      throw new Error('Manifest must have a valid "entry" field')
    }

    // Validate ID format (lowercase, alphanumeric, hyphens)
    if (!/^[a-z0-9-]+$/.test(m.id as string)) {
      throw new Error('App ID must be lowercase alphanumeric with hyphens only')
    }

    // Validate version format (semver-like)
    if (!/^\d+\.\d+\.\d+/.test(m.version as string)) {
      throw new Error('App version must follow semver format (e.g., 1.0.0)')
    }

    return true
  }

  /**
   * Parse and validate manifest from JSON string
   */
  parseManifest(json: string): AppManifest {
    let manifest: unknown
    try {
      manifest = JSON.parse(json)
    } catch {
      throw new Error('Invalid JSON in manifest file')
    }

    this.validateManifest(manifest)
    return manifest as AppManifest
  }

  // ───────────────────────────────────────────────────────────────────────────
  // App Loading
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Load an app
   *
   * This method:
   * 1. Reads the manifest
   * 2. Loads the app module
   * 3. Creates SDK instance
   * 4. Instantiates the app class
   * 5. Calls onload lifecycle
   * 6. Sets up Agent/Skill/CronJob if configured
   */
  async loadApp(installedApp: InstalledApp): Promise<LoadedApp> {
    const { id, manifest } = installedApp

    // Check if already loaded
    const existing = this.loadedApps.get(id)
    if (existing && existing.loadState === 'loaded') {
      return existing
    }

    // Create loading state entry
    const loadingApp: LoadedApp = {
      id,
      manifest,
      instance: null,
      sdk: null,
      loadState: 'loading',
    }
    this.loadedApps.set(id, loadingApp)

    try {
      // Get app files
      const files = this.appFiles.get(id) || {}

      // Get entry file content
      const entryContent = files[manifest.entry]
      if (!entryContent) {
        throw new Error(`Entry file not found: ${manifest.entry}`)
      }

      // Create SDK instance
      const sdk = new HelloClawSDKImpl(id, manifest, files, this.globalCallbacks)

      // Load app module
      const AppClass = await this.loadAppModule(entryContent)

      // Create app instance
      const instance = new AppClass(sdk) as HelloClawApp

      // Call onload lifecycle
      await instance.onload()

      // Setup Agent if configured
      if (manifest.agent) {
        await this.setupAgent(manifest.agent, files)
      }

      // Update to loaded state
      const loadedApp: LoadedApp = {
        id,
        manifest,
        instance,
        sdk,
        loadState: 'loaded',
      }
      this.loadedApps.set(id, loadedApp)

      console.log(`[AppLoader] App "${manifest.name}" (${id}) loaded successfully`)
      return loadedApp
    } catch (err) {
      // Update to error state
      const errorApp: LoadedApp = {
        id,
        manifest,
        instance: null,
        sdk: null,
        loadState: 'error',
        error: err instanceof Error ? err.message : 'Failed to load app',
      }
      this.loadedApps.set(id, errorApp)

      console.error(`[AppLoader] Failed to load app "${id}":`, err)
      return errorApp
    }
  }

  /**
   * Load app module from entry file content
   *
   * Uses Function constructor to create an isolated scope,
   * similar to how Obsidian loads plugins.
   */
  private async loadAppModule(entryContent: string): Promise<new (sdk: HelloClawSDKInterface) => HelloClawApp> {
    // Import HelloClawApp base class
    const { HelloClawApp } = await import('./types')

    // Create module factory
    // This creates an isolated scope with access to helloclaw SDK and HelloClawApp
    const moduleFactory = new Function(
      'helloclaw',
      'HelloClawApp',
      `
      const module = { exports: {} };
      const exports = module.exports;

      try {
        ${entryContent}
      } catch (err) {
        console.error('Error executing app module:', err);
        throw err;
      }

      // Support both CommonJS and ES module exports
      return module.exports.default || module.exports;
      `
    )

    // Execute module factory to get the app class
    const AppClass = moduleFactory(null, HelloClawApp)

    if (typeof AppClass !== 'function') {
      throw new Error('App must export a class as default export')
    }

    // Verify it extends HelloClawApp
    if (!(AppClass.prototype instanceof HelloClawApp)) {
      throw new Error('App class must extend HelloClawApp')
    }

    return AppClass as new (sdk: HelloClawSDKInterface) => HelloClawApp
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Agent Setup
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Setup Agent from manifest configuration
   *
   * Creates Agent, Skills, and CronJobs as defined in the manifest.
   */
  private async setupAgent(
    agentConfig: AgentConfig,
    files: Record<string, string>
  ): Promise<void> {
    console.log(`[AppLoader] Setting up agent: ${agentConfig.name}`)

    // 1. Read system prompt
    const systemPrompt = files[agentConfig.systemPrompt]
    if (!systemPrompt) {
      console.warn(`[AppLoader] System prompt file not found: ${agentConfig.systemPrompt}`)
    }

    // 2. Create Agent (via global callback if available)
    if (this.globalCallbacks.createAgent) {
      try {
        await this.globalCallbacks.createAgent({
          id: agentConfig.id,
          name: agentConfig.name,
          systemPrompt: systemPrompt || '',
        })
        console.log(`[AppLoader] Agent "${agentConfig.name}" created`)
      } catch (err) {
        console.error(`[AppLoader] Failed to create agent:`, err)
      }
    }

    // 3. Create Skills
    if (agentConfig.skills && this.globalCallbacks.createSkill) {
      for (const skillPattern of agentConfig.skills) {
        const skillFiles = this.findMatchingFiles(files, skillPattern)
        for (const skillPath of skillFiles) {
          try {
            const skillContent = files[skillPath]
            const skill = this.parseSkillFile(skillContent)
            if (skill) {
              await this.globalCallbacks.createSkill(agentConfig.id, skill)
              console.log(`[AppLoader] Skill "${skill.name}" created`)
            }
          } catch (err) {
            console.error(`[AppLoader] Failed to create skill from ${skillPath}:`, err)
          }
        }
      }
    }

    // 4. Create CronJobs
    if (agentConfig.cronjobs && this.globalCallbacks.addCronJob) {
      for (const cronPattern of agentConfig.cronjobs) {
        const cronFiles = this.findMatchingFiles(files, cronPattern)
        for (const cronPath of cronFiles) {
          try {
            const cronContent = files[cronPath]
            const cronConfig = this.parseCronFile(cronContent)
            if (cronConfig) {
              await this.globalCallbacks.addCronJob({
                ...cronConfig,
                agentId: agentConfig.id,
              })
              console.log(`[AppLoader] CronJob "${cronConfig.name}" created`)
            }
          } catch (err) {
            console.error(`[AppLoader] Failed to create cron job from ${cronPath}:`, err)
          }
        }
      }
    }
  }

  /**
   * Find files matching a glob pattern
   * Supports simple patterns like "skills/*.md"
   */
  private findMatchingFiles(files: Record<string, string>, pattern: string): string[] {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    const regex = new RegExp(`^${regexPattern}$`)
    return Object.keys(files).filter((path) => regex.test(path))
  }

  /**
   * Parse skill file content
   *
   * Skill files use Markdown format with frontmatter:
   * ```markdown
   * ---
   * name: Publish Article
   * description: Publish article to platforms
   * trigger: publish_article
   * ---
   *
   * ## Description
   * Detailed skill description...
   * ```
   */
  private parseSkillFile(content: string): SkillConfig | null {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
    const match = content.match(frontmatterRegex)

    if (!match) {
      return null
    }

    const frontmatterStr = match[1]
    const body = match[2].trim()

    // Parse frontmatter
    const frontmatter: Record<string, string> = {}
    frontmatterStr.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        frontmatter[key] = value
      }
    })

    return {
      name: frontmatter.name || 'Unnamed Skill',
      description: frontmatter.description || '',
      trigger: frontmatter.trigger || '',
      content: body,
    }
  }

  /**
   * Parse cron file content
   *
   * Cron files use JSON format:
   * ```json
   * {
   *   "name": "Weekly Report",
   *   "schedule": { "kind": "cron", "expr": "0 9 * * 1" },
   *   "payload": { "kind": "agentTurn", "message": "Generate weekly report" }
   * }
   * ```
   */
  private parseCronFile(content: string): Omit<CreateCronJobConfig, 'agentId'> | null {
    try {
      const config = JSON.parse(content)
      return {
        name: config.name || 'Unnamed Job',
        schedule: config.schedule,
        payload: config.payload,
        enabled: config.enabled ?? true,
      }
    } catch {
      console.error('[AppLoader] Failed to parse cron file as JSON')
      return null
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // App Unloading
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Unload an app
   *
   * Calls onunload lifecycle and cleans up resources.
   */
  async unloadApp(appId: string): Promise<void> {
    const loaded = this.loadedApps.get(appId)
    if (!loaded || loaded.loadState !== 'loaded') {
      return
    }

    console.log(`[AppLoader] Unloading app "${appId}"...`)

    try {
      // Call onunload lifecycle
      if (loaded.instance?.onunload) {
        await loaded.instance.onunload()
      }

      // Destroy SDK
      if (loaded.sdk) {
        (loaded.sdk as HelloClawSDKImpl).destroy()
      }

      // Remove from loaded apps
      this.loadedApps.delete(appId)

      console.log(`[AppLoader] App "${appId}" unloaded successfully`)
    } catch (err) {
      console.error(`[AppLoader] Error unloading app "${appId}":`, err)
      // Still remove from loaded apps even on error
      this.loadedApps.delete(appId)
    }
  }

  /**
   * Unload all apps
   */
  async unloadAll(): Promise<void> {
    const unloadPromises = Array.from(this.loadedApps.keys()).map((id) => this.unloadApp(id))
    await Promise.all(unloadPromises)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Getters
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get loaded app by ID
   */
  getLoadedApp(appId: string): LoadedApp | undefined {
    return this.loadedApps.get(appId)
  }

  /**
   * Get all loaded apps
   */
  getAllLoadedApps(): LoadedApp[] {
    return Array.from(this.loadedApps.values())
  }

  /**
   * Check if app is loaded
   */
  isAppLoaded(appId: string): boolean {
    const app = this.loadedApps.get(appId)
    return app?.loadState === 'loaded'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────────

let loaderInstance: AppLoader | null = null

/**
 * Get the global app loader instance
 */
export function getAppLoader(callbacks?: ConstructorParameters<typeof HelloClawSDKImpl>[2]): AppLoader {
  if (!loaderInstance) {
    loaderInstance = new AppLoader(callbacks)
  }
  return loaderInstance
}

/**
 * Reset the global app loader (for testing)
 */
export function resetAppLoader(): void {
  if (loaderInstance) {
    loaderInstance.unloadAll()
    loaderInstance = null
  }
}
