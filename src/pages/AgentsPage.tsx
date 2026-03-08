import { useState } from 'react'
import { Search, Store, Bot, Code, Mail, MessageCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEntry } from '@/lib/openclaw-api'

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

// Display name: identity.name > name > id
function getAgentDisplayName(agent: AgentEntry): string {
  return agent.identity?.name ?? agent.name ?? agent.id
}

function AgentCard({ agent, onClick }: { agent: AgentEntry; onClick: () => void }) {
  const color = getAgentColor(agent.id)
  const displayName = getAgentDisplayName(agent)
  const emoji = agent.identity?.emoji

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--primary)] transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5"
      style={{ minHeight: 140 }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ backgroundColor: color }}
        >
          {emoji ? (
            <span>{emoji}</span>
          ) : (
            getAgentIcon(agent.id)
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-[var(--text-primary)] font-semibold text-base leading-tight">{displayName}</h3>
        <p className="text-[var(--text-muted)] text-xs font-mono">{agent.id}</p>
      </div>
    </div>
  )
}

// Agent Market Modal
function AgentMarketModal({ onClose }: { onClose: () => void }) {
  const [activeTag, setActiveTag] = useState('全部')
  const tags = ['全部', '客服', '开发', '营销', '数据分析', '自动化']

  const marketAgents = [
    { name: '客户支持助手', desc: '自动处理客户咨询与工单', color: '#dc2626', icon: <MessageCircle size={20} className="text-white" />, tag: '客服' },
    { name: '代码审查助手', desc: '审查 PR 并提供代码质量反馈', color: '#3b82f6', icon: <Code size={20} className="text-white" />, tag: '开发' },
    { name: '邮件自动化', desc: '自动处理邮件回复与跟进', color: '#8b5cf6', icon: <Mail size={20} className="text-white" />, tag: '营销' },
    { name: '数据分析师', desc: '分析业务数据并生成洞察报告', color: '#f59e0b', icon: <Bot size={20} className="text-white" />, tag: '数据分析' },
    { name: 'GitHub Copilot', desc: '智能代码补全与建议', color: '#10b981', icon: <Code size={20} className="text-white" />, tag: '开发' },
    { name: '社媒运营助手', desc: '自动生成和发布社交媒体内容', color: '#ec4899', icon: <Bot size={20} className="text-white" />, tag: '营销' },
  ]

  const filtered = activeTag === '全部' ? marketAgents : marketAgents.filter(a => a.tag === activeTag)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[800px] h-[600px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between h-[60px] px-8 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <Store size={20} className="text-[var(--primary)]" />
            <span className="text-[var(--text-primary)] font-semibold text-lg">代理市场</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">✕</button>
        </div>
        <div className="flex items-center gap-2 px-8 py-4 border-b border-[var(--border-color)] shrink-0">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTag === tag
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((agent, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: agent.color }}>{agent.icon}</div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm">{agent.name}</p>
                    <p className="text-[var(--text-muted)] text-xs">{agent.tag}</p>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{agent.desc}</p>
                <button className="w-full h-8 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity">安装</button>
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
}

export function AgentsPage({ agentsList, onSelectAgent, onRefresh }: AgentsPageProps) {
  const [search, setSearch] = useState('')
  const [showMarket, setShowMarket] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = agentsList.filter(a => {
    const name = (a.identity?.name ?? a.name ?? a.id).toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await onRefresh() } finally { setRefreshing(false) }
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto">
      <div className="flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[var(--text-primary)] text-3xl font-semibold">我的代理</h1>
            <span className="text-[var(--text-secondary)] text-sm">{agentsList.length} 个代理</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] w-[280px]">
              <Search size={18} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索代理..."
                className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw size={18} className={cn(refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={() => setShowMarket(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--primary)] transition-colors"
            >
              <Store size={18} />
              代理市场
            </button>
          </div>
        </div>

        {/* Content */}
        {agentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
              <Bot size={28} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-[var(--text-primary)] font-medium">暂无代理</p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">请在 OpenClaw 中配置代理后点击刷新</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
              刷新
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[var(--text-secondary)] text-sm">未找到匹配的代理</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {filtered.map(agent => (
              <AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent)} />
            ))}
          </div>
        )}
      </div>

      {showMarket && <AgentMarketModal onClose={() => setShowMarket(false)} />}
    </div>
  )
}
