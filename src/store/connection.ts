import { useState, useEffect, useCallback, useRef } from 'react'
import { GatewayClient, type GatewayHelloOk } from '@/lib/gateway'
import {
  extractAgentsFromSnapshot,
  listSessions,
  loadChatHistory,
  sendChatMessage,
  abortChatRun,
  listAgents,
  createAgent,
  deleteAgent,
  listCronJobs,
  listCronRuns,
  addCronJob,
  removeCronJob,
  getChannelsStatus,
  listModels,
  getToolsCatalog,
  listAgentFiles,
  getAgentFile,
  setAgentFile,
} from '@/lib/openclaw-api'
export type { Agent, Session, ChatMessage, AgentEntry, AgentIdentity, AgentsListResult, CronJob, CronRunLogEntry, ChannelsStatusSnapshot, ModelEntry, ToolEntry, ToolGroup, AgentsFilesListResult } from '@/lib/openclaw-api'
import type {
  Agent, Session, ChatMessage, ChatEventPayload, ToolEventPayload,
  AgentEntry, AgentsListResult, CronJob, CronRunLogEntry,
  ChannelsStatusSnapshot, ModelEntry, ToolEntry, CronSchedule, CronPayload,
  AgentsFilesListResult,
} from '@/lib/openclaw-api'
import { generateId } from '@/lib/utils'
import { translate } from '@/i18n'

// Extract streaming text from a chat delta message object
// message shape: { role, content: [{type:'text', text:'...'}] } or { text: '...' }
function extractStreamText(message: unknown): string | null {
  if (!message || typeof message !== 'object') return null
  const m = message as Record<string, unknown>
  if (typeof m.text === 'string') return m.text
  if (Array.isArray(m.content)) {
    const parts = m.content
      .map((p: unknown) => {
        const item = p as Record<string, unknown>
        return item.type === 'text' && typeof item.text === 'string' ? item.text : null
      })
      .filter((v): v is string => v !== null)
    if (parts.length > 0) return parts.join('')
  }
  if (typeof m.content === 'string') return m.content
  return null
}

export type ConnectionConfig = {
  url: string
  token?: string
  password?: string
  useProxy?: boolean
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export type ConnectionError = {
  message: string
  code?: string
}

const STORAGE_KEY = 'helloclaw:connection'

export function loadConnectionConfig(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConnectionConfig
  } catch {
    return null
  }
}

