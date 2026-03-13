/**
 * OpenClaw API wrapper
 * Based on openclaw/ui/src/ui/controllers/
 */

import { GatewayClient } from './gateway'

export type ChatMessage = {
  id?: string
  role: 'user' | 'assistant' | 'tool'
  content?: Array<{ type: string; text?: string; [key: string]: unknown }> | string
  text?: string
  ts?: number
  uuid?: string
  runId?: string
  costUSD?: number
  durationMs?: number
  inputTokens?: number
  outputTokens?: number
  thinkingTokens?: number
  attachments?: Array<{ mimeType: string; content: string; name?: string }>
}

export type Session = {
  key: string
  kind?: 'direct' | 'group' | 'global' | 'unknown'
  // Real fields from sessions.list
  label?: string | null
  displayName?: string | null
  updatedAt?: number | null
  sessionId?: string | null
  systemSent?: boolean
  model?: string | null
  modelProvider?: string | null
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  // Derived / legacy fields kept for compat
  title?: string | null
  agentName?: string | null
  agentKey?: string | null
  lastMessageAt?: number
  messageCount?: number
  preview?: string | null
}

export type Agent = {
  key: string
  name: string
  description?: string | null
  status?: 'active' | 'idle' | 'error' | null
  model?: string | null
  skills?: string[]
  runCount?: number
  avatarColor?: string
}

// agents.list result shape (from openclaw/src/gateway/protocol/schema/agents-models-skills.ts)
// Real API only returns: id, name, identity (no description/status/model/runCount)
export type AgentIdentity = {
  name?: string | null
  theme?: string | null
  emoji?: string | null
  avatar?: string | null
  avatarUrl?: string | null
}

export type AgentEntry = {
  id: string
  name?: string | null
  identity?: AgentIdentity | null
}

export type AgentsListResult = {
  agents: AgentEntry[]
  defaultId?: string | null
  mainKey?: string | null
  scope?: string | null
}

// Cron types (from openclaw/ui/src/ui/types.ts)
export type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number }
  | { kind: 'cron'; expr: string; tz?: string; staggerMs?: number }

export type CronPayload =
  | { kind: 'systemEvent'; text: string }
  | { kind: 'agentTurn'; message: string; model?: string; thinking?: string; timeoutSeconds?: number; lightContext?: boolean }

export type CronJob = {
  id: string
  name: string
  description?: string
  agentId?: string | null
  sessionKey?: string | null
  enabled: boolean
  deleteAfterRun?: boolean
  schedule: CronSchedule
  sessionTarget?: string
  wakeMode?: string
  payload: CronPayload
  delivery?: { mode: string; channel?: string; to?: string } | null
  state?: {
    lastStatus?: 'ok' | 'error' | 'skipped' | null
    lastRunAt?: number | null
    nextRunAt?: number | null
    runCount?: number | null
  } | null
}

export type CronRunLogEntry = {
  id: string
  jobId: string
  jobName?: string
  startedAt: number
  finishedAt?: number | null
  status: 'ok' | 'error' | 'skipped' | 'running'
  durationMs?: number | null
  error?: string | null
  trigger?: string | null
}

export type CronRunsResult = {
  entries: CronRunLogEntry[]
  total: number
  limit: number
  offset: number
  nextOffset?: number | null
  hasMore: boolean
}

export type CronJobsListResult = {
  jobs: CronJob[]
  total: number
  limit: number
  offset: number
  nextOffset?: number | null
  hasMore: boolean
}

// Channels types (from openclaw/ui/src/ui/types.ts ChannelsStatusSnapshot)
export type ChannelAccountSnapshot = {
  accountId: string
  name?: string | null
  enabled?: boolean | null
  configured?: boolean | null
  linked?: boolean | null
  running?: boolean | null
  connected?: boolean | null
  lastConnectedAt?: number | null
  lastError?: string | null
}

export type ChannelsStatusSnapshot = {
  ts: number
  channelOrder: string[]
  channelLabels: Record<string, string>
  channelDetailLabels?: Record<string, string>
  channels: Record<string, unknown>
  channelAccounts: Record<string, ChannelAccountSnapshot[]>
  channelDefaultAccountId: Record<string, string>
}

// Models type
export type ModelEntry = {
  id: string
  name?: string | null
  provider?: string | null
  status?: string | null
}

// Tools/Skills type (from openclaw/src/gateway/protocol/schema/agents-models-skills.ts)
// tools.catalog returns groups[], each group has tools[]
export type ToolEntry = {
  id: string
  label: string
  description: string
  source: 'core' | 'plugin'
  pluginId?: string | null
  optional?: boolean | null
}

export type ToolGroup = {
  id: string
  label: string
  source: 'core' | 'plugin'
  pluginId?: string | null
  tools: ToolEntry[]
}

export type ToolsCatalogResult = {
  agentId: string
  profiles: Array<{ id: string; label: string }>
  groups: ToolGroup[]
}

