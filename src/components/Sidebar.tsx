import { MessageSquare, Bot, Settings, Moon, Sun, Puzzle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstanceSwitcher } from './InstanceSwitcher'
import type { Instance } from '@/store/instances'
import type { ConnectionConfig } from '@/store/connection'
import type { AppInstance, DownloadedApp } from '@/apps/types'
import { useI18n } from '@/i18n'

// Page type for navigation
export type Page = 'chat' | 'agents' | 'settings' | 'appCenter' | { type: 'appInstance'; instanceId: string }

type NavItem = 'chat' | 'agents' | 'settings' | 'appCenter'

type SidebarProps = {
  activePage: Page
  onNavigate: (page: Page) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  instances: Instance[]
  activeInstanceId: string | null
  onSwitchInstance: (id: string) => void
  onAddInstance: (name: string, config: ConnectionConfig) => Promise<Instance>
  onUpdateInstance: (id: string, updates: Partial<Pick<Instance, 'name' | 'config'>>) => void
  onRemoveInstance: (id: string) => void
  onDisconnectInstance?: () => void
  /** App instances to show in sidebar */
  appInstances: AppInstance[]
  /** Downloaded apps for getting manifest info */
  downloadedApps: DownloadedApp[]
}

export function Sidebar({
  activePage,
  onNavigate,
  theme,
  onToggleTheme,
  instances,
  activeInstanceId,
  onSwitchInstance,
  onAddInstance,
  onUpdateInstance,
  onRemoveInstance,
  onDisconnectInstance,
  appInstances,
  downloadedApps,
}: SidebarProps) {
  const { locale, setLocale, t } = useI18n()

  const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'chat', icon: <MessageSquare size={20} />, label: t('sidebar.nav.chat') },
    { id: 'agents', icon: <Bot size={20} />, label: t('sidebar.nav.agents') },
    { id: 'appCenter', icon: <Puzzle size={20} />, label: t('sidebar.nav.apps') },
    { id: 'settings', icon: <Settings size={20} />, label: t('sidebar.nav.settings') },
  ]

  // Helper to get Lucide icon by name
  const getIcon = (iconName: string): React.ReactNode => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>
    const Icon = icons[iconName]
    return Icon ? <Icon size={20} /> : <Puzzle size={20} />
  }

  // Helper to check if a page is active
  const isPageActive = (page: Page): boolean => {
    if (typeof activePage === 'string') {
      return activePage === page
    }
    if (typeof page === 'object' && page.type === 'appInstance') {
      return typeof activePage === 'object' && activePage.type === 'appInstance' && activePage.instanceId === page.instanceId
    }
    return false
  }

  // Create a map of downloaded apps for quick lookup
  const downloadedAppsMap = new Map(downloadedApps.map(app => [app.id, app]))

  // Filter enabled app instances that should show in sidebar
  const sidebarAppInstances = appInstances.filter((instance) => {
    if (!instance.enabled) return false
    const downloadedApp = downloadedAppsMap.get(instance.appId)
    console.log('[Sidebar] Instance:', instance.id, 'appId:', instance.appId, 'downloadedApp found:', !!downloadedApp, 'sidebar.show:', downloadedApp?.manifest?.sidebar?.show)
    return downloadedApp?.manifest.sidebar?.show ?? false
  })

  console.log('[Sidebar] appInstances:', appInstances.length, 'downloadedApps:', downloadedApps.length, 'sidebarAppInstances:', sidebarAppInstances.length, 'downloadedApp IDs:', downloadedApps.map(a => a.id))

  // Sort by creation time
  sidebarAppInstances.sort((a, b) => a.createdAt - b.createdAt)

  return (
    <aside className="flex flex-col w-60 h-full bg-[var(--bg-secondary)] px-5 py-6 gap-2 shrink-0 border-r border-[var(--border-color)]">
      {/* Logo */}
      <div className="flex items-center gap-3 h-10 mb-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <span className="text-[var(--text-primary)] font-semibold text-xl">HelloClaw</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 pt-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors w-full text-left',
              isPageActive(item.id)
                ? 'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        {/* Dynamic App Instance Entries */}
        {sidebarAppInstances.length > 0 && (
          <>
            <div className="h-px bg-[var(--border-color)] my-2" />
            {sidebarAppInstances.map((instance) => {
              const downloadedApp = downloadedAppsMap.get(instance.appId)
              const sidebarConfig = downloadedApp?.manifest.sidebar
              return (
                <button
                  key={instance.id}
                  onClick={() => onNavigate({ type: 'appInstance', instanceId: instance.id })}
                  className={cn(
                    'flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors w-full text-left',
                    isPageActive({ type: 'appInstance', instanceId: instance.id })
                      ? 'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {getIcon(sidebarConfig?.icon || 'Puzzle')}
                  <span>{instance.displayName}</span>
                </button>
              )
            })}
          </>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="flex items-center rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-0.5 h-10">
          <button
            onClick={() => void setLocale('zh-CN')}
            title={t('locale.zh-CN')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium transition-colors',
              locale === 'zh-CN'
                ? 'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            中
          </button>
          <button
            onClick={() => void setLocale('en-US')}
            title={t('locale.en-US')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium transition-colors',
              locale === 'en-US'
                ? 'border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            EN
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={theme === 'dark' ? t('sidebar.theme.toLight') : t('sidebar.theme.toDark')}
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Instance Switcher */}
      <InstanceSwitcher
        instances={instances}
        activeInstanceId={activeInstanceId}
        onSwitch={onSwitchInstance}
        onAdd={onAddInstance}
        onUpdate={onUpdateInstance}
        onRemove={onRemoveInstance}
        onDisconnect={onDisconnectInstance}
      />
    </aside>
  )
}
