/**
 * App Center Page
 *
 * Shows local apps by default, with a link to the app market.
 * Supports app lifecycle: Download -> Instantiate -> Run
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Search,
  Package,
  Globe,
  Folder,
  Plus,
  Copy,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApps, useAppMarket, useLocalApps } from '@/apps/store'
import type { InstalledApp, AppMarketEntry, AppCategory, LocalApp, AppInstance, DownloadedApp } from '@/apps/types'
import { useI18n } from '@/i18n'

type ViewMode = 'apps' | 'market' | 'install'

type AppCardProps = {
  app: AppMarketEntry | InstalledApp | LocalApp | DownloadedApp
  isLocal?: boolean
  isDownloaded?: boolean
  isLoading?: boolean
  instances?: AppInstance[]
  onInstall?: () => void
  onUninstall?: () => void
  onOpen?: () => void
  onInstantiate?: () => void
  onDeleteInstance?: (instanceId: string) => void
  onOpenInstance?: (instanceId: string) => void
}

function AppCard({
  app,
  isLocal,
  isDownloaded,
  isLoading,
  instances = [],
  onInstall,
  onUninstall,
  onOpen,
  onInstantiate,
  onDeleteInstance,
  onOpenInstance,
}: AppCardProps) {
  const { t, formatNumber } = useI18n()
  const [showInstances, setShowInstances] = useState(false)
  const isMarketEntry = 'downloadUrl' in app
  const manifest = isMarketEntry ? null : ('manifest' in app ? app.manifest : null)

  const categoryLabels: Record<AppCategory, string> = {
    productivity: t('appCenter.category.productivity'),
    communication: t('appCenter.category.communication'),
    development: t('appCenter.category.development'),
    entertainment: t('appCenter.category.entertainment'),
    utilities: t('appCenter.category.utilities'),
    other: t('appCenter.category.other'),
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors flex flex-col h-full">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-[var(--primary)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {isMarketEntry ? app.name : manifest?.name}
            </h3>
            {isLocal && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--primary)]/20 text-[var(--primary)] whitespace-nowrap">
                {t('appCenter.badge.local')}
              </span>
            )}
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] whitespace-nowrap">
              {categoryLabels[isMarketEntry ? app.category : manifest?.category || 'other']}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
            <span className="truncate">{isMarketEntry ? app.author : manifest?.author}</span>
            <span>v{isMarketEntry ? app.version : manifest?.version}</span>
            {isMarketEntry && app.downloads && (
              <span>{t('appCenter.downloadCount', { count: formatNumber(app.downloads) })}</span>
            )}
            {isMarketEntry && app.rating && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {app.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2 flex-1">
        {isMarketEntry ? app.description : manifest?.description}
      </p>

      <div className="flex items-center justify-end gap-2 shrink-0 mt-auto pt-4 border-t border-[var(--border-color)]">
        {isMarketEntry ? (
          <Button
            size="sm"
            variant="default"
            onClick={onInstall}
            disabled={isLoading}
            className="gap-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isLoading ? t('appCenter.downloadInProgress') : t('common.download')}
          </Button>
        ) : isDownloaded ? (
          <div className="flex items-center gap-2">
            {instances.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInstances(!showInstances)}
                className="gap-1"
              >
                <Copy className="w-4 h-4" />
                {t('appCenter.instancesCount', { count: instances.length })}
              </Button>
            )}
            {onInstantiate && (
              <Button
                size="sm"
                variant="default"
                onClick={onInstantiate}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                {t('appCenter.instantiate')}
              </Button>
            )}
            {onUninstall && (
              <Button
                size="sm"
                variant="outline"
                onClick={onUninstall}
                className="gap-1 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <>
            {onOpen && (
              <Button
                size="sm"
                variant="default"
                onClick={onOpen}
                className="gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {t('common.open')}
              </Button>
            )}
            {onUninstall && !isLocal && (
              <Button
                size="sm"
                variant="outline"
                onClick={onUninstall}
                className="gap-1 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {isDownloaded && showInstances && instances.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
          <div className="space-y-2">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      instance.enabled ? 'bg-green-500' : 'bg-gray-500'
                    )}
                  />
                  <span className="text-sm text-[var(--text-primary)] truncate">
                    {instance.displayName}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">
                    v{instance.appVersion}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onOpenInstance && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenInstance(instance.id)}
                      className="h-7 gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  {onDeleteInstance && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteInstance(instance.id)}
                      className="h-7 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type InstallTabProps = {
  onInstall: (url: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

function InstallTab({ onInstall, isLoading, error }: InstallTabProps) {
  const { t } = useI18n()
  const [url, setUrl] = useState('')

  const handleInstallUrl = async () => {
    if (url.trim()) {
      await onInstall(url.trim())
      setUrl('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          {t('appCenter.installTab.title')}
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder={t('appCenter.installTab.urlPlaceholder')}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="flex-1"
          />
          <Button onClick={handleInstallUrl} disabled={isLoading || !url.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.install')}
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {t('appCenter.installTab.help')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          {t('appCenter.installTab.sampleTitle')}
        </h4>
        <pre className="text-xs text-[var(--text-muted)] overflow-x-auto">
{`{
  "manifest": {
    "id": "my-app",
    "name": "my app",
    "version": "1.0.0",
    "entry": "main.js"
  },
  "files": {
    "main.js": "// App code"
  }
}`}
        </pre>
      </div>
    </div>
  )
}

type AppCenterPageProps = {
  onOpenApp?: (appId: string) => void
  sdkCallbacks?: any
}

export function AppCenterPage({ onOpenApp, sdkCallbacks }: AppCenterPageProps) {
  const { locale, t } = useI18n()
  const [viewMode, setViewMode] = useState<ViewMode>('apps')
  const [searchQuery, setSearchQuery] = useState('')
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [instantiatingId, setInstantiatingId] = useState<string | null>(null)
  const [instantiateDialogOpen, setInstantiateDialogOpen] = useState(false)
  const [instantiateAppId, setInstantiateAppId] = useState<string | null>(null)
  const [instantiateAppName, setInstantiateAppName] = useState('')
  const [instanceName, setInstanceName] = useState('')
  const [isLocalInstantiate, setIsLocalInstantiate] = useState(false)
  const [localAppToInstantiate, setLocalAppToInstantiate] = useState<LocalApp | null>(null)

  const {
    installedApps,
    downloadedApps,
    appInstances,
    isLoading: installedLoading,
    error: installedError,
    refresh,
    installFromUrl,
    uninstall,
    instantiateApp,
    deleteInstance,
    deleteDownloadedApp,
    downloadApp,
  } = useApps(sdkCallbacks)

  const {
    localApps,
    isLoading: localLoading,
    refresh: refreshLocal,
  } = useLocalApps()

  const {
    apps: marketApps,
    isLoading: marketLoading,
    refresh: refreshMarket,
  } = useAppMarket()

  useEffect(() => {
    void refreshMarket()
  }, [locale, refreshMarket])

  const handleInstall = async (app: AppMarketEntry) => {
    setInstallingId(app.id)
    try {
      const result = await installFromUrl(app.downloadUrl)
      if (!result.success) {
        console.error('Install failed:', result.error)
      }
    } finally {
      setInstallingId(null)
    }
  }

  const handleUninstall = async (appId: string) => {
    if (confirm(t('appCenter.confirmUninstall'))) {
      await uninstall(appId)
    }
  }

  const openInstantiateDialog = (appId: string, appName: string) => {
    setInstantiateAppId(appId)
    setInstantiateAppName(appName)
    setInstanceName('')
    setIsLocalInstantiate(false)
    setLocalAppToInstantiate(null)
    setInstantiateDialogOpen(true)
  }

  const openInstantiateLocalDialog = (localApp: LocalApp) => {
    setInstantiateAppId(localApp.id)
    setInstantiateAppName(localApp.manifest.name)
    setInstanceName('')
    setIsLocalInstantiate(true)
    setLocalAppToInstantiate(localApp)
    setInstantiateDialogOpen(true)
  }

  const handleConfirmInstantiate = async () => {
    if (!instantiateAppId) return

    const displayName = instanceName.trim() || undefined
    setInstantiatingId(instantiateAppId)
    setInstantiateDialogOpen(false)

    try {
      if (isLocalInstantiate && localAppToInstantiate) {
        await downloadApp(localAppToInstantiate.manifest, localAppToInstantiate.files, localAppToInstantiate.version)
        const result = await instantiateApp({ appId: instantiateAppId, displayName })
        if (!result.success) {
          console.error('Instantiation failed:', result.error)
          alert(t('appCenter.instantiateFailed', { message: result.error || '' }))
        } else if (result.instance) {
          onOpenApp?.(result.instance.id)
        }
      } else {
        const result = await instantiateApp({ appId: instantiateAppId, displayName })
        if (!result.success) {
          console.error('Instantiation failed:', result.error)
          alert(t('appCenter.instantiateFailed', { message: result.error || '' }))
        } else if (result.instance) {
          onOpenApp?.(result.instance.id)
        }
      }
    } finally {
      setInstantiatingId(null)
      setInstantiateAppId(null)
      setLocalAppToInstantiate(null)
    }
  }

  const handleInstantiate = (appId: string) => {
    const app = downloadedApps.find((entry) => entry.id === appId)
    openInstantiateDialog(appId, app?.manifest.name || appId)
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (confirm(t('appCenter.confirmDeleteInstance'))) {
      try {
        await deleteInstance(instanceId)
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        console.error('Delete instance failed:', err)
        alert(t('appCenter.deleteInstanceFailed', { message }))
      }
    }
  }

  const handleDeleteDownloadedApp = async (appId: string) => {
    if (confirm(t('appCenter.confirmDeleteApp'))) {
      try {
        await deleteDownloadedApp(appId)
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        console.error('Delete app failed:', err)
        alert(t('appCenter.deleteAppFailed', { message }))
      }
    }
  }

  const handleRefresh = () => {
    void refresh()
    void refreshLocal()
    void refreshMarket()
  }

  const filteredMarketApps = marketApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.name.toLowerCase().includes(query)
      || app.description.toLowerCase().includes(query)
      || app.author.toLowerCase().includes(query)
    )
  })

  const filteredInstalledApps = installedApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.manifest.name.toLowerCase().includes(query)
      || app.manifest.description.toLowerCase().includes(query)
      || app.manifest.author.toLowerCase().includes(query)
    )
  })

  const filteredLocalApps = localApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.manifest.name.toLowerCase().includes(query)
      || app.manifest.description.toLowerCase().includes(query)
      || app.manifest.author.toLowerCase().includes(query)
    )
  })

  const filteredDownloadedApps = downloadedApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.manifest.name.toLowerCase().includes(query)
      || app.manifest.description.toLowerCase().includes(query)
      || app.manifest.author.toLowerCase().includes(query)
    )
  })

  const marketAppsWithStatus = filteredMarketApps.map((app) => ({
    ...app,
    installed: installedApps.some((installed) => installed.id === app.id),
  }))

  const visibleAppCount = useMemo(() => {
    const ids = new Set<string>()
    filteredDownloadedApps.forEach((app) => ids.add(app.id))
    filteredLocalApps
      .filter((app) => !downloadedApps.some((downloaded) => downloaded.id === app.id))
      .forEach((app) => ids.add(app.id))
    filteredInstalledApps
      .filter((app) => !localApps.some((local) => local.id === app.id))
      .filter((app) => !downloadedApps.some((downloaded) => downloaded.id === app.id))
      .forEach((app) => ids.add(app.id))
    return ids.size
  }, [downloadedApps, filteredDownloadedApps, filteredInstalledApps, filteredLocalApps, localApps])

  const isLoading = localLoading || installedLoading || marketLoading

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {viewMode === 'apps' && t('appCenter.header.apps')}
            {viewMode === 'market' && t('appCenter.header.market')}
            {viewMode === 'install' && t('appCenter.header.install')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {viewMode === 'apps' && t('appCenter.subtitle.apps', { count: visibleAppCount })}
            {viewMode === 'market' && t('appCenter.subtitle.market')}
            {viewMode === 'install' && t('appCenter.subtitle.install')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'apps' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setViewMode('market')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {t('appCenter.toMarket')}
            </Button>
          )}
          {viewMode !== 'apps' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('apps')}
              className="gap-2"
            >
              <Folder className="w-4 h-4" />
              {t('appCenter.backToApps')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {viewMode !== 'install' && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder={t('appCenter.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            {viewMode === 'apps' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('install')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {t('appCenter.manualInstall')}
              </Button>
            )}
          </div>
        )}

        {viewMode === 'apps' && (
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : visibleAppCount === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t('appCenter.emptyTitle')}</p>
              <p className="text-sm mb-4">
                {t('appCenter.emptyDescription')} <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">apps/</code>
              </p>
              <Button
                variant="default"
                onClick={() => setViewMode('market')}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                {t('appCenter.goMarket')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDownloadedApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isDownloaded
                  instances={appInstances.filter((instance) => instance.appId === app.id)}
                  onInstantiate={() => handleInstantiate(app.id)}
                  onDeleteInstance={handleDeleteInstance}
                  onOpenInstance={(instanceId) => onOpenApp?.(instanceId)}
                  onUninstall={() => void handleDeleteDownloadedApp(app.id)}
                />
              ))}
              {filteredLocalApps
                .filter((app) => !downloadedApps.some((downloaded) => downloaded.id === app.id))
                .map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isDownloaded
                    isLocal
                    instances={appInstances.filter((instance) => instance.appId === app.id)}
                    onInstantiate={() => openInstantiateLocalDialog(app)}
                    onDeleteInstance={handleDeleteInstance}
                    onOpenInstance={(instanceId) => onOpenApp?.(instanceId)}
                  />
                ))}
              {filteredInstalledApps
                .filter((app) => !localApps.some((local) => local.id === app.id))
                .filter((app) => !downloadedApps.some((downloaded) => downloaded.id === app.id))
                .map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onOpen={() => onOpenApp?.(app.id)}
                    onUninstall={() => void handleUninstall(app.id)}
                  />
                ))}
            </div>
          )
        )}

        {viewMode === 'market' && (
          marketLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : marketAppsWithStatus.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              {t('appCenter.marketEmpty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {marketAppsWithStatus.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isLoading={installingId === app.id}
                  onInstall={() => void handleInstall(app)}
                  onOpen={() => onOpenApp?.(app.id)}
                />
              ))}
            </div>
          )
        )}

        {viewMode === 'install' && (
          <div className="max-w-2xl">
            <InstallTab
              onInstall={async (url) => {
                const result = await installFromUrl(url)
                if (result.success) {
                  setViewMode('apps')
                }
              }}
              isLoading={installingId !== null}
              error={installedError}
            />
          </div>
        )}
      </div>

      <Dialog open={instantiateDialogOpen} onOpenChange={setInstantiateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('appCenter.instantiateDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('appCenter.instantiateDialog.description', { name: instantiateAppName })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="instanceName" className="text-sm font-medium text-[var(--text-primary)]">
                {t('appCenter.instantiateDialog.name')}
              </label>
              <Input
                id="instanceName"
                placeholder={instantiateAppName ? `${instantiateAppName}-1` : t('appCenter.instantiateDialog.namePlaceholder')}
                value={instanceName}
                onChange={(event) => setInstanceName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleConfirmInstantiate()
                  }
                }}
              />
              <p className="text-xs text-[var(--text-muted)]">
                {t('appCenter.instantiateDialog.nameHint')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInstantiateDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void handleConfirmInstantiate()}
              disabled={instantiatingId !== null}
            >
              {instantiatingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('common.instantiating')}
                </>
              ) : (
                t('appCenter.instantiateDialog.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AppCenterPage