export type ChatEventPayload = {
  runId: string
  sessionKey: string
  seq?: number
  state: 'delta' | 'final' | 'aborted' | 'error'
  // delta: message is a partial assistant message object with streaming text
  // final: message is the complete assistant message object
  message?: unknown
  errorMessage?: string
}

export type ToolEventPayload = {
  runId: string
  sessionKey: string
  toolUseId: string
  toolName: string
  state: 'start' | 'delta' | 'end'
  input?: unknown
  output?: unknown
  text?: string
}

// Extract readable text from a message
export function extractMessageText(message: ChatMessage): string {
  if (typeof message.text === 'string') return message.text
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text as string)
      .join('')
  }
  return ''
}

// Load chat history for a session
export async function loadChatHistory(
  client: GatewayClient,
  sessionKey: string,
  limit = 200
): Promise<{ messages: ChatMessage[]; thinkingLevel?: string }> {
  const res = await client.request<{ messages?: unknown[]; thinkingLevel?: string }>(
    'chat.history',
    { sessionKey, limit }
  )
  return {
    messages: (Array.isArray(res.messages) ? res.messages : []) as ChatMessage[],
    thinkingLevel: res.thinkingLevel,
  }
}

// Send a chat message
// chat.send expects: { sessionKey, message: string, idempotencyKey, deliver?, attachments? }
export async function sendChatMessage(
  client: GatewayClient,
  sessionKey: string,
  text: string,
  attachments?: Array<{ mimeType: string; content: string; name?: string }>
): Promise<string | null> {
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const apiAttachments = attachments?.length
    ? attachments.map((att) => ({ type: 'image', mimeType: att.mimeType, content: att.content }))
    : undefined

  await client.request('chat.send', {
    sessionKey,
    message: text,
    deliver: false,
    idempotencyKey,
    ...(apiAttachments ? { attachments: apiAttachments } : {}),
  })

  return idempotencyKey
}

// Abort a running chat
export async function abortChatRun(
  client: GatewayClient,
  sessionKey: string,
  runId: string
): Promise<void> {
  await client.request('chat.abort', { sessionKey, runId })
}

// Reset/create a new session by sending /new directive.
// openclaw handles /new by clearing the current session context.
// sessionKey format for agent sessions: agent:<agentId>:main
export async function sendNewSessionDirective(
  client: GatewayClient,
  sessionKey: string
): Promise<void> {
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await client.request('chat.send', {
    sessionKey,
    message: '/new',
    deliver: false,
    idempotencyKey,
  })
}

// Resolve a session key for a given agentId (format: agent:<agentId>:main)
export function buildAgentSessionKey(agentId: string): string {
  return `agent:${agentId}:main`
}

// List sessions
export async function listSessions(
  client: GatewayClient,
  opts?: { limit?: number; agentKey?: string; includeGlobal?: boolean; includeUnknown?: boolean; activeMinutes?: number }
): Promise<Session[]> {
  const params: Record<string, unknown> = {
    limit: opts?.limit ?? 120,
    includeGlobal: opts?.includeGlobal ?? true,
    includeUnknown: opts?.includeUnknown ?? false,
  }
  if (opts?.agentKey) params.agentKey = opts.agentKey
  // activeMinutes: 0 or omitted means no time filter (same as openclaw dashboard default)
  const res = await client.request<{ sessions?: unknown[] }>('sessions.list', params)
  return (Array.isArray(res.sessions) ? res.sessions : []) as Session[]
}

// Extract agentId from session key (format: agent:<agentId>:<rest>)
export function extractAgentIdFromSessionKey(key: string): string | null {
  const m = key.match(/^agent:([^:]+):/)
  return m ? m[1] : null
}

// List agents via agents.list (real API)
export async function listAgents(client: GatewayClient): Promise<AgentsListResult> {
  const res = await client.request<AgentsListResult>('agents.list', {})
  return {
    agents: Array.isArray(res.agents) ? res.agents : [],
    defaultId: res.defaultId ?? null,
  }
}

// Create an agent via agents.create
export async function createAgent(
  client: GatewayClient,
  agent: { name: string; workspace: string }
): Promise<{ ok: boolean; agentId: string; name: string; workspace: string }> {
  const res = await client.request<{ ok: boolean; agentId: string; name: string; workspace: string }>('agents.create', {
    name: agent.name,
    workspace: agent.workspace,
  })
  return res
}

// Delete an agent via agents.delete
export async function deleteAgent(
  client: GatewayClient,
  agentId: string,
  opts?: { deleteFiles?: boolean }
): Promise<{ ok: true; agentId: string; removedBindings: number }> {
  const res = await client.request<{ ok: true; agentId: string; removedBindings: number }>('agents.delete', {
    agentId,
    deleteFiles: opts?.deleteFiles ?? true,
  })
  return res
}

// List cron jobs
export async function listCronJobs(
  client: GatewayClient,
  opts?: { agentId?: string; limit?: number; offset?: number }
): Promise<CronJobsListResult> {
  const res = await client.request<CronJobsListResult>('cron.list', {
    limit: opts?.limit ?? 50,
    offset: opts?.offset ?? 0,
    ...(opts?.agentId ? { agentId: opts.agentId } : {}),
  })
  return {
    jobs: Array.isArray(res.jobs) ? res.jobs : [],
    total: res.total ?? 0,
    limit: res.limit ?? 50,
    offset: res.offset ?? 0,
    nextOffset: res.nextOffset ?? null,
    hasMore: res.hasMore ?? false,
  }
}

