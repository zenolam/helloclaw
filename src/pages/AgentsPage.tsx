import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { Search, Store, Bot, Code, Mail, MessageCircle, RefreshCw, Plus, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEntry } from '@/lib/openclaw-api'
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
import { translate, useI18n } from '@/i18n'

const AGENT_COLORS = [
  '#dc2626', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#84cc16',
]

function getAgentColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
}

function getAgentIcon(id: string, size = 24) {
  const lower = id.toLowerCase()
  if (lower.includes('code') || lower.includes('dev')) return <Code size={size} className="text-white" />
  if (lower.includes('mail') || lower.includes('email')) return <Mail size={size} className="text-white" />
  if (lower.includes('chat') || lower.includes('support')) return <MessageCircle size={size} className="text-white" />
  return <Bot size={size} className="text-white" />
}

function getAgentDisplayName(agent: AgentEntry): string {
  return agent.identity?.name ?? agent.name ?? agent.id
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : translate('agents.operationFailed')
}

type ContextMenuState = {
  agent: AgentEntry
  x: number
  y: number
}

function AgentCard({
  agent,
  onClick,
  onContextMenu,
  busy = false,
}: {
  agent: AgentEntry
  onClick: () => void
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void
  busy?: boolean
}) {
  const color = getAgentColor(agent.id)
  const displayName = getAgentDisplayName(agent)
  const emoji = agent.identity?.emoji

  return (
    <div
      onClick={busy ? undefined : onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--primary)] transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5',
        busy && 'opacity-60 pointer-events-none'
      )}
      style={{ minHeight: 140 }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ backgroundColor: color }}
        >
          {emoji ? <span>{emoji}</span> : getAgentIcon(agent.id)}
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-[var(--text-primary)] font-semibold text-base leading-tight">{displayName}</h3>
        <p className="text-[var(--text-muted)] text-xs font-mono">{agent.id}</p>
      </div>
    </div>
  )
}

function AgentMarketModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [activeTag, setActiveTag] = useState<'all' | 'support' | 'development' | 'marketing' | 'analytics' | 'automation'>('all')
  const tags = [
    { id: 'all' as const, label: t('agents.market.tags.all') },
    { id: 'support' as const, label: t('agents.market.tags.support') },
    { id: 'development' as const, label: t('agents.market.tags.development') },
    { id: 'marketing' as const, label: t('agents.market.tags.marketing') },
    { id: 'analytics' as const, label: t('agents.market.tags.analytics') },
    { id: 'automation' as const, label: t('agents.market.tags.automation') },
  ]

  const marketAgents = [
    { name: t('agents.market.items.support.name'), desc: t('agents.market.items.support.description'), color: '#dc2626', icon: <MessageCircle size={20} className="text-white" />, tag: 'support' as const },
    { name: t('agents.market.items.review.name'), desc: t('agents.market.items.review.description'), color: '#3b82f6', icon: <Code size={20} className="text-white" />, tag: 'development' as const },
    { name: t('agents.market.items.mail.name'), desc: t('agents.market.items.mail.description'), color: '#8b5cf6', icon: <Mail size={20} className="text-white" />, tag: 'marketing' as const },
    { name: t('agents.market.items.data.name'), desc: t('agents.market.items.data.description'), color: '#f59e0b', icon: <Bot size={20} className="text-white" />, tag: 'analytics' as const },
    { name: t('agents.market.items.copilot.name'), desc: t('agents.market.items.copilot.description'), color: '#10b981', icon: <Code size={20} className="text-white" />, tag: 'development' as const },
    { name: t('agents.market.items.social.name'), desc: t('agents.market.items.social.description'), color: '#ec4899', icon: <Bot size={20} className="text-white" />, tag: 'marketing' as const },
  ]

  const filtered = activeTag === 'all' ? marketAgents : marketAgents.filter((agent) => agent.tag === activeTag)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[800px] h-[600px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between h-[60px] px-8 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <Store size={20} className="text-[var(--primary)]" />
            <span className="text-[var(--text-primary)] font-semibold text-lg">{t('agents.market')}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">✕</button>
        </div>
        <div className="flex items-center gap-2 px-8 py-4 border-b border-[var(--border-color)] shrink-0">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(tag.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTag === tag.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((agent, index) => (
              <div key={index} className="flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: agent.color }}>{agent.icon}</div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm">{agent.name}</p>
                    <p className="text-[var(--text-muted)] text-xs">{tags.find((tag) => tag.id === agent.tag)?.label}</p>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{agent.desc}</p>
                <button className="w-full h-8 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity">{t('common.install')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type AgentsPageProps = {
  agentsList: AgentEntry[]
  onSelectAgent: (agent: AgentEntry) => void
  onRefresh: () => void
  onCreateAgent: (name: string) => Promise<void>
  onDeleteAgent: (agentId: string) => Promise<void>
}

export function AgentsPage({
  agentsList,
  onSelectAgent,
  onRefresh,
  onCreateAgent,
  onDeleteAgent,
}: AgentsPageProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [showMarket, setShowMarket] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const filtered = agentsList.filter((agent) => {
    const name = (agent.identity?.name ?? agent.name ?? agent.id).toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  const openCreateDialog = useCallback(() => {
    closeContextMenu()
    setCreateError(null)
    setNewAgentName('')
    setCreateDialogOpen(true)
  }, [closeContextMenu])

  const handleCreateAgent = useCallback(async () => {
    const trimmedName = newAgentName.trim()
    if (!trimmedName) {
      setCreateError(t('agents.createDialog.required'))
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      await onCreateAgent(trimmedName)
      setCreateDialogOpen(false)
      setNewAgentName('')
    } catch (err) {
      setCreateError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }, [newAgentName, onCreateAgent, t])

  const handleDeleteAgent = useCallback(async (agent: AgentEntry) => {
    closeContextMenu()

    const displayName = getAgentDisplayName(agent)
    const confirmed = window.confirm(t('agents.confirmDelete', { name: displayName }))
    if (!confirmed) return

    setDeletingAgentId(agent.id)
    try {
      await onDeleteAgent(agent.id)
    } catch (err) {
      window.alert(t('agents.deleteFailed', { message: getErrorMessage(err) }))
    } finally {
      setDeletingAgentId(null)
    }
  }, [closeContextMenu, onDeleteAgent, t])

  const handleAgentContextMenu = useCallback((event: MouseEvent<HTMLDivElement>, agent: AgentEntry) => {
    event.preventDefault()
    setContextMenu({
      agent,
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  useEffect(() => {
    void handleRefresh()
  }, [handleRefresh])

  useEffect(() => {
    if (!contextMenu) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [contextMenu, closeContextMenu])

  const contextMenuPosition = contextMenu && typeof window !== 'undefined'
    ? {
        left: Math.max(12, Math.min(contextMenu.x, window.innerWidth - 196)),
        top: Math.max(12, Math.min(contextMenu.y, window.innerHeight - 116)),
      }
    : null

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto">
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[var(--text-primary)] text-3xl font-semibold">{t('agents.title')}</h1>
            <span className="text-[var(--text-secondary)] text-sm">{t('agents.count', { count: agentsList.length })}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] w-[280px]">
              <Search size={18} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('agents.searchPlaceholder')}
                className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              title={t('common.refresh')}
            >
              <RefreshCw size={18} className={cn(refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={() => setShowMarket(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--primary)] transition-colors"
            >
              <Store size={18} />
              {t('agents.market')}
            </button>
          </div>
        </div>

        {agentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
              <Bot size={28} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-[var(--text-primary)] font-medium">{t('agents.emptyTitle')}</p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{t('agents.emptyDescription')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateDialog}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                {t('agents.create')}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--primary)] transition-colors"
              >
                <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[var(--text-secondary)] text-sm">{t('agents.noMatch')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                busy={deletingAgentId === agent.id}
                onClick={() => onSelectAgent(agent)}
                onContextMenu={(event) => handleAgentContextMenu(event, agent)}
              />
            ))}
          </div>
        )}
      </div>

      {showMarket && <AgentMarketModal onClose={() => setShowMarket(false)} />}

      {contextMenu && contextMenuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={(event) => {
              event.preventDefault()
              closeContextMenu()
            }}
          />
          <div
            className="fixed z-50 min-w-[180px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 shadow-2xl"
            style={contextMenuPosition}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            <button
              onClick={openCreateDialog}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
            >
              <Plus size={16} />
              {t('agents.create')}
            </button>
            <button
              onClick={() => void handleDeleteAgent(contextMenu.agent)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              {t('agents.delete')}
            </button>
          </div>
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t('agents.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('agents.createDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="agent-name" className="text-sm font-medium text-[var(--text-primary)]">
              {t('agents.createDialog.name')}
            </label>
            <Input
              id="agent-name"
              value={newAgentName}
              onChange={(event) => setNewAgentName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleCreateAgent()
                }
              }}
              placeholder={t('agents.createDialog.placeholder')}
              autoFocus
            />
            {createError && (
              <p className="text-sm text-red-400">{createError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateAgent()}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('common.instantiating')}
                </>
              ) : (
                t('common.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
