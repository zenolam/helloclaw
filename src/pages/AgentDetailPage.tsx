import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Bot, Code, Mail, MessageCircle, Pencil,
  Plus, Clock, Eye, MessageSquare, Send,
  Zap, Radio, CheckCircle, XCircle, Loader2, Trash2, RefreshCw,
  FileText, Info, X, Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEntry, CronJob, CronRunLogEntry, ChannelsStatusSnapshot, ToolEntry, AgentFileEntry, AgentsFilesListResult } from '@/lib/openclaw-api'

const AGENT_COLORS = [
  '#dc2626', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#84cc16',
]

function getAgentColor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
}

function getAgentIcon(agentId: string, size = 32) {
  const lower = agentId.toLowerCase()
  if (lower.includes('code') || lower.includes('dev')) return <Code size={size} className="text-white" />
  if (lower.includes('mail') || lower.includes('email')) return <Mail size={size} className="text-white" />
  if (lower.includes('chat') || lower.includes('support')) return <MessageCircle size={size} className="text-white" />
  return <Bot size={size} className="text-white" />
}

function formatCronSchedule(job: CronJob): string {
  const s = job.schedule
  if (s.kind === 'at') return `一次性: ${new Date(s.at).toLocaleString('zh-CN')}`
  if (s.kind === 'every') {
    const ms = s.everyMs
    if (ms >= 86400000) return `每 ${ms / 86400000} 天`
    if (ms >= 3600000) return `每 ${ms / 3600000} 小时`
    return `每 ${ms / 60000} 分钟`
  }
  return `Cron: ${s.expr}`
}

function formatTs(ts?: number | null): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// File descriptions for tooltip
const FILE_DESCRIPTIONS: Record<string, string> = {
  'AGENT.md': '定义代理的核心行为、角色和指令',
  'SOUL.md': '代理的个性、价值观和沟通风格',
  'TOOLS.md': '代理可用工具的使用指南',
  'IDENTITY.md': '代理的身份信息和自我认知',
  'AGENTS.md': '多代理协作规则和团队配置',
  'USER.md': '用户偏好和个性化设置',
  'BOOT.md': '启动时执行的初始化指令',
  'HEARTBEAT.md': '定期心跳任务的执行逻辑',
  'BOOTSTRAP.md': '首次运行的引导和初始化流程',
}

