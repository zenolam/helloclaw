/**
 * App View Component
 *
 * Renders a loaded app's UI within HelloClaw.
 */

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApps } from '@/apps/store'
import type { LoadedApp } from '@/apps/types'
import { useI18n } from '@/i18n'

type AppViewProps = {
  appId: string
  onBack: () => void
  sdkCallbacks?: any
}

function LoadingView() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      <span className="text-[var(--text-secondary)]">{t('appView.loading')}</span>
    </div>
  )
}

type ErrorViewProps = {
  error: string
  onBack: () => void
}

function ErrorView({ error, onBack }: ErrorViewProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {t('appView.errorTitle')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          {error}
        </p>
      </div>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </Button>
    </div>
  )
}

type AppSettingsViewProps = {
  loadedApp: LoadedApp
  onBack: () => void
}

function AppSettingsView({ loadedApp, onBack }: AppSettingsViewProps) {
  const { t } = useI18n()
  const { manifest, instance } = loadedApp
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (instance?.onSettingsRender && containerRef.current) {
      instance.onSettingsRender(containerRef.current)
    }
  }, [instance])

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('appView.backToApp')}
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {t('appView.settingsTitle', { name: manifest.name })}
          </h1>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-auto p-8">
        {instance?.onSettingsRender ? (
          <div className="text-[var(--text-muted)]" />
        ) : (
          <div className="text-center text-[var(--text-muted)] py-12">
            {t('appView.noSettings')}
          </div>
        )}
      </div>
    </div>
  )
}

export function AppView({ appId, onBack, sdkCallbacks }: AppViewProps) {
  const { t } = useI18n()
  const { loadInstance, getLoadedApp } = useApps(sdkCallbacks)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [loadedApp, setLoadedApp] = useState<LoadedApp | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const existing = getLoadedApp(appId)
      if (existing && existing.loadState === 'loaded') {
        if (mounted) setLoadedApp(existing)
        return
      }

      const result = await loadInstance(appId)
      if (mounted && result) {
        setLoadedApp(result)
      }
    }

    if (appId) {
      void load()
    }

    return () => {
      mounted = false
    }
  }, [appId, getLoadedApp, loadInstance])

  useEffect(() => {
    if (
      loadedApp?.loadState === 'loaded' &&
      loadedApp.instance &&
      loadedApp.sdk &&
      containerRef.current
    ) {
      containerRef.current.innerHTML = ''

      const sdk = loadedApp.sdk as any
      const views = sdk.views as Map<string, any> | undefined
      console.log('[AppView] SDK views:', views ? Array.from(views.keys()) : 'no views')

      let appView = views?.get(`${appId}-main`)
      if (!appView && views && views.size > 0) {
        appView = views.values().next().value
      }

      console.log('[AppView] App view:', appView)

      if (appView?.container) {
        containerRef.current.appendChild(appView.container)
        console.log('[AppView] Appended container to DOM')
      } else {
        console.warn('[AppView] No app view container found')
      }
    }
  }, [appId, loadedApp])

  if (!loadedApp || loadedApp.loadState === 'loading') {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </header>
        <LoadingView />
      </div>
    )
  }

  if (showSettings && loadedApp.loadState === 'loaded') {
    return (
      <AppSettingsView
        loadedApp={loadedApp}
        onBack={() => setShowSettings(false)}
      />
    )
  }

  if (loadedApp.loadState === 'error') {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </header>
        <ErrorView error={loadedApp.error || t('appView.unknownError')} onBack={onBack} />
      </div>
    )
  }

  if (!loadedApp) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-color)]">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {t('appView.notFoundTitle')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('appView.notFoundDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-4 px-8 py-6 border-b border-[var(--border-color)]">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        {loadedApp.instance?.onSettingsRender && (
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            {t('sidebar.nav.settings')}
          </Button>
        )}
      </header>
      <div ref={containerRef} className="flex-1 overflow-auto" />
    </div>
  )
}