// Get cron run history for a job
export async function listCronRuns(
  client: GatewayClient,
  jobId: string,
  opts?: { limit?: number; offset?: number }
): Promise<CronRunsResult> {
  const res = await client.request<CronRunsResult>('cron.runs', {
    scope: 'job',
    id: jobId,
    limit: opts?.limit ?? 20,
    offset: opts?.offset ?? 0,
  })
  return {
    entries: Array.isArray(res.entries) ? res.entries : [],
    total: res.total ?? 0,
    limit: res.limit ?? 20,
    offset: res.offset ?? 0,
    nextOffset: res.nextOffset ?? null,
    hasMore: res.hasMore ?? false,
  }
}

// Add a cron job
export async function addCronJob(
  client: GatewayClient,
  job: {
    name: string
    agentId?: string
    schedule: CronSchedule
    payload: CronPayload
    enabled?: boolean
  }
): Promise<void> {
  await client.request('cron.add', {
    name: job.name,
    agentId: job.agentId,
    schedule: job.schedule,
    payload: job.payload,
    enabled: job.enabled ?? true,
    sessionTarget: 'isolated',
  })
}

// Remove a cron job
export async function removeCronJob(client: GatewayClient, jobId: string): Promise<void> {
  await client.request('cron.remove', { id: jobId })
}

// Get channels status
export async function getChannelsStatus(
  client: GatewayClient
): Promise<ChannelsStatusSnapshot | null> {
  const res = await client.request<ChannelsStatusSnapshot | null>('channels.status', {
    probe: false,
    timeoutMs: 8000,
  })
  return res
}

// List models
export async function listModels(client: GatewayClient): Promise<ModelEntry[]> {
  const res = await client.request<{ models?: unknown[] }>('models.list', {})
  const models = Array.isArray(res.models) ? res.models : []
  return models.map((m) => {
    const entry = m as Record<string, unknown>
    return {
      id: String(entry.id ?? ''),
      name: typeof entry.name === 'string' ? entry.name : null,
      provider: typeof entry.provider === 'string' ? entry.provider : null,
      status: typeof entry.status === 'string' ? entry.status : null,
    }
  }).filter(m => m.id)
}

// Get tools catalog for an agent — returns flat list of all tools across groups
export async function getToolsCatalog(
  client: GatewayClient,
  agentId?: string
): Promise<ToolEntry[]> {
  const res = await client.request<ToolsCatalogResult>('tools.catalog', {
    agentId,
    includePlugins: true,
  })
  const groups = Array.isArray(res.groups) ? res.groups : []
  return groups.flatMap(g => Array.isArray(g.tools) ? g.tools : [])
}

// Agent Files types (from openclaw/ui/src/ui/types.ts)
export type AgentFileEntry = {
  name: string
  path: string
  missing: boolean
  size?: number
  updatedAtMs?: number
  content?: string
}

export type AgentsFilesListResult = {
  agentId: string
  workspace: string
  files: AgentFileEntry[]
}

export type AgentsFilesGetResult = {
  agentId: string
  workspace: string
  file: AgentFileEntry
}

export type AgentsFilesSetResult = {
  ok: true
  agentId: string
  workspace: string
  file: AgentFileEntry
}

// List agent files via agents.files.list
export async function listAgentFiles(
  client: GatewayClient,
  agentId: string
): Promise<AgentsFilesListResult | null> {
  const res = await client.request<AgentsFilesListResult | null>('agents.files.list', { agentId })
  return res ?? null
}

// Get a single agent file content via agents.files.get
export async function getAgentFile(
  client: GatewayClient,
  agentId: string,
  name: string
): Promise<AgentsFilesGetResult | null> {
  const res = await client.request<AgentsFilesGetResult | null>('agents.files.get', { agentId, name })
  return res ?? null
}

// Save an agent file via agents.files.set
export async function setAgentFile(
  client: GatewayClient,
  agentId: string,
  name: string,
  content: string
): Promise<AgentsFilesSetResult | null> {
  const res = await client.request<AgentsFilesSetResult | null>('agents.files.set', { agentId, name, content })
  return res ?? null
}

// List agents (from snapshot) — fallback for presence/health events
export function extractAgentsFromSnapshot(snapshot: unknown): Agent[] {
  if (!snapshot || typeof snapshot !== 'object') return []
  const s = snapshot as Record<string, unknown>

  if (Array.isArray(s.agents)) {
    return s.agents as Agent[]
  }

  if (Array.isArray(s.agentOrder) && s.agentMap && typeof s.agentMap === 'object') {
    const map = s.agentMap as Record<string, unknown>
    return s.agentOrder.map((key: string) => ({
      key,
      ...(map[key] as object),
    })) as Agent[]
  }

  return []
}
