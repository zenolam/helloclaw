/**
 * HelloClaw App Store
 *
 * Manages app installation state and provides hooks for React components.
 * Supports both Electron (SQLite) and Web (localStorage) storage.
 *
 * App Lifecycle:
 * 1. Remote - App exists in marketplace
 * 2. Downloaded - App downloaded to apps/{appId}/{version}/
 * 3. Instantiated - App instantiated with Agent, Skills, and CronJobs
 */

import { useState, useEffect, useCallback } from 'react'
import { GatewayRequestError } from '@/lib/gateway'
import { translate } from '@/i18n'
import type {
  AppManifest,
  InstalledApp,
  DownloadedApp,
  AppInstance,
  InstantiateConfig,
  InstantiateResult,
  LoadedApp,
  AppLoadState,
  InstallResult,
  DownloadResult,
  UninstallResult,
  AppMarketEntry,
  LocalApp,
  BootstrapFiles,
  SkillConfig,
} from './types'
import { collectAppBootstrapFiles } from './bootstrap'
import { loadRemoteAppSkills, parseAppSkillFile } from './skills'

// ─────────────────────────────────────────────────────────────────────────────
// Storage Interface
// ─────────────────────────────────────────────────────────────────────────────

interface AppsStorage {
  // Downloaded apps
  listDownloaded(): Promise<DownloadedApp[]>
  getDownloaded(id: string): Promise<DownloadedApp | null>
  addDownloaded(app: DownloadedApp): Promise<void>
  updateDownloaded(id: string, updates: Partial<DownloadedApp>): Promise<void>
  removeDownloaded(id: string): Promise<void>
  getAppFiles(appId: string, version: string): Promise<Record<string, string>>
  setAppFiles(appId: string, version: string, files: Record<string, string>): Promise<void>
  removeAppFiles(appId: string, version?: string): Promise<void>

  // App instances
  listInstances(appId?: string): Promise<AppInstance[]>
  getInstance(id: string): Promise<AppInstance | null>
  addInstance(instance: AppInstance): Promise<void>
  updateInstance(id: string, updates: Partial<AppInstance>): Promise<void>
  removeInstance(id: string): Promise<void>
  getNextSequence(appId: string): Promise<number>

  // Local apps (bundled)
  scanLocal?(): Promise<LocalApp[]>