export function saveConnectionConfig(config: ConnectionConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export type StreamSegment = {
  id: string
  text: string
  ts: number
}

export type ToolCall = {
  id: string
  toolUseId: string
  toolName: string
  state: 'running' | 'done'
  input?: unknown
  output?: unknown
}

export type ChatState = {
  messages: ChatMessage[]
  stream: string | null
  streamSegments: StreamSegment[]
  toolCalls: ToolCall[]
  loading: boolean
  sending: boolean
  runId: string | null
  error: string | null
}

export function useOpenClawConnection() {
  const [config, setConfig] = useState<ConnectionConfig | null>(loadConnectionConfig)
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [connError, setConnError] = useState<ConnectionError | null>(null)
  const [hello, setHello] = useState<GatewayHelloOk | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsList, setAgentsList] = useState<AgentEntry[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null)
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    stream: null,
    streamSegments: [],
    toolCalls: [],
    loading: false,
    sending: false,
    runId: null,
    error: null,
  })

  const clientRef = useRef<GatewayClient | null>(null)

  const handleEvent = useCallback((event: string, payload: unknown) => {
    if (event === 'chat') {
      const ev = payload as ChatEventPayload
      if (ev.state === 'delta') {
        // Extract streaming text from message object (content[].text or .text)
        const deltaText = extractStreamText(ev.message)
        if (deltaText) {
          setChatState((prev) => ({
            ...prev,
            // runId comes from the first delta event
            runId: prev.runId ?? ev.runId ?? null,
            sending: false,
            stream: deltaText,
            streamSegments: [
              ...prev.streamSegments,
              { id: generateId(), text: deltaText, ts: Date.now() },
            ],
          }))
        }
      } else if (ev.state === 'final') {
        // final message may be in ev.message, or fall back to accumulated stream
        setChatState((prev) => {
          const finalMsg = ev.message as ChatMessage | undefined
          const streamedText = prev.streamSegments.map((s) => s.text).join('')
          const messages = finalMsg
            ? [...prev.messages, finalMsg]
            : streamedText.trim()
            ? [...prev.messages, { role: 'assistant' as const, text: streamedText, ts: Date.now() }]
            : prev.messages
          return {
            ...prev,
            messages,
            stream: null,
            streamSegments: [],
            toolCalls: [],
            runId: null,
            sending: false,
          }
        })
      } else if (ev.state === 'aborted' || ev.state === 'error') {
          setChatState((prev) => ({
            ...prev,
            stream: null,
            streamSegments: [],
            runId: null,
            sending: false,
            error: ev.state === 'error' ? (ev.errorMessage ?? translate('connection.error.unknown')) : null,
          }))
      }
    } else if (event === 'tool') {
      const ev = payload as ToolEventPayload
      setChatState((prev) => {
        const existing = prev.toolCalls.find((t) => t.toolUseId === ev.toolUseId)
        if (ev.state === 'start') {
          return {
            ...prev,
            toolCalls: [
              ...prev.toolCalls,
              {
                id: generateId(),
                toolUseId: ev.toolUseId,
                toolName: ev.toolName,
                state: 'running',
                input: ev.input,
              },
            ],
          }
        } else if (ev.state === 'end' && existing) {
          return {
            ...prev,
            toolCalls: prev.toolCalls.map((t) =>
              t.toolUseId === ev.toolUseId
                ? { ...t, state: 'done', output: ev.output }
                : t
            ),
          }
        }
        return prev
      })
    } else if (event === 'presence' || event === 'health') {
      // snapshot updates
      const snap = payload as Record<string, unknown>
      if (snap?.agents) {
        setAgents(extractAgentsFromSnapshot(snap))
      }
    }
  }, [])

  const connect = useCallback((cfg: ConnectionConfig) => {
    // Stop existing client
    clientRef.current?.stop()

    // Build WebSocket URL from the HTTP URL.
    // OpenClaw's gateway WebSocket is at the root path (no /gateway suffix).
    // In web/dev mode, use the Vite proxy (/openclaw-ws) so the browser's
    // Origin header appears as a loopback address, passing OpenClaw's origin check.
    // In Electron mode (or when explicitly using a remote URL), connect directly.
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window
    const isDevProxy = !isElectron && cfg.useProxy !== false
    let wsUrl: string
    if (isDevProxy) {
      // Vite proxy: /openclaw-ws → cfg.url (configured in vite.config.ts)
      const loc = window.location
      const proto = loc.protocol === 'https:' ? 'wss' : 'ws'
      wsUrl = `${proto}://${loc.host}/openclaw-ws`
    } else {
      wsUrl = cfg.url.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws')).replace(/\/$/, '')
    }

    setState('connecting')

    const client = new GatewayClient({
      url: wsUrl,
      token: cfg.token,
      password: cfg.password,
      onHello: (h) => {
        setHello(h)
        // Extract agents from snapshot
        if (h.snapshot) {
          setAgents(extractAgentsFromSnapshot(h.snapshot))
        }
      },
      onConnected: () => {
        setState('connected')
        setConnError(null)
        listSessions(client, { activeMinutes: 1440 }).then(setSessions).catch(console.error)
        // Load real agents list via agents.list
        listAgents(client).then(res => setAgentsList(res.agents)).catch(console.error)
      },
      onEvent: handleEvent,
      onClose: (info) => {
        setHello(null)
        if (info.error) {
          setState('error')
          setConnError({ message: info.error.message, code: info.error.code })
        } else if (info.code === 4001) {
          setState('error')
          setConnError({ message: translate('connection.error.connectFailed'), code: 'CONNECT_FAILED' })
        } else if (info.code === 1006) {
          // Abnormal closure — server unreachable or origin rejected at WS level
          setState('error')
          setConnError({ message: translate('connection.error.unreachable'), code: 'UNREACHABLE' })
        } else {
          setState('disconnected')
        }
      },
      onDisconnected: () => {
        setState((prev) => (prev === 'error' ? prev : 'disconnected'))
      },
    })

    client.start()
    clientRef.current = client
    saveConnectionConfig(cfg)
    setConfig(cfg)
  }, [handleEvent])

  const disconnect = useCallback(() => {
    clientRef.current?.stop()
    clientRef.current = null
    setState('disconnected')
    setHello(null)
  }, [])

  // Load chat history when session changes
  const selectSession = useCallback(async (sessionKey: string) => {
    setActiveSessionKey(sessionKey)
    const client = clientRef.current
    if (!client?.connected) return

    setChatState((prev) => ({ ...prev, loading: true, messages: [], error: null }))
    try {
      const { messages } = await loadChatHistory(client, sessionKey)
      setChatState((prev) => ({
        ...prev,
        messages,
        loading: false,
        stream: null,
        streamSegments: [],
        toolCalls: [],
        runId: null,
      }))
    } catch (err) {
      setChatState((prev) => ({
        ...prev,
        loading: false,
        error: String(err),
      }))
    }
  }, [])

  const sendMessage = useCallback(async (text: string, attachments?: Array<{ mimeType: string; content: string; name?: string }>) => {
    const client = clientRef.current
    if (!client?.connected || !activeSessionKey) return

    const userMessage: ChatMessage = {
      role: 'user',
      text,
      ts: Date.now(),
      attachments,
    }

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      sending: true,
      error: null,
      stream: null,
      streamSegments: [],
      toolCalls: [],
    }))

    try {
      const runId = await sendChatMessage(client, activeSessionKey, text, attachments)
      setChatState((prev) => ({ ...prev, runId }))
      // Refresh sessions after sending so new sessions appear in the sidebar
      setTimeout(() => {
        listSessions(client, { activeMinutes: 1440 }).then(setSessions).catch(console.error)
      }, 1500)
    } catch (err) {
      setChatState((prev) => ({
        ...prev,
        sending: false,
        error: String(err),
      }))
    }
  }, [activeSessionKey])

  const abortChat = useCallback(async () => {
    const client = clientRef.current
    if (!client?.connected || !activeSessionKey || !chatState.runId) return
    try {
      await abortChatRun(client, activeSessionKey, chatState.runId)
    } catch (err) {
      console.error('abort failed:', err)
    }
  }, [activeSessionKey, chatState.runId])

  const newSession = useCallback(async (agentKey?: string) => {
    const client = clientRef.current
    if (!client?.connected) return

    // openclaw creates sessions lazily — just pick a new unique sessionKey.
    // Format: agent:<agentId>:webchat:<timestamp>
    // chat.history on a non-existent key returns empty messages (no error).
    const agentId = agentKey ?? 'main'
    const newKey = `agent:${agentId}:webchat:${Date.now()}`

    // Add a placeholder session to the list immediately so the sidebar shows it
    const placeholder: Session = {
      key: newKey,
      label: translate('connection.newConversation'),
      displayName: agentId,
      kind: 'direct',
      updatedAt: Date.now(),
    }
    setSessions((prev) => [placeholder, ...prev])

    // Switch to the new session (chat.history will return empty — that's fine)
    await selectSession(newKey)
  }, [selectSession])

  const refreshSessions = useCallback(async () => {
    const client = clientRef.current
    if (!client?.connected) return
    try {
      const list = await listSessions(client, { activeMinutes: 1440 })
      setSessions(list)
    } catch (err) {
      console.error('list sessions failed:', err)
    }
  }, [])

  const refreshAgentsList = useCallback(async () => {
    const client = clientRef.current
    if (!client?.connected) return
    try {
      const res = await listAgents(client)
      setAgentsList(res.agents)
    } catch (err) {
      console.error('list agents failed:', err)
    }
  }, [])

  // Fetch cron jobs for an agent
  const fetchCronJobs = useCallback(async (agentId?: string) => {
    const client = clientRef.current
    if (!client?.connected) return []
    try {
      const res = await listCronJobs(client, { agentId })
      return res.jobs
    } catch (err) {
      console.error('list cron jobs failed:', err)
      return []
    }
  }, [])

  // Fetch cron run history
  const fetchCronRuns = useCallback(async (jobId: string) => {
    const client = clientRef.current
    if (!client?.connected) return []
    try {
      const res = await listCronRuns(client, jobId)
      return res.entries
    } catch (err) {
      console.error('list cron runs failed:', err)
      return []
    }
  }, [])

  // Add a cron job
  const createCronJob = useCallback(async (job: {
    name: string
    agentId?: string
    schedule: CronSchedule
    payload: CronPayload
  }) => {
    const client = clientRef.current
    if (!client?.connected) {
      throw new Error('Client not connected')
    }
    await addCronJob(client, job)
  }, [])

  // Remove a cron job
  const deleteCronJob = useCallback(async (jobId: string) => {
    const client = clientRef.current
    if (!client?.connected) {
      throw new Error('Client not connected')
    }
    await removeCronJob(client, jobId)
  }, [])

  // Fetch channels status
  const fetchChannels = useCallback(async (): Promise<ChannelsStatusSnapshot | null> => {
    const client = clientRef.current
    if (!client?.connected) return null
    try {
      return await getChannelsStatus(client)
    } catch (err) {
      console.error('get channels failed:', err)
      return null
    }
  }, [])

  // Fetch models list
  const fetchModels = useCallback(async (): Promise<ModelEntry[]> => {
    const client = clientRef.current
    if (!client?.connected) return []
    try {
      return await listModels(client)
    } catch (err) {
      console.error('list models failed:', err)
      return []
    }
  }, [])

  // Create a new agent
  const createAgentAction = useCallback(async (agent: { name: string; workspace: string }) => {
    const client = clientRef.current
    if (!client?.connected) throw new Error('Client not connected')
    return await createAgent(client, agent)
  }, [])

  // Delete an existing agent
  const deleteAgentAction = useCallback(async (agentId: string, opts?: { deleteFiles?: boolean }) => {
    const client = clientRef.current
    if (!client?.connected) throw new Error('Client not connected')
    const result = await deleteAgent(client, agentId, opts)

    // Optimistically remove the deleted agent so the UI updates immediately.
    setAgentsList((prev) => prev.filter((agent) => agent.id !== agentId))
    setSessions((prev) => prev.filter((session) => !session.key.startsWith(`agent:${agentId}:`)))

    // Sync with the server shortly after delete to reconcile any lagging state.
    window.setTimeout(() => {
      listAgents(client)
        .then((res) => setAgentsList(res.agents))
        .catch((err) => console.error('list agents after delete failed:', err))
    }, 300)

    return result
  }, [])

  // Fetch tools catalog for an agent
  const fetchTools = useCallback(async (agentId?: string): Promise<ToolEntry[]> => {
    const client = clientRef.current
    if (!client?.connected) return []
    try {
      return await getToolsCatalog(client, agentId)
    } catch (err) {
      console.error('get tools catalog failed:', err)
      return []
    }
  }, [])

  // Fetch agent files list
  const fetchAgentFiles = useCallback(async (agentId: string): Promise<AgentsFilesListResult | null> => {
    const client = clientRef.current
    if (!client?.connected) return null
    try {
      return await listAgentFiles(client, agentId)
    } catch (err) {
      console.error('list agent files failed:', err)
      return null
    }
  }, [])

  // Fetch a single agent file content
  const fetchAgentFileContent = useCallback(async (agentId: string, name: string): Promise<string> => {
    const client = clientRef.current
    if (!client?.connected) return ''
    try {
      const res = await getAgentFile(client, agentId, name)
      return res?.file?.content ?? ''
    } catch (err) {
      console.error('get agent file failed:', err)
      return ''
    }
  }, [])

  // Save an agent file
  const saveAgentFile = useCallback(async (agentId: string, name: string, content: string): Promise<void> => {
    const client = clientRef.current
    if (!client?.connected) {
      throw new Error('Client not connected')
    }
    await setAgentFile(client, agentId, name, content)
  }, [])

  // Auto-connect on mount if config exists
  useEffect(() => {
    if (config) {
      connect(config)
    }
    return () => {
      clientRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    config,
    state,
    connError,
    hello,
    agents,
    agentsList,
    sessions,
    activeSessionKey,
    chatState,
    connect,
    disconnect,
    selectSession,
    sendMessage,
    abortChat,
    newSession,
    refreshSessions,
    refreshAgentsList,
    fetchCronJobs,
    fetchCronRuns,
    createCronJob,
    deleteCronJob,
    fetchChannels,
    fetchModels,
    createAgent: createAgentAction,
    deleteAgent: deleteAgentAction,
    fetchTools,
    fetchAgentFiles,
    fetchAgentFileContent,
    saveAgentFile,
    client: clientRef.current,
  }
}
