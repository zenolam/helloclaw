/**
 * HelloClaw App Loader
 *
 * Handles loading, unloading, and lifecycle management of apps.
 * Supports app lifecycle: Remote -> Downloaded -> Instantiated -> Running
 *
 * Inspired by Obsidian's plugin loading system.
 */

import type {
  AppManifest,
  InstalledApp,
  DownloadedApp,
  AppInstance,
  InstantiateConfig,
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
import { collectAppBootstrapFiles } from './bootstrap'
import { loadRemoteAppSkills, parseAppSkillFile } from './skills'

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
   * Load an app instance
   *
   * This loads an instantiated app, setting up its Agent, Skills, and CronJobs.
   */
  async loadAppInstance(
    appInstance: AppInstance,
    downloadedApp: DownloadedApp,
    files: Record<string, string>
  ): Promise<LoadedApp> {
    const instanceId = appInstance.id
    const manifest = downloadedApp.manifest

    // Check if already loaded
    const existing = this.loadedApps.get(instanceId)
    if (existing && existing.loadState === 'loaded') {
      return existing
    }

    // Create loading state entry
    const loadingApp: LoadedApp = {
      id: instanceId,
      manifest,
      instance: null,
      sdk: null,
      loadState: 'loading',
      appInstanceId: instanceId,
    }
    this.loadedApps.set(instanceId, loadingApp)

    try {
      // Get entry file content
      const entryContent = files[manifest.entry]
      if (!entryContent) {
        throw new Error(`Entry file not found: ${manifest.entry}`)
      }

      // Create SDK instance with the instance ID
      const sdk = new HelloClawSDKImpl(instanceId, manifest, files, this.globalCallbacks)

      // Load app module
      const AppClass = await this.loadAppModule(entryContent)

      // Create app instance
      const appClassInstance = new AppClass(sdk) as HelloClawApp

      // Call onload lifecycle
      await appClassInstance.onload()

      // Setup Agent if configured (use instance-specific agent ID)
      if (manifest.agent) {
        await this.setupInstanceAgent(appInstance, manifest.agent, files)
      }

      // Update to loaded state
      const loadedApp: LoadedApp = {
        id: instanceId,
        manifest,
        instance: appClassInstance,
        sdk,
        loadState: 'loaded',
        appInstanceId: instanceId,
      }
      this.loadedApps.set(instanceId, loadedApp)

      console.log(`[AppLoader] App instance "${appInstance.displayName}" (${instanceId}) loaded successfully`)
      return loadedApp
    } catch (err) {
      // Update to error state
      const errorApp: LoadedApp = {
        id: instanceId,
        manifest,
        instance: null,
        sdk: null,
        loadState: 'error',
        error: err instanceof Error ? err.message : 'Failed to load app instance',
        appInstanceId: instanceId,
      }
      this.loadedApps.set(instanceId, errorApp)

      console.error(`[AppLoader] Failed to load app instance "${instanceId}":`, err)
      return errorApp
    }
  }

  /**
   * Setup Agent for an app instance
   *
   * Creates Agent with instance-specific ID, installs Skills, and registers CronJobs.
   */
  private async setupInstanceAgent(
    appInstance: AppInstance,
    agentConfig: AgentConfig,
    files: Record<string, string>
  ): Promise<void> {
    console.log(`[AppLoader] Setting up agent for instance: ${appInstance.displayName}`)

    // Use the instance-specific agent ID
    const instanceAgentId = appInstance.agentId

    // 1. Collect OpenClaw bootstrap files from the app root
    const bootstrapFiles = collectAppBootstrapFiles(files)
    if (Object.keys(bootstrapFiles).length === 0) {
      console.warn('[AppLoader] No OpenClaw bootstrap files found. Add SOUL.md and/or AGENTS.md to the app root.')
    }

    // 2. Create Agent with instance-specific ID (via global callback if available)
    if (this.globalCallbacks.createAgent) {
      try {
        await this.globalCallbacks.createAgent({
          id: instanceAgentId,
          name: `${appInstance.displayName} Agent`,
          bootstrapFiles,
        })
        console.log(`[AppLoader] Agent "${instanceAgentId}" created for instance "${appInstance.displayName}"`)
      } catch (err) {
        console.error(`[AppLoader] Failed to create agent:`, err)
      }
    }

    // 3. Create Skills
    if (this.globalCallbacks.createSkill) {
      for (const skill of await this.collectSkills(files, agentConfig.skills)) {
        try {
          await this.globalCallbacks.createSkill(instanceAgentId, skill)
          console.log(`[AppLoader] Skill "${skill.name || skill.slug}" created for agent "${instanceAgentId}"`)
        } catch (err) {
          console.error(`[AppLoader] Failed to create skill "${skill.slug}":`, err)
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
                agentId: instanceAgentId,
              })
              console.log(`[AppLoader] CronJob "${cronConfig.name}" created for agent "${instanceAgentId}"`)
            }
          } catch (err) {
            console.error(`[AppLoader] Failed to create cron job from ${cronPath}:`, err)
          }
        }
      }
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

    // 1. Collect OpenClaw bootstrap files from the app root
    const bootstrapFiles = collectAppBootstrapFiles(files)
    if (Object.keys(bootstrapFiles).length === 0) {
      console.warn('[AppLoader] No OpenClaw bootstrap files found. Add SOUL.md and/or AGENTS.md to the app root.')
    }

    // 2. Create Agent (via global callback if available)
    if (this.globalCallbacks.createAgent) {
      try {
        await this.globalCallbacks.createAgent({
          id: agentConfig.id,
          name: agentConfig.name,
          bootstrapFiles,
        })
        console.log(`[AppLoader] Agent "${agentConfig.name}" created`)
      } catch (err) {
        console.error(`[AppLoader] Failed to create agent:`, err)
      }
    }

    // 3. Create Skills
    if (this.globalCallbacks.createSkill) {
      for (const skill of await this.collectSkills(files, agentConfig.skills)) {
        try {
          await this.globalCallbacks.createSkill(agentConfig.id, skill)
          console.log(`[AppLoader] Skill "${skill.name || skill.slug}" created`)
        } catch (err) {
          console.error(`[AppLoader] Failed to create skill "${skill.slug}":`, err)
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
   * Supports simple patterns like "skills/<skill>/SKILL.md"
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

  private async collectSkills(
    files: Record<string, string>,
    patterns?: string[]
  ): Promise<SkillConfig[]> {
    const skillMap = new Map<string, SkillConfig>()

    for (const pattern of patterns || []) {
      const skillFiles = this.findMatchingFiles(files, pattern)
      for (const skillPath of skillFiles) {
        const skill = parseAppSkillFile(skillPath, files)
        if (skill) {
          skillMap.set(skill.slug, skill)
        }
      }
    }

    for (const remoteSkill of await loadRemoteAppSkills(files)) {
      skillMap.set(remoteSkill.slug, remoteSkill)
    }

    return Array.from(skillMap.values())
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