  // Legacy support
  list(): Promise<InstalledApp[]>
  get(id: string): Promise<InstalledApp | null>
  add(app: InstalledApp): Promise<void>
  update(id: string, updates: Partial<InstalledApp>): Promise<void>
  remove(id: string): Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Electron Storage Implementation
// ─────────────────────────────────────────────────────────────────────────────

interface DownloadedAppRow {
  id: string
  manifest: string
  versions: string
  current_version: string
  downloaded_at: number
  path: string
}

interface AppInstanceRow {
  id: string
  app_id: string
  app_version: string
  agent_id: string
  display_name: string
  sequence: number
  created_at: number
  enabled: number
  data_path: string
}

interface AppRow {
  id: string
  manifest: string
  installed_at: number
  enabled: number
  install_path: string
}

class ElectronAppsStorage implements AppsStorage {
  private get api() {
    if (!window.electronAPI) {
      throw new Error(translate('appStore.error.electronApiUnavailable'))
    }
    return window.electronAPI
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Downloaded Apps
  // ───────────────────────────────────────────────────────────────────────────

  async listDownloaded(): Promise<DownloadedApp[]> {
    const rows = (await this.api.invoke('apps:listDownloaded')) as DownloadedAppRow[]
    return rows.map(this.rowToDownloadedApp)
  }

  async getDownloaded(id: string): Promise<DownloadedApp | null> {
    const row = (await this.api.invoke('apps:getDownloaded', id)) as DownloadedAppRow | null
    return row ? this.rowToDownloadedApp(row) : null
  }

  async addDownloaded(app: DownloadedApp): Promise<void> {
    await this.api.invoke('apps:addDownloaded', {
      id: app.id,
      manifest: JSON.stringify(app.manifest),
      versions: JSON.stringify(app.versions),
      current_version: app.currentVersion,
      downloaded_at: app.downloadedAt,
      path: app.path,
    })
  }

  async updateDownloaded(id: string, updates: Partial<DownloadedApp>): Promise<void> {
    const fields: Record<string, unknown> = {}

    if (updates.manifest !== undefined) {
      fields.manifest = JSON.stringify(updates.manifest)
    }
    if (updates.versions !== undefined) {
      fields.versions = JSON.stringify(updates.versions)
    }
    if (updates.currentVersion !== undefined) {
      fields.current_version = updates.currentVersion
    }
    if (updates.downloadedAt !== undefined) {
      fields.downloaded_at = updates.downloadedAt
    }
    if (updates.path !== undefined) {
      fields.path = updates.path
    }

    await this.api.invoke('apps:updateDownloaded', id, fields)
  }

  async removeDownloaded(id: string): Promise<void> {
    await this.api.invoke('apps:removeDownloaded', id)
  }

  async getAppFiles(appId: string, version: string): Promise<Record<string, string>> {
    const files = await this.api.invoke('apps:getFiles', appId, version)
    return files && typeof files === 'object' ? files as Record<string, string> : {}
  }

  async setAppFiles(appId: string, version: string, files: Record<string, string>): Promise<void> {
    await this.api.invoke('apps:setFiles', {
      app_id: appId,
      version,
      files,
    })
  }

  async removeAppFiles(appId: string, version?: string): Promise<void> {
    await this.api.invoke('apps:removeFiles', appId, version)
  }

  private rowToDownloadedApp(row: DownloadedAppRow): DownloadedApp {
    return {
      id: row.id,
      manifest: JSON.parse(row.manifest) as AppManifest,
      versions: JSON.parse(row.versions) as string[],
      currentVersion: row.current_version,
      downloadedAt: row.downloaded_at,
      path: row.path,
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // App Instances
  // ───────────────────────────────────────────────────────────────────────────

  async listInstances(appId?: string): Promise<AppInstance[]> {
    const rows = (await this.api.invoke('apps:listInstances', appId)) as AppInstanceRow[]
    return rows.map(this.rowToAppInstance)
  }

  async getInstance(id: string): Promise<AppInstance | null> {
    const row = (await this.api.invoke('apps:getInstance', id)) as AppInstanceRow | null
    return row ? this.rowToAppInstance(row) : null
  }

  async addInstance(instance: AppInstance): Promise<void> {
    await this.api.invoke('apps:addInstance', {
      id: instance.id,
      app_id: instance.appId,
      app_version: instance.appVersion,
      agent_id: instance.agentId,
      display_name: instance.displayName,
      sequence: instance.sequence,
      created_at: instance.createdAt,
      enabled: instance.enabled ? 1 : 0,
      data_path: instance.dataPath,
    })
  }

  async updateInstance(id: string, updates: Partial<AppInstance>): Promise<void> {
    const fields: Record<string, unknown> = {}

    if (updates.appVersion !== undefined) {
      fields.app_version = updates.appVersion
    }
    if (updates.agentId !== undefined) {
      fields.agent_id = updates.agentId
    }
    if (updates.displayName !== undefined) {
      fields.display_name = updates.displayName
    }
    if (updates.enabled !== undefined) {
      fields.enabled = updates.enabled ? 1 : 0
    }
    if (updates.dataPath !== undefined) {
      fields.data_path = updates.dataPath
    }

    await this.api.invoke('apps:updateInstance', id, fields)
  }

  async removeInstance(id: string): Promise<void> {
    await this.api.invoke('apps:removeInstance', id)
  }

  async getNextSequence(appId: string): Promise<number> {
    const instances = await this.listInstances(appId)
    if (instances.length === 0) return 1
    return Math.max(...instances.map((i) => i.sequence)) + 1
  }

  private rowToAppInstance(row: AppInstanceRow): AppInstance {
    return {
      id: row.id,
      appId: row.app_id,
      appVersion: row.app_version,
      agentId: row.agent_id,
      displayName: row.display_name,
      sequence: row.sequence,
      createdAt: row.created_at,
      enabled: !!row.enabled,
      dataPath: row.data_path,
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Legacy Support (InstalledApp)
  // ───────────────────────────────────────────────────────────────────────────

  async list(): Promise<InstalledApp[]> {
    const rows = (await this.api.invoke('apps:list')) as AppRow[]
    return rows.map(this.rowToApp)
  }

  async get(id: string): Promise<InstalledApp | null> {
    const row = (await this.api.invoke('apps:get', id)) as AppRow | null
    return row ? this.rowToApp(row) : null
  }

  async add(app: InstalledApp): Promise<void> {
    await this.api.invoke('apps:add', {
      id: app.id,
      manifest: JSON.stringify(app.manifest),
      installed_at: app.installedAt,
      enabled: app.enabled ? 1 : 0,
      install_path: app.installPath,
    })
  }

  async update(id: string, updates: Partial<InstalledApp>): Promise<void> {
    const fields: Record<string, unknown> = {}

    if (updates.manifest !== undefined) {
      fields.manifest = JSON.stringify(updates.manifest)
    }
    if (updates.installedAt !== undefined) {
      fields.installed_at = updates.installedAt
    }
    if (updates.enabled !== undefined) {
      fields.enabled = updates.enabled ? 1 : 0
    }
    if (updates.installPath !== undefined) {
      fields.install_path = updates.installPath
    }

    await this.api.invoke('apps:update', id, fields)
  }

  async remove(id: string): Promise<void> {
    await this.api.invoke('apps:remove', id)
  }

  private rowToApp(row: AppRow): InstalledApp {
    return {
      id: row.id,
      manifest: JSON.parse(row.manifest) as AppManifest,
      installedAt: row.installed_at,
      enabled: !!row.enabled,
      installPath: row.install_path,
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Local Apps
  // ───────────────────────────────────────────────────────────────────────────

  async scanLocal(): Promise<LocalApp[]> {
    interface LocalAppRow {
      id: string
      manifest: string
      path: string
      version: string
      files: string
    }

    const rows = (await this.api.invoke('apps:scanLocal')) as LocalAppRow[]
    return rows.map((row) => ({
      id: row.id,
      manifest: JSON.parse(row.manifest) as AppManifest,
      path: row.path,
      version: row.version,
      files: JSON.parse(row.files) as Record<string, string>,
      isLocal: true as const,
    }))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Storage Implementation (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

const WEB_APPS_KEY = 'helloclaw_apps'
const WEB_DOWNLOADED_APPS_KEY = 'helloclaw_downloaded_apps'
const WEB_APP_INSTANCES_KEY = 'helloclaw_app_instances'

function buildWebAppFilesKey(appId: string, version: string): string {
  return `helloclaw_app_files_${appId}_${version}`
}

class WebAppsStorage implements AppsStorage {
  // ───────────────────────────────────────────────────────────────────────────
  // Downloaded Apps
  // ───────────────────────────────────────────────────────────────────────────

  private getDownloadedApps(): Record<string, DownloadedApp> {
    const data = localStorage.getItem(WEB_DOWNLOADED_APPS_KEY)
    return data ? JSON.parse(data) : {}
  }

  private setDownloadedApps(apps: Record<string, DownloadedApp>): void {
    localStorage.setItem(WEB_DOWNLOADED_APPS_KEY, JSON.stringify(apps))
  }

  async listDownloaded(): Promise<DownloadedApp[]> {
    const apps = this.getDownloadedApps()
    return Object.values(apps).sort((a, b) => b.downloadedAt - a.downloadedAt)
  }

  async getDownloaded(id: string): Promise<DownloadedApp | null> {
    const apps = this.getDownloadedApps()
    return apps[id] || null
  }

  async addDownloaded(app: DownloadedApp): Promise<void> {
    const apps = this.getDownloadedApps()
    apps[app.id] = app
    this.setDownloadedApps(apps)
  }

  async updateDownloaded(id: string, updates: Partial<DownloadedApp>): Promise<void> {
    const apps = this.getDownloadedApps()
    if (apps[id]) {
      apps[id] = { ...apps[id], ...updates }
      this.setDownloadedApps(apps)
    }
  }

  async removeDownloaded(id: string): Promise<void> {
    const apps = this.getDownloadedApps()
    delete apps[id]
    this.setDownloadedApps(apps)
    await this.removeAppFiles(id)
  }

  async getAppFiles(appId: string, version: string): Promise<Record<string, string>> {
    const data = localStorage.getItem(buildWebAppFilesKey(appId, version))
    return data ? JSON.parse(data) as Record<string, string> : {}
  }

  async setAppFiles(appId: string, version: string, files: Record<string, string>): Promise<void> {
    localStorage.setItem(buildWebAppFilesKey(appId, version), JSON.stringify(files))
  }

  async removeAppFiles(appId: string, version?: string): Promise<void> {
    if (version) {
      localStorage.removeItem(buildWebAppFilesKey(appId, version))
      return
    }

    const prefix = `helloclaw_app_files_${appId}_`
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key)
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // App Instances
  // ───────────────────────────────────────────────────────────────────────────

  private getAppInstances(): Record<string, AppInstance> {
    const data = localStorage.getItem(WEB_APP_INSTANCES_KEY)
    return data ? JSON.parse(data) : {}
  }

  private setAppInstances(instances: Record<string, AppInstance>): void {
    localStorage.setItem(WEB_APP_INSTANCES_KEY, JSON.stringify(instances))
  }

  async listInstances(appId?: string): Promise<AppInstance[]> {
    const instances = this.getAppInstances()
    let result = Object.values(instances)
    if (appId) {
      result = result.filter((i) => i.appId === appId)
    }
    return result.sort((a, b) => b.createdAt - a.createdAt)
  }

  async getInstance(id: string): Promise<AppInstance | null> {
    const instances = this.getAppInstances()
    return instances[id] || null
  }

  async addInstance(instance: AppInstance): Promise<void> {
    const instances = this.getAppInstances()
    instances[instance.id] = instance
    this.setAppInstances(instances)
  }

  async updateInstance(id: string, updates: Partial<AppInstance>): Promise<void> {
    const instances = this.getAppInstances()
    if (instances[id]) {
      instances[id] = { ...instances[id], ...updates }
      this.setAppInstances(instances)
    }
  }

  async removeInstance(id: string): Promise<void> {
    const instances = this.getAppInstances()
    delete instances[id]
    this.setAppInstances(instances)
    // Also remove instance data
    localStorage.removeItem(`helloclaw_instance_data_${id}`)
  }

  async getNextSequence(appId: string): Promise<number> {
    const instances = await this.listInstances(appId)
    if (instances.length === 0) return 1
    return Math.max(...instances.map((i) => i.sequence)) + 1
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Legacy Support (InstalledApp)
  // ───────────────────────────────────────────────────────────────────────────

  private getApps(): Record<string, InstalledApp> {
    const data = localStorage.getItem(WEB_APPS_KEY)
    return data ? JSON.parse(data) : {}
  }

  private setApps(apps: Record<string, InstalledApp>): void {
    localStorage.setItem(WEB_APPS_KEY, JSON.stringify(apps))
  }

  async list(): Promise<InstalledApp[]> {
    const apps = this.getApps()
    return Object.values(apps).sort((a, b) => b.installedAt - a.installedAt)
  }

  async get(id: string): Promise<InstalledApp | null> {
    const apps = this.getApps()
    return apps[id] || null
  }

  async add(app: InstalledApp): Promise<void> {
    const apps = this.getApps()
    apps[app.id] = app
    this.setApps(apps)
  }

  async update(id: string, updates: Partial<InstalledApp>): Promise<void> {
    const apps = this.getApps()
    if (apps[id]) {
      apps[id] = { ...apps[id], ...updates }
      this.setApps(apps)
    }
  }

  async remove(id: string): Promise<void> {
    const apps = this.getApps()
    delete apps[id]
    this.setApps(apps)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Factory
// ─────────────────────────────────────────────────────────────────────────────

function createAppsStorage(): AppsStorage {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return new ElectronAppsStorage()
  }
  return new WebAppsStorage()
}

// Singleton storage instance
let storageInstance: AppsStorage | null = null

function getStorage(): AppsStorage {
  if (!storageInstance) {
    storageInstance = createAppsStorage()
  }
  return storageInstance
}

const AGENT_SETUP_TIMEOUT_MS = 10000

function normalizeAgentId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 64)
  return normalized || 'app-agent'
}

async function withTimeout<T>(
  task: Promise<T>,
  label: string,
  timeoutMs: number = AGENT_SETUP_TIMEOUT_MS
): Promise<T> {
  let timeoutId: number | null = null

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error(translate('appStore.error.timedOut', { label, timeoutMs })))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  }
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : translate('appStore.error.unknown')
}

function collectErrorMessages(err: unknown): string[] {
  const candidates: string[] = []

  if (err instanceof Error && err.message) {
    candidates.push(err.message)
  } else if (err != null) {
    candidates.push(String(err))
  }

  if (err instanceof GatewayRequestError) {
    if (typeof err.details === 'string') {
      candidates.push(err.details)
    } else if (err.details && typeof err.details === 'object') {
      candidates.push(JSON.stringify(err.details))
    }
  }

  if (err instanceof Error && 'cause' in err && err.cause) {
    candidates.push(...collectErrorMessages(err.cause))
  }

  return candidates.filter(Boolean)
}

function isAgentAlreadyExistsError(err: unknown): boolean {
  const normalized = collectErrorMessages(err).map((value) => value.toLowerCase())

  return normalized.some((message) =>
    message.includes('already exists')
    || message.includes('already bound')
    || message.includes('duplicate')
    || message.includes('conflict')
    || message.includes('已存在')
    || message.includes('重复')
  )
}

function isMissingAgentError(err: unknown): boolean {
  const normalized = collectErrorMessages(err).map((value) => value.toLowerCase())

  if (normalized.some((message) =>
    message.includes('not found')
    || message.includes('unknown agent id')
    || message.includes('does not exist')
    || message.includes('不存在')
    || message.includes('找不到')
  )) {
    return true
  }

  if (err instanceof Error && 'cause' in err && err.cause) {
    return isMissingAgentError(err.cause)
  }

  return false
}

function buildAgentIdCandidate(agentId: string, attempt: number): string {
  if (attempt <= 0) {
    return agentId
  }

  const match = agentId.match(/^(.*?)-(\d+)$/)
  if (match) {
    return `${match[1]}-${Number(match[2]) + attempt}`
  }

  return `${agentId}-${attempt + 1}`
}

function resolveManifestFromFiles(
  fallbackManifest: AppManifest,
  files: Record<string, string>
): AppManifest {
  const manifestContent = files['manifest.json']
  if (!manifestContent) {
    return fallbackManifest
  }

  try {
    const parsed = JSON.parse(manifestContent) as AppManifest
    if (!parsed || typeof parsed !== 'object') {
      return fallbackManifest
    }

    if (!parsed.id || !parsed.name || !parsed.version || !parsed.entry) {
      return fallbackManifest
    }

    return parsed
  } catch {
    return fallbackManifest
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useApps Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAppsResult {
  /** List of downloaded apps */
  downloadedApps: DownloadedApp[]
  /** List of app instances */
  appInstances: AppInstance[]
  /** Legacy: List of installed apps */
  installedApps: InstalledApp[]
  /** Map of loaded apps (runtime state) */
  loadedApps: Map<string, LoadedApp>
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null

  /** Refresh all data */
  refresh: () => Promise<void>

  // Download management
  /** Download an app */
  downloadApp: (manifest: AppManifest, files: Record<string, string>, version?: string) => Promise<DownloadResult>
  /** Delete a downloaded app */
  deleteDownloadedApp: (id: string) => Promise<void>

  // Instance management
  /** Instantiate an app (create Agent, install Skills, register CronJobs) */
  instantiateApp: (config: InstantiateConfig) => Promise<InstantiateResult>
  /** Delete an instance */
  deleteInstance: (instanceId: string) => Promise<void>
  /** Get instances for an app */
  getInstancesForApp: (appId: string) => AppInstance[]
  /** Set instance enabled state */
  setInstanceEnabled: (instanceId: string, enabled: boolean) => Promise<void>

  // Loading management
  /** Load an app instance */
  loadInstance: (instanceId: string) => Promise<LoadedApp | null>
  /** Load a local app */
  loadLocalApp: (localApp: LocalApp) => Promise<LoadedApp | null>
  /** Unload an app */
  unloadApp: (id: string) => Promise<void>
  /** Get a specific app instance */
  getInstance: (id: string) => Promise<AppInstance | null>

  // Legacy support
  /** @deprecated Use downloadApp instead */
  installFromUrl: (url: string) => Promise<InstallResult>
  /** @deprecated Use downloadApp instead */
  installFromManifest: (manifest: AppManifest, files: Record<string, string>) => Promise<InstallResult>
  /** @deprecated Use deleteDownloadedApp instead */
  uninstall: (id: string) => Promise<UninstallResult>
  /** @deprecated Use setInstanceEnabled instead */
  setEnabled: (id: string, enabled: boolean) => Promise<void>
  /** @deprecated Use loadInstance instead */
  loadApp: (id: string) => Promise<LoadedApp | null>
  /** Get app by ID */
  getApp: (id: string) => InstalledApp | null
  /** Get loaded app by ID */
  getLoadedApp: (id: string) => LoadedApp | null
  /** Get downloaded app by ID */
  getDownloadedApp: (id: string) => Promise<DownloadedApp | null>
}

/**
 * Hook for managing app installation and loading state
 *
 * @example
 * ```tsx
 * const { downloadedApps, appInstances, instantiateApp } = useApps()
 *
 * // Instantiate an app
 * const handleInstantiate = async (appId: string) => {
 *   const result = await instantiateApp({ appId })
 *   if (result.success) {
 *     console.log('Instance created:', result.instance?.displayName)
 *   }
 * }
 * ```
 */
export function useApps(callbacks?: any): UseAppsResult {
  const [downloadedApps, setDownloadedApps] = useState<DownloadedApp[]>([])
  const [appInstances, setAppInstances] = useState<AppInstance[]>([])
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]) // Legacy
  const [loadedApps, setLoadedApps] = useState<Map<string, LoadedApp>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storage = getStorage()

  // Helper for finding files matching a glob pattern
  const findMatchingFiles = (files: Record<string, string>, pattern: string): string[] => {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)
    return Object.keys(files).filter((path) => regex.test(path))
  }

  const collectManifestSkills = useCallback(async (
    files: Record<string, string>,
    patterns?: string[]
  ): Promise<SkillConfig[]> => {
    const skillMap = new Map<string, SkillConfig>()

    for (const pattern of patterns || []) {
      const skillFiles = findMatchingFiles(files, pattern)
      for (const path of skillFiles) {
        const skill = parseAppSkillFile(path, files)
        if (skill) {
          skillMap.set(skill.slug, skill)
        }
      }
    }

    for (const remoteSkill of await loadRemoteAppSkills(files)) {
      skillMap.set(remoteSkill.slug, remoteSkill)
    }

    return Array.from(skillMap.values())
  }, [])

  // Internal helper to setup/sync agent resources
  const setupAgentInternal = useCallback(async (
    instance: AppInstance,
    manifest: AppManifest,
    files: Record<string, string>,
    bootstrapOverrides?: BootstrapFiles
  ): Promise<AppInstance> => {
    if (!manifest.agent) return instance
    if (!callbacks?.createAgent) {
      throw new Error(translate('appStore.error.agentCreationUnavailable'))
    }

    const agentConfig = manifest.agent
    let nextInstance = instance
    const bootstrapFiles = collectAppBootstrapFiles(files, bootstrapOverrides)

    console.log(`[setupAgentInternal] Setting up agent for instance: ${instance.displayName} (${instance.agentId})`)

    // 1. Create Agent
    const MAX_AGENT_ID_ATTEMPTS = 20
    let createAgentError: unknown = null

    for (let attempt = 0; attempt < MAX_AGENT_ID_ATTEMPTS; attempt += 1) {
      const candidateAgentId = buildAgentIdCandidate(instance.agentId, attempt)

      try {
        const createdAgent = await withTimeout(
          callbacks.createAgent({
            id: candidateAgentId,
            name: candidateAgentId,
            bootstrapFiles,
          }),
          `create agent "${candidateAgentId}"`
        ) as { agentId?: string } | undefined

        const resolvedAgentId = typeof createdAgent?.agentId === 'string'
          ? createdAgent.agentId.trim()
          : candidateAgentId

        if (resolvedAgentId && resolvedAgentId !== nextInstance.agentId) {
          nextInstance = { ...nextInstance, agentId: resolvedAgentId }
        }

        createAgentError = null
        break
      } catch (err) {
        createAgentError = err

        if (isAgentAlreadyExistsError(err) && attempt < MAX_AGENT_ID_ATTEMPTS - 1) {
          console.warn(
            `[setupAgentInternal] Agent "${candidateAgentId}" already exists, retrying with a new id`
          )
          continue
        }

        break
      }
    }

    if (createAgentError) {
      throw new Error(translate('appStore.error.failedCreateAgent', { message: getErrorMessage(createAgentError) }))
    }

    // 2. Setup Skills
    if (callbacks.createSkill) {
      const patterns = Array.isArray(agentConfig.skills) ? agentConfig.skills : agentConfig.skills ? [agentConfig.skills] : []
      const skills = await collectManifestSkills(files, patterns)
      for (const skill of skills) {
        try {
          await withTimeout(
            callbacks.createSkill(nextInstance.agentId, skill),
            `install skill "${skill.name || skill.slug}"`
          )
        } catch (err) {
          console.error(`[setupAgentInternal] Failed to create skill "${skill.slug}":`, err)
        }
      }
    }

    // 3. Setup CronJobs
    if (agentConfig.cronjobs && callbacks.addCronJob) {
      const patterns = Array.isArray(agentConfig.cronjobs) ? agentConfig.cronjobs : [agentConfig.cronjobs]
      for (const pattern of patterns) {
        const cronFiles = findMatchingFiles(files, pattern)
        for (const path of cronFiles) {
          try {
            const cronConfig = JSON.parse(files[path])
            await withTimeout(
              callbacks.addCronJob({
                name: cronConfig.name || 'Unnamed Job',
                agentId: nextInstance.agentId,
                schedule: cronConfig.schedule,
                payload: cronConfig.payload,
                enabled: cronConfig.enabled ?? true,
              }),
              `create cron job "${cronConfig.name || 'Unnamed Job'}"`
            )
          } catch (err) {
            console.error(`[setupAgentInternal] Failed to create cron job from ${path}:`, err)
          }
        }
      }
    }

    return nextInstance
  }, [callbacks, collectManifestSkills])

  // Load all data on mount
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [downloaded, instances, installed] = await Promise.all([
        storage.listDownloaded(),
        storage.listInstances(),
        storage.list(), // Legacy
      ])
      setDownloadedApps(downloaded)
      setAppInstances(instances)
      setInstalledApps(installed)
    } catch (err) {
      setError(err instanceof Error ? err.message : translate('appStore.error.failedLoadApps'))
    } finally {
      setIsLoading(false)
    }
  }, [storage])

  const notifyAppsChanged = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('helloclaw:apps_changed'))
    }
  }, [])

