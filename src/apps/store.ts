/**
 * HelloClaw App Store
 *
 * Manages app installation state and provides hooks for React components.
 * Supports both Electron (SQLite) and Web (localStorage) storage.
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  AppManifest,
  InstalledApp,
  LoadedApp,
  AppLoadState,
  InstallResult,
  UninstallResult,
  AppMarketEntry,
  LocalApp,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Storage Interface
// ─────────────────────────────────────────────────────────────────────────────

interface AppsStorage {
  list(): Promise<InstalledApp[]>
  get(id: string): Promise<InstalledApp | null>
  add(app: InstalledApp): Promise<void>
  update(id: string, updates: Partial<InstalledApp>): Promise<void>
  remove(id: string): Promise<void>
  scanLocal?(): Promise<LocalApp[]>
}

// ─────────────────────────────────────────────────────────────────────────────
// Electron Storage Implementation
// ─────────────────────────────────────────────────────────────────────────────

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
      throw new Error('Electron API not available')
    }
    return window.electronAPI
  }

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

  async scanLocal(): Promise<LocalApp[]> {
    interface LocalAppRow {
      id: string
      manifest: string
      path: string
      files: string
    }

    const rows = (await this.api.invoke('apps:scanLocal')) as LocalAppRow[]
    return rows.map((row) => ({
      id: row.id,
      manifest: JSON.parse(row.manifest) as AppManifest,
      path: row.path,
      files: JSON.parse(row.files) as Record<string, string>,
      isLocal: true as const,
    }))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Storage Implementation (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

const WEB_APPS_KEY = 'helloclaw_apps'

class WebAppsStorage implements AppsStorage {
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

// ─────────────────────────────────────────────────────────────────────────────
// useApps Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAppsResult {
  /** List of installed apps */
  installedApps: InstalledApp[]
  /** Map of loaded apps (runtime state) */
  loadedApps: Map<string, LoadedApp>
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null

  /** Refresh installed apps list */
  refresh: () => Promise<void>
  /** Install an app from URL */
  installFromUrl: (url: string) => Promise<InstallResult>
  /** Install an app from manifest */
  installFromManifest: (manifest: AppManifest, files: Record<string, string>) => Promise<InstallResult>
  /** Uninstall an app */
  uninstall: (id: string) => Promise<UninstallResult>
  /** Enable/disable an app */
  setEnabled: (id: string, enabled: boolean) => Promise<void>
  /** Load an installed app */
  loadApp: (id: string) => Promise<LoadedApp | null>
  /** Load a local app */
  loadLocalApp: (localApp: LocalApp) => Promise<LoadedApp | null>
  /** Unload an app */
  unloadApp: (id: string) => Promise<void>
  /** Get app by ID */
  getApp: (id: string) => InstalledApp | null
  /** Get loaded app by ID */
  getLoadedApp: (id: string) => LoadedApp | null
}

/**
 * Hook for managing app installation and loading state
 *
 * @example
 * ```tsx
 * const { installedApps, loadApp, unloadApp } = useApps()
 *
 * // Load an app when navigating to it
 * const handleOpenApp = async (appId: string) => {
 *   const loaded = await loadApp(appId)
 *   if (loaded?.loadState === 'loaded') {
 *     // App is ready to use
 *   }
 * }
 * ```
 */
export function useApps(): UseAppsResult {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
  const [loadedApps, setLoadedApps] = useState<Map<string, LoadedApp>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storage = getStorage()

  // Load installed apps on mount
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const apps = await storage.list()
      setInstalledApps(apps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps')
    } finally {
      setIsLoading(false)
    }
  }, [storage])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Install from URL
  const installFromUrl = useCallback(async (url: string): Promise<InstallResult> => {
    try {
      // Fetch the app package (ZIP file)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
      }

      // For now, we expect a JSON manifest + files
      // In production, this would handle ZIP extraction
      const data = await response.json()

      if (!data.manifest || !data.files) {
        throw new Error('Invalid app package format')
      }

      return installFromManifest(data.manifest as AppManifest, data.files as Record<string, string>)
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Installation failed',
      }
    }
  }, [])

  // Install from manifest
  const installFromManifest = useCallback(async (
    manifest: AppManifest,
    files: Record<string, string>
  ): Promise<InstallResult> => {
    try {
      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version || !manifest.entry) {
        throw new Error('Invalid manifest: missing required fields')
      }

      // Check if already installed
      const existing = await storage.get(manifest.id)
      if (existing) {
        throw new Error('App is already installed')
      }

      // Create installed app record
      const installedApp: InstalledApp = {
        id: manifest.id,
        manifest,
        installedAt: Date.now(),
        enabled: true,
        installPath: `apps/${manifest.id}`,
      }

      // Save to storage
      await storage.add(installedApp)

      // Store app files (in production, this would use proper file system)
      if (typeof window !== 'undefined' && !window.electronAPI) {
        // Web mode: store files in localStorage
        localStorage.setItem(
          `helloclaw_app_files_${manifest.id}`,
          JSON.stringify(files)
        )
      }

      // Refresh list
      await refresh()

      return {
        success: true,
        app: installedApp,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Installation failed',
      }
    }
  }, [storage, refresh])

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

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Uninstallation failed',
      }
    }
  }, [storage, refresh])

  // Enable/disable app
  const setEnabled = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    await storage.update(id, { enabled })
    await refresh()
  }, [storage, refresh])

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
        throw new Error(`Entry file not found: ${installed.manifest.entry}`)
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
        throw new Error('App must export a class as default')
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
        error: err instanceof Error ? err.message : 'Failed to load app',
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
        throw new Error(`Entry file not found: ${manifest.entry}`)
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
        throw new Error('App must export a class as default')
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
        error: err instanceof Error ? err.message : 'Failed to load app',
      }
      setLoadedApps((prev) => new Map(prev).set(id, errorApp))

      return errorApp
    }
  }, [loadedApps])

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

  // Get app by ID
  const getApp = useCallback((id: string): InstalledApp | null => {
    return installedApps.find((app) => app.id === id) || null
  }, [installedApps])

  // Get loaded app by ID
  const getLoadedApp = useCallback((id: string): LoadedApp | null => {
    return loadedApps.get(id) || null
  }, [loadedApps])

  return {
    installedApps,
    loadedApps,
    isLoading,
    error,
    refresh,
    installFromUrl,
    installFromManifest,
    uninstall,
    setEnabled,
    loadApp,
    loadLocalApp,
    unloadApp,
    getApp,
    getLoadedApp,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock App Market Data (for development)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock app market entries for development
 */
export const MOCK_MARKET_APPS: AppMarketEntry[] = [
  {
    id: 'helloclaw-social-media',
    name: '自媒体助手',
    description: '管理自媒体内容，一键发布到多个平台',
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
    name: '笔记管理',
    description: '增强的笔记管理功能，支持标签和搜索',
    author: 'HelloClaw Team',
    version: '1.0.0',
    category: 'productivity',
    downloadUrl: '/apps/helloclaw-notes.json',
    downloads: 567,
    rating: 4.2,
  },
]

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
      setApps(MOCK_MARKET_APPS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market')
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
          files: string
        }

        const rows = (await window.electronAPI.invoke('apps:scanLocal')) as LocalAppRow[]

        const apps: LocalApp[] = rows.map((row) => ({
          id: row.id,
          manifest: JSON.parse(row.manifest) as AppManifest,
          path: row.path,
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
      setError(err instanceof Error ? err.message : 'Failed to scan local apps')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { localApps, isLoading, error, refresh }
}
