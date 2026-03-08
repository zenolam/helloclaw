import { useState, useEffect, useCallback } from 'react'
import { Cpu, Radio, Loader2, RefreshCw, MessageSquare, Mail, Send, MessageCircle, Zap, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectionConfig } from '@/store/connection'
import type { ModelEntry, ChannelsStatusSnapshot } from '@/lib/openclaw-api'

type SettingsSection = 'model' | 'channel'

function formatLastConnected(ts?: number | null): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const CHANNEL_COLORS: Record<string, string> = {
  slack: '#10b98120', discord: '#5865f220', telegram: '#0088cc20',
  whatsapp: '#25d36620', signal: '#3a76f020', imessage: '#34c75920',
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
  const [activeSection, setActiveSection] = useState<SettingsSection>('model')

  // Models state
  const [models, setModels] = useState<ModelEntry[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  // Channels state
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

  // Load data when section changes
  useEffect(() => {
    if (activeSection === 'model') loadModels()
    else loadChannels()
  }, [activeSection, loadModels, loadChannels])

  const navItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: 'model', icon: <Cpu size={20} />, label: '模型' },
    { id: 'channel', icon: <Radio size={20} />, label: '频道' },
  ]

  // Build channel list from snapshot
  const channelList = channelsSnap
    ? channelsSnap.channelOrder.map(id => ({
        id,
        label: channelsSnap.channelLabels[id] ?? id,
        detailLabel: channelsSnap.channelDetailLabels?.[id] ?? '',
        accounts: channelsSnap.channelAccounts[id] ?? [],
      }))
    : []

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Settings Sidebar */}
      <div className="flex flex-col w-[280px] h-full bg-[var(--bg-secondary)] p-6 gap-2 shrink-0 border-r border-[var(--border-color)]">
        <h1 className="text-[var(--text-primary)] text-2xl font-semibold mb-2">设置</h1>
        {navItems.map(item => (
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

      {/* Settings Main */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto p-8 gap-6">

        {/* ── Model Section ── */}
        {activeSection === 'model' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-primary)] text-xl font-semibold">模型</h2>
              <button
                onClick={loadModels}
                disabled={modelsLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={cn(modelsLoading && 'animate-spin')} />
                刷新
              </button>
            </div>

            {/* Connection Info */}
            {config && (
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <h3 className="text-[var(--text-primary)] font-medium text-sm">连接信息</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] text-sm">服务器地址</span>
                    <span className="text-[var(--text-primary)] text-sm font-mono">{config.url}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] text-sm">连接状态</span>
                    <span className="flex items-center gap-1.5 text-green-400 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      已连接
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
                <p className="text-[var(--text-secondary)] text-sm">暂无模型配置</p>
                <p className="text-[var(--text-muted)] text-xs">请在 OpenClaw 中配置模型后刷新</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {models.map(model => (
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

        {/* ── Channel Section ── */}
        {activeSection === 'channel' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-primary)] text-xl font-semibold">频道</h2>
              <button
                onClick={loadChannels}
                disabled={channelsLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={cn(channelsLoading && 'animate-spin')} />
                刷新
              </button>
            </div>

            <p className="text-[var(--text-secondary)] text-sm">已在 OpenClaw 中配置的消息频道。</p>

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
                <p className="text-[var(--text-secondary)] text-sm">暂无已配置的频道</p>
                <p className="text-[var(--text-muted)] text-xs">请在 OpenClaw 中配置频道后刷新</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {channelList.map(ch => (
                  <div key={ch.id} className="flex flex-col gap-2">
                    {/* Channel header */}
                    <div className="flex items-center gap-2 px-1">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: CHANNEL_COLORS[ch.id] ?? '#3b82f620' }}
                      >
                        {CHANNEL_ICONS[ch.id] ?? <Radio size={12} className="text-[var(--text-secondary)]" />}
                      </div>
                      <span className="text-[var(--text-primary)] text-sm font-semibold">{ch.label}</span>
                      <span className="text-[var(--text-muted)] text-xs">({ch.accounts.length})</span>
                    </div>
                    {/* Accounts */}
                    {ch.accounts.map(acc => (
                      <div
                        key={acc.accountId}
                        className="flex items-center justify-between h-[72px] px-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: CHANNEL_COLORS[ch.id] ?? '#3b82f620' }}
                          >
                            {CHANNEL_ICONS[ch.id] ?? <Radio size={18} className="text-[var(--text-secondary)]" />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[var(--text-primary)] font-medium text-sm">
                              {acc.name ?? acc.accountId}
                            </span>
                            <span className="text-[var(--text-muted)] text-xs">
                              {acc.lastConnectedAt
                                ? `上次连接: ${formatLastConnected(acc.lastConnectedAt)}`
                                : acc.accountId
                              }
                            </span>
                            {acc.lastError && (
                              <span className="text-red-400 text-xs truncate max-w-[200px]">{acc.lastError}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acc.configured === false && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">未配置</span>
                          )}
                          <span className={cn(
                            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
                            (acc.running || acc.connected || acc.linked) ? 'bg-green-500/20 text-green-400'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          )}>
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              (acc.running || acc.connected || acc.linked) ? 'bg-green-400' : 'bg-[var(--text-muted)]'
                            )} />
                            {acc.running ? '运行中'
                              : acc.linked ? '已绑定'
                              : acc.connected ? '已连接'
                              : acc.configured ? '未运行'
                              : '未配置'}
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
      </div>
    </div>
  )
}