  const loadDownloadedAppFiles = useCallback(async (
    appId: string,
    version: string
  ): Promise<Record<string, string>> => {
    const storedFiles = await storage.getAppFiles(appId, version)
    if (Object.keys(storedFiles).length > 0) {
      return storedFiles
    }

    if (typeof window !== 'undefined' && window.electronAPI) {
      // Backward-compat: older installs only had files on disk for bundled local apps.
      const localFiles = await window.electronAPI.invoke('apps:getLocalFiles', appId)
      if (localFiles && typeof localFiles === 'object') {
        return localFiles as Record<string, string>
      }
    }

    return {}
  }, [storage])

  useEffect(() => {
    refresh()

    const handleAppsChange = () => {
      refresh()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('helloclaw:apps_changed', handleAppsChange)
      return () => window.removeEventListener('helloclaw:apps_changed', handleAppsChange)
    }
  }, [refresh])

  // ───────────────────────────────────────────────────────────────────────────
  // Download Management
  // ───────────────────────────────────────────────────────────────────────────

  const downloadApp = useCallback(async (
    manifest: AppManifest,
    files: Record<string, string>,
    version: string = manifest.version
  ): Promise<DownloadResult> => {
    try {
      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version || !manifest.entry) {
        throw new Error(translate('appStore.error.invalidManifest'))
      }

      // Check if already downloaded
      const existing = await storage.getDownloaded(manifest.id)
      let versions: string[] = [version]

      if (existing) {
        // Add new version if not exists
        if (!existing.versions.includes(version)) {
          versions = [...existing.versions, version]
        } else {
          versions = existing.versions
        }
      }

      // Create or update downloaded app record
      const downloadedApp: DownloadedApp = {
        id: manifest.id,
        manifest,
        versions,
        currentVersion: version,
        downloadedAt: existing?.downloadedAt || Date.now(),
        path: `apps/${manifest.id}`,
      }

      // Save to storage
      if (existing) {
        await storage.updateDownloaded(manifest.id, {
          versions,
          currentVersion: version,
          manifest,
        })
      } else {
        await storage.addDownloaded(downloadedApp)
      }

      await storage.setAppFiles(manifest.id, version, files)

      // Refresh list
      await refresh()
    notifyAppsChanged()

      return {
        success: true,
        app: downloadedApp,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : translate('appStore.error.downloadFailed'),
      }
    }
  }, [storage, refresh, notifyAppsChanged])