// Edit File Modal
function EditFileModal({
  file,
  agentId,
  onClose,
  onSave,
  fetchFileContent,
}: {
  file: AgentFileEntry
  agentId: string
  onClose: () => void
  onSave: (name: string, content: string) => Promise<void>
  fetchFileContent: (agentId: string, name: string) => Promise<string>
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchFileContent(agentId, file.name)
      .then(c => { setContent(c); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [agentId, file.name, fetchFileContent])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(file.name, content)
      onClose()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[560px] max-h-[80vh] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-[var(--primary)]" />
            <span className="text-[var(--text-primary)] font-semibold text-sm">编辑 {file.name}</span>
            {file.missing && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">新建</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        {FILE_DESCRIPTIONS[file.name] && (
          <div className="px-5 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center gap-2">
            <Info size={13} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)] text-xs">{FILE_DESCRIPTIONS[file.name]}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-5 gap-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 w-full min-h-[280px] px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-mono resize-none focus:outline-none focus:border-[var(--primary)] transition-colors leading-relaxed"
              placeholder={`# ${file.name}\n\n在此输入内容...`}
              spellCheck={false}
            />
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 h-14 px-5 border-t border-[var(--border-color)] shrink-0">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="h-8 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// Execution Records Modal
function ExecutionRecordsModal({
  jobName,
  jobId,
  onClose,
  fetchCronRuns,
}: {
  jobName: string
  jobId: string
  onClose: () => void
  fetchCronRuns: (jobId: string) => Promise<CronRunLogEntry[]>
}) {
  const [records, setRecords] = useState<CronRunLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchCronRuns(jobId).then(entries => {
      setRecords(entries)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [jobId, fetchCronRuns])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[560px] h-[480px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--border-color)] shrink-0">
          <span className="text-[var(--text-primary)] font-semibold">执行记录 · {jobName}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Clock size={28} className="text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)] text-sm">暂无执行记录</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  {r.status === 'ok'
                    ? <CheckCircle size={18} className="text-green-400 shrink-0" />
                    : r.status === 'running'
                    ? <Loader2 size={18} className="text-[var(--primary)] animate-spin shrink-0" />
                    : <XCircle size={18} className="text-red-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium">{formatTs(r.startedAt)}</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      {r.trigger ?? '定时触发'}
                      {r.durationMs != null ? ` · 耗时 ${(r.durationMs / 1000).toFixed(1)}s` : ''}
                    </p>
                    {r.error && <p className="text-red-400 text-xs mt-0.5 truncate">{r.error}</p>}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full shrink-0',
                    r.status === 'ok' ? 'bg-green-500/20 text-green-400'
                    : r.status === 'running' ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                    : 'bg-red-500/20 text-red-400'
                  )}>
                    {r.status === 'ok' ? '成功' : r.status === 'running' ? '运行中' : '失败'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Task Modal
function AddTaskModal({
  agentId,
  onClose,
  onAdd,
}: {
  agentId: string
  onClose: () => void
  onAdd: (name: string, cronExpr: string, message: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [cronExpr, setCronExpr] = useState('0 * * * *')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!name.trim() || !message.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(name.trim(), cronExpr.trim(), message.trim())
      onClose()
    } catch (err) {
      setError(String(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[400px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--border-color)] shrink-0">
          <span className="text-[var(--text-primary)] font-semibold">添加定时任务</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">任务名称</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入任务名称..."
              className="h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">Cron 表达式</label>
            <input
              value={cronExpr}
              onChange={e => setCronExpr(e.target.value)}
              placeholder="0 * * * *"
              className="h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <p className="text-[var(--text-muted)] text-xs">例: 0 * * * * (每小时), 0 9 * * 1-5 (工作日 9:00)</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">触发消息</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="发送给代理的消息..."
              rows={3}
              className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 h-16 px-6 border-t border-[var(--border-color)] shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors">取消</button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !message.trim() || saving}
            className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            添加
          </button>
        </div>
      </div>
    </div>
  )
}

type AgentDetailPageProps = {
  agent: AgentEntry
  onBack: () => void
  fetchCronJobs: (agentId?: string) => Promise<CronJob[]>
  fetchCronRuns: (jobId: string) => Promise<CronRunLogEntry[]>
  createCronJob: (job: { name: string; agentId?: string; schedule: import('@/lib/openclaw-api').CronSchedule; payload: import('@/lib/openclaw-api').CronPayload }) => Promise<void>
  deleteCronJob: (jobId: string) => Promise<void>
  fetchChannels: () => Promise<ChannelsStatusSnapshot | null>
  fetchTools: (agentId?: string) => Promise<ToolEntry[]>
  fetchAgentFiles: (agentId: string) => Promise<AgentsFilesListResult | null>
  fetchAgentFileContent: (agentId: string, name: string) => Promise<string>
  saveAgentFile: (agentId: string, name: string, content: string) => Promise<void>
}

export function AgentDetailPage({
  agent,
  onBack,
  fetchCronJobs,
  fetchCronRuns,
  createCronJob,
  deleteCronJob,
  fetchChannels,
  fetchTools,
  fetchAgentFiles,
  fetchAgentFileContent,
  saveAgentFile,
}: AgentDetailPageProps) {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [tools, setTools] = useState<ToolEntry[]>([])
  const [channelsSnap, setChannelsSnap] = useState<ChannelsStatusSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const [showExecModal, setShowExecModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)

  // Files state
  const [filesList, setFilesList] = useState<AgentsFilesListResult | null>(null)
  const [filesLoading, setFilesLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<AgentFileEntry | null>(null)

  const color = getAgentColor(agent.id)
  const displayName = agent.identity?.name ?? agent.name ?? agent.id
  const emoji = agent.identity?.emoji

  const loadData = useCallback(async () => {
    setLoading(true)
    const [jobs, toolList, channels] = await Promise.all([
      fetchCronJobs(agent.id).catch(() => [] as CronJob[]),
      fetchTools(agent.id).catch(() => [] as ToolEntry[]),
      fetchChannels().catch(() => null),
    ])
    setCronJobs(jobs)
    setTools(toolList)
    setChannelsSnap(channels)
    setLoading(false)
  }, [agent.id, fetchCronJobs, fetchTools, fetchChannels])

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const result = await fetchAgentFiles(agent.id)
      setFilesList(result)
    } finally {
      setFilesLoading(false)
    }
  }, [agent.id, fetchAgentFiles])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => { loadFiles() }, [loadFiles])

  const handleAddTask = async (name: string, cronExpr: string, message: string) => {
    await createCronJob({
      name,
      agentId: agent.id,
      schedule: { kind: 'cron', expr: cronExpr },
      payload: { kind: 'agentTurn', message },
    })
    const jobs = await fetchCronJobs(agent.id)
    setCronJobs(jobs)
  }

  const handleDeleteJob = async (jobId: string) => {
    await deleteCronJob(jobId)
    setCronJobs(prev => prev.filter(j => j.id !== jobId))
  }

  // Build channel list from snapshot
  const channelList = channelsSnap
    ? channelsSnap.channelOrder.map(id => ({
        id,
        label: channelsSnap.channelLabels[id] ?? id,
        accounts: channelsSnap.channelAccounts[id] ?? [],
      })).filter(ch => ch.accounts.length > 0)
    : []

  const channelColors: Record<string, string> = {
    slack: '#10b98120', discord: '#5865f220', telegram: '#0088cc20',
    whatsapp: '#25d36620', email: '#f59e0b20', signal: '#3a76f020',
  }
  const channelIcons: Record<string, React.ReactNode> = {
    slack: <MessageSquare size={16} className="text-[#10b981]" />,
    discord: <MessageSquare size={16} className="text-[#5865f2]" />,
    telegram: <Send size={16} className="text-[#0088cc]" />,
    whatsapp: <MessageCircle size={16} className="text-[#25d366]" />,
    email: <Mail size={16} className="text-[#f59e0b]" />,
    signal: <Radio size={16} className="text-[#3a76f0]" />,
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Detail Sidebar */}
      <div className="flex flex-col w-80 h-full bg-[var(--bg-secondary)] p-6 gap-5 shrink-0 border-r border-[var(--border-color)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">返回代理</span>
        </button>

        <div className="flex flex-col gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color }}>
            {emoji ? <span>{emoji}</span> : getAgentIcon(agent.id)}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-[var(--text-primary)] text-2xl font-semibold">{displayName}</h2>
            <p className="text-[var(--text-muted)] text-xs font-mono">{agent.id}</p>
          </div>
        </div>

        {/* Files Section */}
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">Files</span>
            <button
              onClick={loadFiles}
              disabled={filesLoading}
              className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="刷新"
            >
              <RefreshCw size={12} className={cn(filesLoading && 'animate-spin')} />
            </button>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto">
            {filesLoading && !filesList ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : filesList?.files.length === 0 ? (
              <p className="text-[var(--text-muted)] text-xs py-2">暂无文件</p>
            ) : (filesList?.files ?? []).map(file => (
              <div
                key={file.name}
                className="flex items-center gap-2 px-2 h-9 rounded-md bg-[var(--bg-tertiary)] group"
              >
                <FileText size={13} className="text-[var(--text-secondary)] shrink-0" />
                <span className="text-[var(--text-primary)] text-xs flex-1 min-w-0 truncate font-mono">
                  {file.name}
                </span>
                {FILE_DESCRIPTIONS[file.name] && (
                  <div className="relative group/tip shrink-0">
                    <Info size={12} className="text-[var(--text-muted)] opacity-60" />
                    <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-secondary)] leading-relaxed hidden group-hover/tip:block z-10 shadow-lg">
                      {FILE_DESCRIPTIONS[file.name]}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setEditingFile(file)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  title="编辑"
                >
                  <Pencil size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Main */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto p-8 gap-6">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            {/* Skills / Tools Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold text-base">
                  技能 ({tools.length})
                </h3>
                <button
                  onClick={loadData}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  title="刷新"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              {tools.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">暂无技能</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tools.map((tool, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <Zap size={16} className="text-[var(--primary)] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[var(--text-primary)] text-sm font-medium">{tool.label}</span>
                        {tool.description && (
                          <span className="text-[var(--text-muted)] text-xs truncate">{tool.description}</span>
                        )}
                      </div>
                      {tool.pluginId && (
                        <span className="text-xs text-[var(--text-muted)] shrink-0 bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                          {tool.pluginId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cron Jobs Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold text-base">
                  定时任务 ({cronJobs.length})
                </h3>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>
              {cronJobs.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">暂无定时任务</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {cronJobs.map(job => (
                    <div key={job.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#3b82f620]">
                          <Clock size={16} className="text-[#3b82f6]" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] text-sm font-medium">{job.name}</span>
                            {!job.enabled && (
                              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">已禁用</span>
                            )}
                          </div>
                          <span className="text-[var(--text-muted)] text-xs">{formatCronSchedule(job)}</span>
                          {job.state?.lastRunAt && (
                            <span className="text-[var(--text-muted)] text-xs">
                              上次: {formatTs(job.state.lastRunAt)}
                              {job.state.lastStatus && (
                                <span className={cn('ml-1', job.state.lastStatus === 'ok' ? 'text-green-400' : 'text-red-400')}>
                                  · {job.state.lastStatus === 'ok' ? '成功' : '失败'}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setSelectedJob(job); setShowExecModal(true) }}
                          className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--border-color)] transition-colors"
                          title="查看执行记录"
                        >
                          <Eye size={16} className="text-[var(--text-secondary)]" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Channels Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[var(--text-primary)] font-semibold text-base">
                频道 ({channelList.reduce((n, ch) => n + ch.accounts.length, 0)})
              </h3>
              {channelList.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">暂无已配置的频道</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {channelList.flatMap(ch =>
                    ch.accounts.map(acc => (
                      <div key={`${ch.id}-${acc.accountId}`} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: channelColors[ch.id] ?? '#3b82f620' }}
                        >
                          {channelIcons[ch.id] ?? <Radio size={16} className="text-[var(--text-secondary)]" />}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="text-[var(--text-primary)] text-sm font-medium">
                            {acc.name ?? ch.label}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">{ch.label}</span>
                        </div>
                        {(() => {
                          const isConnected = !!(acc.running || acc.connected || acc.linked)
                          const label = acc.running ? '运行中'
                            : acc.linked ? '已绑定'
                            : acc.connected ? '已连接'
                            : acc.configured ? '未运行'
                            : '未配置'
                          return (
                            <span className={cn(
                              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0',
                              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-green-400' : 'bg-[var(--text-muted)]')} />
                              {label}
                            </span>
                          )
                        })()}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showExecModal && selectedJob && (
        <ExecutionRecordsModal
          jobName={selectedJob.name}
          jobId={selectedJob.id}
          onClose={() => { setShowExecModal(false); setSelectedJob(null) }}
          fetchCronRuns={fetchCronRuns}
        />
      )}
      {showAddTask && (
        <AddTaskModal
          agentId={agent.id}
          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTask}
        />
      )}
      {editingFile && (
        <EditFileModal
          file={editingFile}
          agentId={agent.id}
          onClose={() => setEditingFile(null)}
          onSave={async (name, content) => {
            await saveAgentFile(agent.id, name, content)
            await loadFiles()
          }}
          fetchFileContent={fetchAgentFileContent}
        />
      )}
    </div>
  )
}
