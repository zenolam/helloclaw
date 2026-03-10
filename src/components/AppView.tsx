/**
 * App View Component
 *
 * Renders a loaded app's UI within HelloClaw.
 */

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, AlertCircle, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApps, useLocalApps } from '@/apps/store'
import type { LoadedApp, LocalApp, InstalledApp } from '@/apps/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AppViewProps = {
  appId: string
  onBack: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      <span className="text-[var(--text-secondary)]">正在加载应用...</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────────────────────────

type ErrorViewProps = {
  error: string
  onBack: () => void
}

function ErrorView({ error, onBack }: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          应用加载失败
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          {error}
        </p>
      </div>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App Settings View
// ─────────────────────────────────────────────────────────────────────────────

type AppSettingsViewProps = {
  loadedApp: LoadedApp
  onBack: () => void
}

function AppSettingsView({ loadedApp, onBack }: AppSettingsViewProps) {
  const { manifest, instance } = loadedApp
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Render app settings if available
    if (instance?.onSettingsRender && containerRef.current) {
      instance.onSettingsRender(containerRef.current)
    }
  }, [instance])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回应用
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {manifest.name} - 设置
          </h1>
        </div>
      </header>

      {/* Settings Content */}
      <div ref={containerRef} className="flex-1 overflow-auto p-8">
        {instance?.onSettingsRender ? (
          <div className="text-[var(--text-muted)]">
            {/* App will render its settings here */}
          </div>
        ) : (
          <div className="text-center text-[var(--text-muted)] py-12">
            此应用没有可配置的设置项
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function AppView({ appId, onBack }: AppViewProps) {
  const { installedApps, loadApp, loadLocalApp, getLoadedApp } = useApps()
  const { localApps } = useLocalApps()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [loadedApp, setLoadedApp] = useState<LoadedApp | null>(null)

  // Check both installed and local apps
  const installedApp = installedApps.find((app) => app.id === appId)
  const localApp = localApps.find((app) => app.id === appId)

  // Load app on mount
  useEffect(() => {
    let mounted = true

    const load = async () => {
      // Check if already loaded
      const existing = getLoadedApp(appId)
      if (existing && existing.loadState === 'loaded') {
        if (mounted) setLoadedApp(existing)
        return
      }

      // Try to load as local app first, then fall back to installed app
      if (localApp) {
        const result = await loadLocalApp(localApp)
        if (mounted && result) {
          setLoadedApp(result)
        }
      } else {
        const result = await loadApp(appId)
        if (mounted && result) {
          setLoadedApp(result)
        }
      }
    }

    if (appId) {
      load()
    }

    return () => {
      mounted = false
    }
  }, [appId, loadApp, loadLocalApp, getLoadedApp, localApp])

  // Render app UI when loaded
  useEffect(() => {
    if (
      loadedApp?.loadState === 'loaded' &&
      loadedApp.instance &&
      loadedApp.sdk &&
      containerRef.current
    ) {
      // Clear container
      containerRef.current.innerHTML = ''

      // Get the view created by the app during onload()
      // The app creates a view with id pattern: {appId}-main or custom id
      const sdk = loadedApp.sdk as any
      const views = sdk.views as Map<string, any> | undefined
      console.log('[AppView] SDK views:', views ? Array.from(views.keys()) : 'no views')

      let appView = views?.get(`${appId}-main`)

      // If not found, try to get the first view created by the app
      if (!appView && views && views.size > 0) {
        appView = views.values().next().value
      }

      console.log('[AppView] App view:', appView)

      if (appView?.container) {
        // Append the app's view container to our container
        containerRef.current.appendChild(appView.container)
        console.log('[AppView] Appended container to DOM')
      } else {
        console.warn('[AppView] No app view container found')
      }

      return () => {
        // Don't destroy the view here, just remove from DOM
        // The view will be destroyed when the app unloads
      }
    }
  }, [loadedApp, appId])

  // App not found (neither installed nor local)
  if (!installedApp && !localApp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-yellow-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            应用未安装
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            请先在应用中心安装此应用
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回
        </Button>
      </div>
    )
  }

  // Show settings view
  if (showSettings && loadedApp?.loadState === 'loaded') {
    return (
      <AppSettingsView
        loadedApp={loadedApp}
        onBack={() => setShowSettings(false)}
      />
    )
  }

  // Loading state
  if (!loadedApp || loadedApp.loadState === 'loading') {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </header>
        <LoadingView />
      </div>
    )
  }

  // Error state
  if (loadedApp.loadState === 'error') {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </header>
        <ErrorView error={loadedApp.error || '未知错误'} onBack={onBack} />
      </div>
    )
  }

  const { manifest } = loadedApp

  // Loaded state
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {manifest.name}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              v{manifest.version} · {manifest.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loadedApp.instance?.onSettingsRender && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* App Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{
          // CSS variables for app theming
          '--app-primary': 'var(--primary)',
          '--app-bg': 'var(--bg-primary)',
          '--app-text': 'var(--text-primary)',
        } as React.CSSProperties}
      >
        {/* App will render here */}
      </div>
    </div>
  )
}

export default AppView