  // ───────────────────────────────────────────────────────────────────────────
  // Instance Management
  // ───────────────────────────────────────────────────────────────────────────

  const instantiateApp = useCallback(async (config: InstantiateConfig): Promise<InstantiateResult> => {
    try {
      const { appId, version, displayName, agentConfig } = config

      // Get downloaded app
      const downloaded = await storage.getDownloaded(appId)
      if (!downloaded) {
        throw new Error(translate('appStore.error.appNotDownloaded'))
      }

      const appVersion = version || downloaded.currentVersion

      // Get app files for the version
      const files = await loadDownloadedAppFiles(appId, appVersion)

      const effectiveManifest = resolveManifestFromFiles(downloaded.manifest, files)

      // Get next sequence number
      const sequence = await storage.getNextSequence(appId)

      // Generate instance ID
      const instanceId = `${appId}-${sequence}`

      // Generate display name
      const instanceDisplayName = displayName || `${effectiveManifest.name}-${sequence}`

      // Generate Agent ID
      const baseAgentId = normalizeAgentId(
        effectiveManifest.agent?.id
          || (agentConfig?.name ? `${appId}-${agentConfig.name}` : `${appId}-agent`)
      )
      const agentId = `${baseAgentId}-${sequence}`

      // Create instance record
      let instance: AppInstance = {
        id: instanceId,
        appId,
        appVersion,
        agentId,
        displayName: instanceDisplayName,
        sequence,
        createdAt: Date.now(),
        enabled: true,
        dataPath: `appInstances/${instanceId}`,
      }

      // Setup Agent in OpenClaw (via SDK callbacks)
      if (effectiveManifest.agent) {
        instance = await setupAgentInternal(
          instance,
          effectiveManifest,
          files,
          agentConfig?.bootstrapFiles
        )
      }

      // Save instance to storage after remote setup succeeds
      await storage.addInstance(instance)

      // Refresh list
      await refresh()
      notifyAppsChanged()

      return {
        success: true,
        instance,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : translate('appStore.error.instantiationFailed'),
      }
    }
  }, [storage, refresh, notifyAppsChanged, setupAgentInternal, loadDownloadedAppFiles])

