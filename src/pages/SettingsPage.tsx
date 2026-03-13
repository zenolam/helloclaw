import { useState, useEffect, useCallback } from 'react'
import { Cpu, Radio, Loader2, RefreshCw, MessageSquare, Send, MessageCircle, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectionConfig } from '@/store/connection'
import type { ModelEntry, ChannelsStatusSnapshot, ChannelAccountSnapshot } from '@/lib/openclaw-api'
import { SUPPORTED_LOCALES, type Locale, useI18n } from '@/i18n'

type SettingsSection = 'model' | 'channel' | 'language'

const CHANNEL_COLORS: Record<string, string> = {
  slack: '#10b98120',
  discord: '#5865f220',
  telegram: '#0088cc20',
  whatsapp: '#25d36620',
  signal: '#3a76f020',
  imessage: '#34c75920',
  web: '#6366f120',
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  slack: <MessageSquare size={18} className="text-[#10b981]" />,
  discord: <MessageSquare size={18} className="text-[#5865f2]" />,
  telegram: <Send size={18} className="text-[#0088cc]" />,
  whatsapp: <MessageCircle size={18} className="text-[#25d366]" />,
  signal: <Radio size={18} className="text-[#3a76f0]" />,
  imessage: <MessageCircle size={18} className="text-[#34c759]" />,
  web: <Globe size={18} className="text-[#6366f1]" />,
}

type SettingsPageProps = {
  config: ConnectionConfig | null
  fetchModels: () => Promise<ModelEntry[]>
  fetchChannels: () => Promise<ChannelsStatusSnapshot | null>
}

