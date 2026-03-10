/**
 * App Center Page
 *
 * Shows local apps by default, with a link to the app market.
 */

import { useState } from 'react'
import {
  Store,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Package,
  Globe,
  Folder,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApps, useAppMarket, useLocalApps } from '@/apps/store'
import type { InstalledApp, AppMarketEntry, AppCategory, LocalApp } from '@/apps/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = 'apps' | 'market' | 'install'

// ─────────────────────────────────────────────────────────────────────────────
// App Card Component
// ─────────────────────────────────────────────────────────────────────────────

type AppCardProps = {
  app: AppMarketEntry | InstalledApp | LocalApp
  isInstalled?: boolean
  isLocal?: boolean
  isLoading?: boolean
  onInstall?: () => void
  onUninstall?: () => void
  onOpen?: () => void
}

function AppCard({
  app,
  isInstalled,
  isLocal,
  isLoading,
  onInstall,
  onUninstall,
  onOpen,
}: AppCardProps) {
  const isMarketEntry = 'downloadUrl' in app
  const manifest = isMarketEntry ? null : ('manifest' in app ? app.manifest : null)

  const categoryLabels: Record<AppCategory, string> = {
    productivity: '效率',
    communication: '沟通',
    development: '开发',
    entertainment: '娱乐',
    utilities: '工具',
    other: '其他',
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-[var(--primary)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {isMarketEntry ? app.name : manifest?.name}
            </h3>
            {isLocal && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">
                本地
              </span>
            )}
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              {categoryLabels[isMarketEntry ? app.category : manifest?.category || 'other']}
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
            {isMarketEntry ? app.description : manifest?.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>{isMarketEntry ? app.author : manifest?.author}</span>
            <span>v{isMarketEntry ? app.version : manifest?.version}</span>
            {isMarketEntry && app.downloads && (
              <span>{app.downloads.toLocaleString()} 次下载</span>
            )}
            {isMarketEntry && app.rating && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {app.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isInstalled || isLocal ? (
            <>
              {onOpen && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onOpen}
                  className="gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  打开
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
          ) : (
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
              {isLoading ? '安装中...' : '安装'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Install from URL/JSON Tab
// ─────────────────────────────────────────────────────────────────────────────

type InstallTabProps = {
  onInstall: (url: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

function InstallTab({ onInstall, isLoading, error }: InstallTabProps) {
  const [url, setUrl] = useState('')
  const [jsonInput, setJsonInput] = useState('')

  const handleInstallUrl = async () => {
    if (url.trim()) {
      await onInstall(url.trim())
      setUrl('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Install from URL */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          从 URL 安装
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="输入应用包 URL (JSON 格式)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleInstallUrl} disabled={isLoading || !url.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '安装'}
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          支持 GitHub Raw URL 或任何托管应用包的 URL
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Demo App */}
      <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          示例应用包格式
        </h4>
        <pre className="text-xs text-[var(--text-muted)] overflow-x-auto">
{`{
  "manifest": {
    "id": "my-app",
    "name": "我的应用",
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type AppCenterPageProps = {
  onOpenApp?: (appId: string) => void
}

export function AppCenterPage({ onOpenApp }: AppCenterPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('apps')
  const [searchQuery, setSearchQuery] = useState('')
  const [installingId, setInstallingId] = useState<string | null>(null)

  const {
    installedApps,
    isLoading: installedLoading,
    error: installedError,
    refresh,
    installFromUrl,
    uninstall,
  } = useApps()

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
    if (confirm('确定要卸载此应用吗？')) {
      await uninstall(appId)
    }
  }

  const handleRefresh = () => {
    refresh()
    refreshLocal()
    refreshMarket()
  }

  // Filter apps by search query
  const filteredMarketApps = marketApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      app.author.toLowerCase().includes(query)
    )
  })

  const filteredInstalledApps = installedApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.manifest.name.toLowerCase().includes(query) ||
      app.manifest.description.toLowerCase().includes(query) ||
      app.manifest.author.toLowerCase().includes(query)
    )
  })

  const filteredLocalApps = localApps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.manifest.name.toLowerCase().includes(query) ||
      app.manifest.description.toLowerCase().includes(query) ||
      app.manifest.author.toLowerCase().includes(query)
    )
  })

  // Mark installed apps in market list
  const marketAppsWithStatus = filteredMarketApps.map((app) => ({
    ...app,
    installed: installedApps.some((i) => i.id === app.id),
  }))

  const isLoading = localLoading || installedLoading || marketLoading

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {viewMode === 'apps' && '应用'}
            {viewMode === 'market' && '应用市场'}
            {viewMode === 'install' && '手动安装'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {viewMode === 'apps' && `${localApps.length + installedApps.length} 个应用`}
            {viewMode === 'market' && '发现和安装更多应用'}
            {viewMode === 'install' && '从 URL 安装应用'}
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
              应用市场
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
              返回应用
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Search Bar */}
        {viewMode !== 'install' && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="搜索应用..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                手动安装
              </Button>
            )}
          </div>
        )}

        {/* Apps View */}
        {viewMode === 'apps' && (
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (filteredLocalApps.length + filteredInstalledApps.length) === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">暂无应用</p>
              <p className="text-sm mb-4">
                将应用放入 <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">apps/</code> 目录
              </p>
              <Button
                variant="default"
                onClick={() => setViewMode('market')}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                去应用市场
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Local Apps */}
              {filteredLocalApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isLocal={true}
                  onOpen={() => onOpenApp?.(app.id)}
                />
              ))}
              {/* Installed Apps (excluding local ones) */}
              {filteredInstalledApps
                .filter((app) => !localApps.some((local) => local.id === app.id))
                .map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={true}
                    onOpen={() => onOpenApp?.(app.id)}
                    onUninstall={() => handleUninstall(app.id)}
                  />
                ))}
            </div>
          )
        )}

        {/* Market View */}
        {viewMode === 'market' && (
          marketLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : marketAppsWithStatus.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              暂无应用
            </div>
          ) : (
            <div className="grid gap-4">
              {marketAppsWithStatus.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isInstalled={app.installed}
                  isLoading={installingId === app.id}
                  onInstall={() => handleInstall(app)}
                  onOpen={() => onOpenApp?.(app.id)}
                />
              ))}
            </div>
          )
        )}

        {/* Manual Install View */}
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
    </div>
  )
}

export default AppCenterPage