  // Unload app
  const unloadApp = useCallback(async (id: string): Promise<void> => {
    const loaded = loadedApps.get(id)
    if (!loaded || loaded.loadState !== 'loaded') {
      return
    }

    // Update state to unloading
    setLoadedApps((prev) => {
      const next = new Map(prev)
      const app = next.get(id)
      if (app) {
        next.set(id, { ...app, loadState: 'unloading' })
      }
      return next
    })

    try {
      // Call onunload
      if (loaded.instance?.onunload) {
        await loaded.instance.onunload()
      }

      // Remove app styles
      const styleId = `app-style-${id}`
      const styleElement = document.getElementById(styleId)
      if (styleElement) {
        styleElement.remove()
      }

      // Remove from loaded apps
      setLoadedApps((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      console.error(`Error unloading app ${id}:`, err)
      // Still remove from loaded apps even on error
      setLoadedApps((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    }
  }, [loadedApps])

  const deleteInstance = useCallback(async (instanceId: string): Promise<void> => {
    const instance = await storage.getInstance(instanceId)
    if (!instance) {
      return
    }

    // Unload if loaded
    await unloadApp(instanceId)

    if (instance.agentId && callbacks?.deleteAgent) {
      try {
        await withTimeout(
          callbacks.deleteAgent(instance.agentId),
          `delete agent "${instance.agentId}"`
        )
      } catch (err) {
        if (!isMissingAgentError(err)) {
          throw new Error(translate('appStore.error.failedDeleteAgent', { message: getErrorMessage(err) }))
        }
      }
    }

    // Remove instance data
    if (typeof window !== 'undefined' && !window.electronAPI) {
      localStorage.removeItem(`helloclaw_instance_data_${instanceId}`)
    }

    // Remove from storage
    await storage.removeInstance(instanceId)

    await refresh()
    notifyAppsChanged()
  }, [callbacks, storage, unloadApp, refresh, notifyAppsChanged])

  const deleteDownloadedApp = useCallback(async (id: string): Promise<void> => {
    // First delete all instances
    const instances = await storage.listInstances(id)
    for (const instance of instances) {
      await deleteInstance(instance.id)
    }

    await storage.removeAppFiles(id)

    // Remove downloaded app
    await storage.removeDownloaded(id)
    await refresh()
    notifyAppsChanged()
  }, [storage, deleteInstance, refresh, notifyAppsChanged])

  const getInstancesForApp = useCallback((appId: string): AppInstance[] => {
    return appInstances.filter((i) => i.appId === appId)
  }, [appInstances])

  const setInstanceEnabled = useCallback(async (instanceId: string, enabled: boolean): Promise<void> => {
    await storage.updateInstance(instanceId, { enabled })
    await refresh()
    notifyAppsChanged()
  }, [storage, refresh, notifyAppsChanged])

  // ───────────────────────────────────────────────────────────────────────────
  // Loading Management
  // ───────────────────────────────────────────────────────────────────────────

  const loadInstance = useCallback(async (instanceId: string): Promise<LoadedApp | null> => {
    const instance = await storage.getInstance(instanceId)
    if (!instance) {
      return null
    }

    // Get downloaded app
    const downloaded = await storage.getDownloaded(instance.appId)
    if (!downloaded) {
      return null
    }

    // Check if already loaded
    const existing = loadedApps.get(instanceId)
    if (existing && existing.loadState === 'loaded') {
      return existing
    }

    // Update state to loading
    const loadingApp: LoadedApp = {
      id: instanceId,
      manifest: downloaded.manifest,
      instance: null,
      sdk: null,
      loadState: 'loading',
      appInstanceId: instanceId,
    }
    setLoadedApps((prev) => new Map(prev).set(instanceId, loadingApp))

    let effectiveManifest = downloaded.manifest

    try {
      // Get app files
      const files = await loadDownloadedAppFiles(instance.appId, instance.appVersion)

      effectiveManifest = resolveManifestFromFiles(downloaded.manifest, files)

      // Get entry file content
      const entryContent = files[effectiveManifest.entry]
      if (!entryContent) {
        throw new Error(translate('appStore.error.entryFileNotFound', { entry: effectiveManifest.entry }))
      }

      // Create SDK instance
      const { HelloClawSDKImpl } = await import('./sdk')
      const sdk = new HelloClawSDKImpl(instanceId, effectiveManifest, files)

      // Inject app styles if defined
      if (effectiveManifest.style && files[effectiveManifest.style]) {
        const styleId = `app-style-${instanceId}`
        const existingStyle = document.getElementById(styleId)
        if (existingStyle) {
          existingStyle.remove()
        }
        const styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.textContent = files[effectiveManifest.style]
        document.head.appendChild(styleElement)
      }

      // Load app module
      const moduleFactory = new Function(
        'helloclaw',
        'HelloClawApp',
        `
        const module = { exports: {} };
        const exports = module.exports;
        ${entryContent}
        return module.exports.default || module.exports;
        `
      )

      const AppClass = moduleFactory(sdk, (await import('./types')).HelloClawApp)

      if (typeof AppClass !== 'function') {
        throw new Error(translate('appStore.error.defaultExportRequired'))
      }

      // Create app instance
      const appInstance = new AppClass(sdk)

      // Call onload
      await appInstance.onload()

      // Update state to loaded
      const loadedApp: LoadedApp = {
        id: instanceId,
        manifest: effectiveManifest,
        instance: appInstance,
        sdk,
        loadState: 'loaded',
        appInstanceId: instanceId,
      }
      setLoadedApps((prev) => new Map(prev).set(instanceId, loadedApp))

      return loadedApp
    } catch (err) {
      // Update state to error
      const errorApp: LoadedApp = {
        id: instanceId,
        manifest: effectiveManifest,
        instance: null,
        sdk: null,
        loadState: 'error',
        error: err instanceof Error ? err.message : translate('appStore.error.failedLoadApp'),
        appInstanceId: instanceId,
      }
      setLoadedApps((prev) => new Map(prev).set(instanceId, errorApp))

      return errorApp
    }
  }, [storage, loadedApps, loadDownloadedAppFiles])

  // Uninstall app
  const uninstall = useCallback(async (id: string): Promise<UninstallResult> => {
    try {
      // Unload if loaded
      await unloadApp(id)

      // Remove from storage
      await storage.remove(id)

      // Remove files
      if (typeof window !== 'undefined' && !window.electronAPI) {
        localStorage.removeItem(`helloclaw_app_files_${id}`)
      }

      // Refresh list
      await refresh()
    notifyAppsChanged()

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : translate('appStore.error.uninstallFailed'),
      }
    }
  }, [storage, refresh, notifyAppsChanged])

  // Enable/disable app
  const setEnabled = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    await storage.update(id, { enabled })
    await refresh()
    notifyAppsChanged()
  }, [storage, refresh, notifyAppsChanged])

  // Load app
  const loadApp = useCallback(async (id: string): Promise<LoadedApp | null> => {
    const installed = installedApps.find((app) => app.id === id)
    if (!installed) {
      return null
    }

    // Check if already loaded
    const existing = loadedApps.get(id)
    if (existing && existing.loadState === 'loaded') {
      return existing
    }

    // Update state to loading
    const loadingApp: LoadedApp = {
      id,
      manifest: installed.manifest,
      instance: null,
      sdk: null,
      loadState: 'loading',
    }
    setLoadedApps((prev) => new Map(prev).set(id, loadingApp))

    try {
      // Get app files
      let files: Record<string, string> = {}
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const filesData = localStorage.getItem(`helloclaw_app_files_${id}`)
        files = filesData ? JSON.parse(filesData) : {}
      }

      // Get entry file content
      const entryContent = files[installed.manifest.entry]
      if (!entryContent) {
        throw new Error(translate('appStore.error.entryFileNotFound', { entry: installed.manifest.entry }))
      }

      // Create SDK instance
      const { HelloClawSDKImpl } = await import('./sdk')
      const sdk = new HelloClawSDKImpl(id, installed.manifest, files)

      // Load app module
      // In production, this would use a proper module loader
      // For now, we use Function constructor to create an isolated scope
      const moduleFactory = new Function(
        'helloclaw',
        'HelloClawApp',
        `
        const module = { exports: {} };
        const exports = module.exports;
        ${entryContent}
        return module.exports.default || module.exports;
        `
      )

      const AppClass = moduleFactory(sdk, (await import('./types')).HelloClawApp)

      if (typeof AppClass !== 'function') {
        throw new Error(translate('appStore.error.defaultExportRequired'))
      }

      // Create app instance
      const instance = new AppClass(sdk)

      // Call onload
      await instance.onload()

      // Update state to loaded
      const loadedApp: LoadedApp = {
        id,
        manifest: installed.manifest,
        instance,
        sdk,
        loadState: 'loaded',
      }
      setLoadedApps((prev) => new Map(prev).set(id, loadedApp))

      return loadedApp
    } catch (err) {
      // Update state to error
      const errorApp: LoadedApp = {
        id,
        manifest: installed.manifest,
        instance: null,
        sdk: null,
        loadState: 'error',
        error: err instanceof Error ? err.message : translate('appStore.error.failedLoadApp'),
      }
      setLoadedApps((prev) => new Map(prev).set(id, errorApp))

      return errorApp
    }
  }, [installedApps, loadedApps])

