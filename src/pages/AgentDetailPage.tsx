import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Bot, Code, Mail, MessageCircle, Pencil,
  Plus, Clock, Eye, MessageSquare, Send,
  Zap, Radio, CheckCircle, XCircle, Loader2, Trash2, RefreshCw,
  FileText, Info, X, Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEntry, CronJob, CronRunLogEntry, ChannelsStatusSnapshot, ToolEntry, AgentFileEntry, AgentsFilesListResult } from '@/lib/openclaw-api'
import { formatDateTime, translate, useI18n } from '@/i18n'

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
  const schedule = job.schedule
  if (schedule.kind === 'at') {
    return translate('agentDetail.schedule.oneTime', {
      at: formatDateTime(schedule.at),
    })
  }
  if (schedule.kind === 'every') {
    const ms = schedule.everyMs
    if (ms >= 86400000) return translate('agentDetail.schedule.everyDays', { count: ms / 86400000 })
    if (ms >= 3600000) return translate('agentDetail.schedule.everyHours', { count: ms / 3600000 })
    return translate('agentDetail.schedule.everyMinutes', { count: ms / 60000 })
  }
  return translate('agentDetail.schedule.cron', { expr: schedule.expr })
}

function formatTs(ts?: number | null): string {
  if (!ts) return '-'
  return formatDateTime(ts, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getFileDescription(name: string): string | null {
  const map: Record<string, ReturnType<typeof translate>> = {
    'AGENT.md': translate('agentDetail.fileDescription.agent'),
    'SOUL.md': translate('agentDetail.fileDescription.soul'),
    'TOOLS.md': translate('agentDetail.fileDescription.tools'),
    'IDENTITY.md': translate('agentDetail.fileDescription.identity'),
    'AGENTS.md': translate('agentDetail.fileDescription.agents'),
    'USER.md': translate('agentDetail.fileDescription.user'),
    'BOOT.md': translate('agentDetail.fileDescription.boot'),
    'HEARTBEAT.md': translate('agentDetail.fileDescription.heartbeat'),
    'BOOTSTRAP.md': translate('agentDetail.fileDescription.bootstrap'),
  }
  return map[name] ?? null
}

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
  const { t } = useI18n()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileDescription = getFileDescription(file.name)

  useEffect(() => {
    setLoading(true)
    fetchFileContent(agentId, file.name)
      .then((fileContent) => {
        setContent(fileContent)
        setLoading(false)
      })
      .catch((err) => {
        setError(String(err))
        setLoading(false)
      })
  }, [agentId, fetchFileContent, file.name])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(file.name, content)
      onClose()
    } catch (err) {
      setError(String(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[560px] max-h-[80vh] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-[var(--primary)]" />
            <span className="text-[var(--text-primary)] font-semibold text-sm">{t('agentDetail.editFileTitle', { name: file.name })}</span>
            {file.missing && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{t('agentDetail.newFile')}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {fileDescription && (
          <div className="px-5 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center gap-2">
            <Info size={13} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)] text-xs">{fileDescription}</span>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col p-5 gap-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="flex-1 w-full min-h-[280px] px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-mono resize-none focus:outline-none focus:border-[var(--primary)] transition-colors leading-relaxed"
              placeholder={t('agentDetail.editFilePlaceholder', { name: file.name })}
              spellCheck={false}
            />
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 h-14 px-5 border-t border-[var(--border-color)] shrink-0">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-[var(--action-foreground)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const { t } = useI18n()
  const [records, setRecords] = useState<CronRunLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchCronRuns(jobId).then((entries) => {
      setRecords(entries)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [fetchCronRuns, jobId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[560px] h-[480px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--border-color)] shrink-0">
          <span className="text-[var(--text-primary)] font-semibold">{t('agentDetail.execution.title', { name: jobName })}</span>
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
              <p className="text-[var(--text-secondary)] text-sm">{t('agentDetail.execution.noRecords')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  {record.status === 'ok'
                    ? <CheckCircle size={18} className="text-green-400 shrink-0" />
                    : record.status === 'running'
                    ? <Loader2 size={18} className="text-[var(--primary)] animate-spin shrink-0" />
                    : <XCircle size={18} className="text-red-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium">{formatTs(record.startedAt)}</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      {record.trigger ?? t('agentDetail.execution.trigger')}
                      {record.durationMs != null
                        ? ` · ${t('agentDetail.execution.duration', { seconds: (record.durationMs / 1000).toFixed(1) })}`
                        : ''}
                    </p>
                    {record.error && <p className="text-red-400 text-xs mt-0.5 truncate">{record.error}</p>}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full shrink-0',
                    record.status === 'ok' ? 'bg-green-500/20 text-green-400'
                    : record.status === 'running' ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                    : 'bg-red-500/20 text-red-400'
                  )}>
                    {record.status === 'ok'
                      ? t('agentDetail.execution.status.success')
                      : record.status === 'running'
                      ? t('agentDetail.execution.status.running')
                      : t('agentDetail.execution.status.failure')}
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

function AddTaskModal({
  onClose,
  onAdd,
}: {
  agentId: string
  onClose: () => void
  onAdd: (name: string, cronExpr: string, message: string) => Promise<void>
}) {
  const { t } = useI18n()
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
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--border-color)] shrink-0">
          <span className="text-[var(--text-primary)] font-semibold">{t('agentDetail.addTask.title')}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">{t('agentDetail.addTask.name')}</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('agentDetail.addTask.namePlaceholder')}
              className="h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">{t('agentDetail.addTask.cron')}</label>
            <input
              value={cronExpr}
              onChange={(event) => setCronExpr(event.target.value)}
              placeholder="0 * * * *"
              className="h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <p className="text-[var(--text-muted)] text-xs">{t('agentDetail.addTask.cronHelp')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-sm font-medium">{t('agentDetail.addTask.message')}</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t('agentDetail.addTask.messagePlaceholder')}
              rows={3}
              className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 h-16 px-6 border-t border-[var(--border-color)] shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors">{t('common.cancel')}</button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !message.trim() || saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-[var(--action-foreground)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {t('common.add')}
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
  const { t } = useI18n()
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [tools, setTools] = useState<ToolEntry[]>([])
  const [channelsSnap, setChannelsSnap] = useState<ChannelsStatusSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExecModal, setShowExecModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
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
  }, [agent.id, fetchChannels, fetchCronJobs, fetchTools])

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const result = await fetchAgentFiles(agent.id)
      setFilesList(result)
    } finally {
      setFilesLoading(false)
    }
  }, [agent.id, fetchAgentFiles])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles])

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
    setCronJobs((prev) => prev.filter((job) => job.id !== jobId))
  }

  const channelList = channelsSnap
    ? channelsSnap.channelOrder.map((id) => ({
        id,
        label: channelsSnap.channelLabels[id] ?? id,
        accounts: channelsSnap.channelAccounts[id] ?? [],
      })).filter((channel) => channel.accounts.length > 0)
    : []

  const channelColors: Record<string, string> = {
    slack: '#10b98120',
    discord: '#5865f220',
    telegram: '#0088cc20',
    whatsapp: '#25d36620',
    email: '#f59e0b20',
    signal: '#3a76f020',
  }

  const channelIcons: Record<string, React.ReactNode> = {
    slack: <MessageSquare size={16} className="text-[#10b981]" />,
    discord: <MessageSquare size={16} className="text-[#5865f2]" />,
    telegram: <Send size={16} className="text-[#0088cc]" />,
    whatsapp: <MessageCircle size={16} className="text-[#25d366]" />,
    email: <Mail size={16} className="text-[#f59e0b]" />,
    signal: <Radio size={16} className="text-[#3a76f0]" />,
  }

  const getChannelStatus = (account: { running?: boolean | null; connected?: boolean | null; linked?: boolean | null; configured?: boolean | null }) => {
    if (account.running) return t('agentDetail.channelStatus.running')
    if (account.linked) return t('agentDetail.channelStatus.linked')
    if (account.connected) return t('agentDetail.channelStatus.connected')
    if (account.configured) return t('agentDetail.channelStatus.stopped')
    return t('agentDetail.channelStatus.unconfigured')
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex flex-col w-80 h-full bg-[var(--bg-secondary)] p-6 gap-5 shrink-0 border-r border-[var(--border-color)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">{t('agentDetail.back')}</span>
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

        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('agentDetail.files')}</span>
            <button
              onClick={() => void loadFiles()}
              disabled={filesLoading}
              className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title={t('common.refresh')}
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
              <p className="text-[var(--text-muted)] text-xs py-2">{t('agentDetail.noFiles')}</p>
            ) : (filesList?.files ?? []).map((file) => {
              const description = getFileDescription(file.name)
              return (
                <div
                  key={file.name}
                  className="flex items-center gap-2 px-2 h-9 rounded-md bg-[var(--bg-tertiary)] group"
                >
                  <FileText size={13} className="text-[var(--text-secondary)] shrink-0" />
                  <span className="text-[var(--text-primary)] text-xs flex-1 min-w-0 truncate font-mono">
                    {file.name}
                  </span>
                  {description && (
                    <div className="relative group/tip shrink-0">
                      <Info size={12} className="text-[var(--text-muted)] opacity-60" />
                      <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-secondary)] leading-relaxed hidden group-hover/tip:block z-10 shadow-lg">
                        {description}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setEditingFile(file)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title={t('agentDetail.editFile')}
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 h-full overflow-y-auto p-8 gap-6">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold text-base">
                  {t('agentDetail.tools', { count: tools.length })}
                </h3>
                <button
                  onClick={() => void loadData()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  title={t('common.refresh')}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              {tools.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">{t('agentDetail.noTools')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tools.map((tool, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
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

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold text-base">
                  {t('agentDetail.cron', { count: cronJobs.length })}
                </h3>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-medium text-[var(--action-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
                >
                  <Plus size={14} />
                  {t('common.add')}
                </button>
              </div>
              {cronJobs.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">{t('agentDetail.noCron')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {cronJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#3b82f620]">
                          <Clock size={16} className="text-[#3b82f6]" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] text-sm font-medium">{job.name}</span>
                            {!job.enabled && (
                              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">{t('agentDetail.disabled')}</span>
                            )}
                          </div>
                          <span className="text-[var(--text-muted)] text-xs">{formatCronSchedule(job)}</span>
                          {job.state?.lastRunAt && (
                            <span className="text-[var(--text-muted)] text-xs">
                              {t('agentDetail.lastRun', { time: formatTs(job.state.lastRunAt) })}
                              {job.state.lastStatus && (
                                <span className={cn('ml-1', job.state.lastStatus === 'ok' ? 'text-green-400' : 'text-red-400')}>
                                  · {job.state.lastStatus === 'ok' ? t('common.success') : t('common.failure')}
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
                          title={t('agentDetail.viewExecution')}
                        >
                          <Eye size={16} className="text-[var(--text-secondary)]" />
                        </button>
                        <button
                          onClick={() => void handleDeleteJob(job.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={t('agentDetail.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[var(--text-primary)] font-semibold text-base">
                {t('agentDetail.channels', { count: channelList.reduce((count, channel) => count + channel.accounts.length, 0) })}
              </h3>
              {channelList.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">{t('agentDetail.noChannels')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {channelList.flatMap((channel) =>
                    channel.accounts.map((account) => (
                      <div key={`${channel.id}-${account.accountId}`} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: channelColors[channel.id] ?? '#3b82f620' }}
                        >
                          {channelIcons[channel.id] ?? <Radio size={16} className="text-[var(--text-secondary)]" />}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="text-[var(--text-primary)] text-sm font-medium">
                            {account.name ?? channel.label}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">{channel.label}</span>
                        </div>
                        {(() => {
                          const isConnected = !!(account.running || account.connected || account.linked)
                          return (
                            <span className={cn(
                              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0',
                              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-green-400' : 'bg-[var(--text-muted)]')} />
                              {getChannelStatus(account)}
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
          onClose={() => {
            setShowExecModal(false)
            setSelectedJob(null)
          }}
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