export function SettingsPage({ config, fetchModels, fetchChannels }: SettingsPageProps) {
  const { locale, setLocale, t, formatDateTime } = useI18n()
  const [activeSection, setActiveSection] = useState<SettingsSection>('model')
  const [models, setModels] = useState<ModelEntry[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [channelsSnap, setChannelsSnap] = useState<ChannelsStatusSnapshot | null>(null)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [channelsError, setChannelsError] = useState<string | null>(null)

  const loadModels = useCallback(async () => {
    setModelsLoading(true)
    setModelsError(null)
    try {
      const list = await fetchModels()
      setModels(list)
    } catch (err) {
      setModelsError(String(err))
    } finally {
      setModelsLoading(false)
    }
  }, [fetchModels])

  const loadChannels = useCallback(async () => {
    setChannelsLoading(true)
    setChannelsError(null)
    try {
      const snap = await fetchChannels()
      setChannelsSnap(snap)
    } catch (err) {
      setChannelsError(String(err))
    } finally {
      setChannelsLoading(false)
    }
  }, [fetchChannels])

  useEffect(() => {
    if (activeSection === 'model') {
      void loadModels()
    } else if (activeSection === 'channel') {
      void loadChannels()
    }
  }, [activeSection, loadChannels, loadModels])

  const navItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: 'model', icon: <Cpu size={20} />, label: t('settings.nav.models') },
    { id: 'channel', icon: <Radio size={20} />, label: t('settings.nav.channels') },
    { id: 'language', icon: <Globe size={20} />, label: t('settings.nav.language') },
  ]

  const channelList = channelsSnap
    ? channelsSnap.channelOrder.map((id) => ({
        id,
        label: channelsSnap.channelLabels[id] ?? id,
        detailLabel: channelsSnap.channelDetailLabels?.[id] ?? '',
        accounts: channelsSnap.channelAccounts[id] ?? [],
      }))
    : []

  const getLastConnectedText = (ts?: number | null) => {
    if (!ts) return '-'
    return formatDateTime(ts, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getChannelStatus = (account: Pick<ChannelAccountSnapshot, 'running' | 'connected' | 'linked' | 'configured'>) => {
    if (account.running) return t('settings.channels.status.running')
    if (account.linked) return t('settings.channels.status.linked')
    if (account.connected) return t('settings.channels.status.connected')
    if (account.configured) return t('settings.channels.status.stopped')
    return t('settings.channels.unconfigured')
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex flex-col w-[280px] h-full bg-[var(--bg-secondary)] p-6 gap-2 shrink-0 border-r border-[var(--border-color)]">
        <h1 className="text-[var(--text-primary)] text-2xl font-semibold mb-2">{t('settings.title')}</h1>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              'flex items-center gap-3 h-11 px-4 rounded-lg text-sm font-medium transition-colors w-full text-left',
              activeSection === item.id
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'model' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-primary)] text-xl font-semibold">{t('settings.models.title')}</h2>
              <button
                onClick={() => void loadModels()}
                disabled={modelsLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={cn(modelsLoading && 'animate-spin')} />
                {t('common.refresh')}
              </button>
            </div>

            {config && (
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <h3 className="text-[var(--text-primary)] font-medium text-sm">{t('settings.connectionInfo.title')}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] text-sm">{t('settings.connectionInfo.serverUrl')}</span>
                    <span className="text-[var(--text-primary)] text-sm font-mono">{config.url}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] text-sm">{t('settings.connectionInfo.status')}</span>
                    <span className="flex items-center gap-1.5 text-green-400 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {t('settings.connectionInfo.connected')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {modelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : modelsError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{modelsError}</p>
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed">
                <Cpu size={28} className="text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)] text-sm">{t('settings.models.emptyTitle')}</p>
                <p className="text-[var(--text-muted)] text-xs">{t('settings.models.emptyDescription')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                        <Cpu size={20} className="text-[var(--primary)]" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[var(--text-primary)] font-medium text-sm">{model.name ?? model.id}</span>
                        <span className="text-[var(--text-muted)] text-xs font-mono">{model.id}</span>
                        {model.provider && (
                          <span className="text-[var(--text-muted)] text-xs">{model.provider}</span>
                        )}
                      </div>
                    </div>
                    {model.status && (
                      <span className={cn(
                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
                        model.status === 'active' || model.status === 'ok'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          model.status === 'active' || model.status === 'ok' ? 'bg-green-400' : 'bg-[var(--text-muted)]'
                        )} />
                        {model.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'channel' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-primary)] text-xl font-semibold">{t('settings.channels.title')}</h2>
              <button
                onClick={() => void loadChannels()}
                disabled={channelsLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={cn(channelsLoading && 'animate-spin')} />
                {t('common.refresh')}
              </button>
            </div>

            <p className="text-[var(--text-secondary)] text-sm">{t('settings.channels.description')}</p>

            {channelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : channelsError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{channelsError}</p>
              </div>
            ) : channelList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed">
                <Radio size={28} className="text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)] text-sm">{t('settings.channels.emptyTitle')}</p>
                <p className="text-[var(--text-muted)] text-xs">{t('settings.channels.emptyDescription')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {channelList.map((channel) => (
                  <div key={channel.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: CHANNEL_COLORS[channel.id] ?? '#3b82f620' }}
                      >
                        {CHANNEL_ICONS[channel.id] ?? <Radio size={12} className="text-[var(--text-secondary)]" />}
                      </div>
                      <span className="text-[var(--text-primary)] text-sm font-semibold">{channel.label}</span>
                      <span className="text-[var(--text-muted)] text-xs">({channel.accounts.length})</span>
                    </div>
                    {channel.accounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between h-[72px] px-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: CHANNEL_COLORS[channel.id] ?? '#3b82f620' }}
                          >
                            {CHANNEL_ICONS[channel.id] ?? <Radio size={18} className="text-[var(--text-secondary)]" />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[var(--text-primary)] font-medium text-sm">
                              {account.name ?? account.accountId}
                            </span>
                            <span className="text-[var(--text-muted)] text-xs">
                              {account.lastConnectedAt
                                ? t('settings.channels.lastConnected', { time: getLastConnectedText(account.lastConnectedAt) })
                                : account.accountId
                              }
                            </span>
                            {account.lastError && (
                              <span className="text-red-400 text-xs truncate max-w-[200px]">{account.lastError}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.configured === false && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">{t('settings.channels.unconfigured')}</span>
                          )}
                          <span className={cn(
                            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
                            (account.running || account.connected || account.linked)
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          )}>
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              (account.running || account.connected || account.linked) ? 'bg-green-400' : 'bg-[var(--text-muted)]'
                            )} />
                            {getChannelStatus(account)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'language' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-[var(--text-primary)] text-xl font-semibold">{t('settings.language.title')}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{t('settings.language.description')}</p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-sm">{t('settings.language.current')}</span>
                <span className="text-[var(--text-primary)] text-sm font-medium">{t(`locale.${locale}` as `locale.${Locale}`)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORTED_LOCALES.map((item) => (
                <button
                  key={item}
                  onClick={() => void setLocale(item)}
                  className={cn(
                    'flex flex-col items-start gap-2 p-5 rounded-xl border text-left transition-colors',
                    locale === item
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--primary)]'
                  )}
                >
                  <span className={cn(
                    'text-base font-semibold',
                    locale === item ? 'text-white' : 'text-[var(--text-primary)]'
                  )}>
                    {t(`locale.${item}` as `locale.${Locale}`)}
                  </span>
                  <span className={cn(
                    'text-sm',
                    locale === item ? 'text-white/80' : 'text-[var(--text-secondary)]'
                  )}>
                    {t(`settings.language.option.${item}.description` as `settings.language.option.${Locale}.description`)}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <h3 className="text-[var(--text-primary)] font-medium text-sm mb-2">{t('settings.language.extensible')}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{t('settings.language.extensibleDescription')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