  // Load local app
  const loadLocalApp = useCallback(async (localApp: LocalApp): Promise<LoadedApp | null> => {
    const { id, manifest, files } = localApp

    // Check if already loaded
    const existing = loadedApps.get(id)
    if (existing && existing.loadState === 'loaded') {
      return existing
    }

    // Update state to loading
    const loadingApp: LoadedApp = {
      id,
      manifest,
      instance: null,
      sdk: null,
      loadState: 'loading',
    }
    setLoadedApps((prev) => new Map(prev).set(id, loadingApp))

    try {
      // Get entry file content
      const entryContent = files[manifest.entry]
      if (!entryContent) {
        throw new Error(translate('appStore.error.entryFileNotFound', { entry: manifest.entry }))
      }

      // Create SDK instance
      const { HelloClawSDKImpl } = await import('./sdk')
      const sdk = new HelloClawSDKImpl(id, manifest, files)

      // Inject app styles if defined
      console.log(`[loadLocalApp] manifest.style: ${manifest.style}`)
      console.log(`[loadLocalApp] files keys: ${Object.keys(files).join(', ')}`)
      console.log(`[loadLocalApp] style content exists: ${!!files[manifest.style!]}`)
      if (manifest.style && files[manifest.style]) {
        const styleId = `app-style-${id}`
        // Remove existing style if any
        const existingStyle = document.getElementById(styleId)
        if (existingStyle) {
          existingStyle.remove()
        }
        // Create and inject new style element
        const styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.textContent = files[manifest.style]
        document.head.appendChild(styleElement)
        console.log(`[loadLocalApp] Injected styles for app ${id}`)
      } else {
        console.warn(`[loadLocalApp] No styles found for app ${id}. manifest.style=${manifest.style}`)
      }

      // Load app module
      const moduleFactory = new Function(
        'helloclaw',
        'HelloClawApp',
        `
        const module = { exports: {} };
        const exports = module.exports;
        ${entryContent}
        return module.exports.default || module.exports;
        `
      )

      const AppClass = moduleFactory(sdk, (await import('./types')).HelloClawApp)

      if (typeof AppClass !== 'function') {
        throw new Error(translate('appStore.error.defaultExportRequired'))
      }

      // Create app instance
      const instance = new AppClass(sdk)

      // Call onload
      await instance.onload()

      // Update state to loaded
      const loadedApp: LoadedApp = {
        id,
        manifest,
        instance,
        sdk,
        loadState: 'loaded',
      }
      setLoadedApps((prev) => new Map(prev).set(id, loadedApp))

      return loadedApp
    } catch (err) {
      // Update state to error
      const errorApp: LoadedApp = {
        id,
        manifest,
        instance: null,
        sdk: null,
        loadState: 'error',
        error: err instanceof Error ? err.message : translate('appStore.error.failedLoadApp'),
      }
      setLoadedApps((prev) => new Map(prev).set(id, errorApp))

      return errorApp
    }
  }, [loadedApps])

  // Get app by ID
  const getApp = useCallback((id: string): InstalledApp | null => {
    return installedApps.find((app) => app.id === id) || null
  }, [installedApps])

  // Get loaded app by ID
  const getLoadedApp = useCallback((id: string): LoadedApp | null => {
    return loadedApps.get(id) || null
  }, [loadedApps])

  const getDownloadedApp = useCallback(async (id: string): Promise<DownloadedApp | null> => {
    return storage.getDownloaded(id)
  }, [storage])

  const getInstance = useCallback(async (id: string): Promise<AppInstance | null> => {
    return storage.getInstance(id)
  }, [storage])

  // Legacy: Install from URL (deprecated - use downloadApp instead)
  const installFromUrl = useCallback(async (url: string): Promise<InstallResult> => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(translate('appStore.error.failedToDownload', { statusText: response.statusText }))
      }

      const data = await response.json()
      if (!data.manifest || !data.files) {
        throw new Error(translate('appStore.error.invalidPackage'))
      }

      const result = await downloadApp(data.manifest as AppManifest, data.files as Record<string, string>)
      return {
        success: result.success,
        error: result.error,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : translate('appStore.error.installationFailed'),
      }
    }
  }, [downloadApp])

  // Legacy: Install from manifest (deprecated - use downloadApp instead)
  const installFromManifest = useCallback(async (
    manifest: AppManifest,
    files: Record<string, string>
  ): Promise<InstallResult> => {
    const result = await downloadApp(manifest, files)
    return {
      success: result.success,
      error: result.error,
    }
  }, [downloadApp])

  return {
    downloadedApps,
    appInstances,
    installedApps,
    loadedApps,
    isLoading,
    error,
    refresh,
    downloadApp,
    deleteDownloadedApp,
    instantiateApp,
    deleteInstance,
    getInstancesForApp,
    setInstanceEnabled,
    loadInstance,
    loadLocalApp,
    unloadApp,
    installFromUrl,
    installFromManifest,
    uninstall,
    setEnabled,
    loadApp,
    getApp,
    getLoadedApp,
    getDownloadedApp,
    getInstance,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock App Market Data (for development)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock app market entries for development
 */
export function getMockMarketApps(): AppMarketEntry[] {
  return [
    {
      id: 'helloclaw-social-media',
      name: translate('mockApps.socialMedia.name'),
      description: translate('mockApps.socialMedia.description'),
      author: 'HelloClaw Team',
      version: '1.0.0',
      category: 'productivity',
      downloadUrl: '/apps/helloclaw-social-media.json',
      repository: 'https://github.com/helloclaw/social-media-app',
      downloads: 1234,
      rating: 4.5,
    },
    {
      id: 'helloclaw-notes',
      name: translate('mockApps.notes.name'),
      description: translate('mockApps.notes.description'),
      author: 'HelloClaw Team',
      version: '1.0.0',
      category: 'productivity',
      downloadUrl: '/apps/helloclaw-notes.json',
      downloads: 567,
      rating: 4.2,
    },
  ]
}

/**
 * Hook for fetching app market entries
 */
export function useAppMarket(): {
  apps: AppMarketEntry[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [apps, setApps] = useState<AppMarketEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // In production, this would fetch from a real API
      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500))
      setApps(getMockMarketApps())
    } catch (err) {
      setError(err instanceof Error ? err.message : translate('appStore.error.failedLoadMarket'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { apps, isLoading, error, refresh }
}

// ─────────────────────────────────────────────────────────────────────────────
// Local Apps Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for scanning local apps from the apps/ directory
 *
 * Local apps are bundled with the application and don't need to be installed.
 */
export function useLocalApps(): {
  localApps: LocalApp[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [localApps, setLocalApps] = useState<LocalApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Only available in Electron mode
      const isElectron = typeof window !== 'undefined' && !!window.electronAPI

      if (isElectron && window.electronAPI) {
        interface LocalAppRow {
          id: string
          manifest: string
          path: string
          version: string
          files: string
        }

        const rows = (await window.electronAPI.invoke('apps:scanLocal')) as LocalAppRow[]

        const apps: LocalApp[] = rows.map((row) => ({
          id: row.id,
          manifest: JSON.parse(row.manifest) as AppManifest,
          path: row.path,
          version: row.version,
          files: JSON.parse(row.files) as Record<string, string>,
          isLocal: true as const,
        }))
        setLocalApps(apps)
      } else {
        // Web mode: no local apps support
        setLocalApps([])
      }
    } catch (err) {
      console.error('[useLocalApps] Failed to scan local apps:', err)
      setError(err instanceof Error ? err.message : translate('appStore.error.failedScanLocalApps'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { localApps, isLoading, error, refresh }
}
