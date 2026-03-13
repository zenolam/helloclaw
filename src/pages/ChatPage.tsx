import { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
  Plus, Bot, Code, MessageCircle, Mail, Send, Square,
  ChevronDown, Loader2, Wrench, CheckCircle, AlertCircle,
  Clock, Globe, Cpu, GitBranch, ImagePlus, X,
} from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import type { Session, AgentEntry, ChatMessage } from '@/lib/openclaw-api'
import type { ToolCall, StreamSegment } from '@/store/connection'
import { extractMessageText, extractAgentIdFromSessionKey } from '@/lib/openclaw-api'
import { type TranslateFn, useI18n } from '@/i18n'

const AGENT_COLORS = [
  '#dc2626', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#84cc16',
]

const CHAT_SIDEBAR_WIDTH = 'w-[clamp(18rem,24vw,32rem)]'
const CHAT_BUBBLE_MAX_WIDTH = 'max-w-[min(100%,72ch)] sm:max-w-[min(94%,76ch)] xl:max-w-[min(90%,84ch)]'

function getAgentColor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
}

function getAgentIcon(agentKey?: string | null) {
  if (!agentKey) return <Bot size={20} className="text-white" />
  const lower = agentKey.toLowerCase()
  if (lower.includes('code') || lower.includes('dev')) return <Code size={20} className="text-white" />
  if (lower.includes('mail') || lower.includes('email')) return <Mail size={20} className="text-white" />
  if (lower.includes('chat') || lower.includes('support')) return <MessageCircle size={20} className="text-white" />
  return <Bot size={20} className="text-white" />
}

function extractChannelFromKey(key: string): string {
  const parts = key.split(':')
  return parts[2] ?? 'main'
}

type ChannelConfig = { icon: React.ReactNode; bg: string; label: string }

function getChannelConfig(channel: string, t: TranslateFn): ChannelConfig {
  switch (channel) {
    case 'telegram':
      return {
        label: t('chat.channel.telegram'),
        bg: '#229ED9',
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.67l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.993.889z"/>
          </svg>
        ),
      }
    case 'feishu':
      return {
        label: t('chat.channel.feishu'),
        bg: '#3370FF',
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        ),
      }
    case 'slack':
      return {
        label: t('chat.channel.slack'),
        bg: '#4A154B',
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
        ),
      }
    case 'discord':
      return {
        label: t('chat.channel.discord'),
        bg: '#5865F2',
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
        ),
      }
    case 'whatsapp':
      return {
        label: t('chat.channel.whatsapp'),
        bg: '#25D366',
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        ),
      }
    case 'cron':
      return {
        label: t('chat.channel.cron'),
        bg: '#6366f1',
        icon: <Clock size={9} className="text-white" />,
      }
    case 'subagent':
      return {
        label: t('chat.channel.subagent'),
        bg: '#8b5cf6',
        icon: <GitBranch size={9} className="text-white" />,
      }
    case 'webchat':
      return {
        label: t('chat.channel.webchat'),
        bg: '#10b981',
        icon: <Globe size={9} className="text-white" />,
      }
    case 'main':
      return {
        label: t('chat.channel.main'),
        bg: '#3b82f6',
        icon: <Cpu size={9} className="text-white" />,
      }
    default:
      return {
        label: channel,
        bg: '#555',
        icon: <MessageCircle size={9} className="text-white" />,
      }
  }
}

function getSessionDisplayName(session: Session): string {
  if (session.label) return session.label
  if (session.displayName) return session.displayName
  if (session.agentName) return session.agentName
  if (session.title) return session.title
  const agentId = extractAgentIdFromSessionKey(session.key)
  if (agentId) return agentId
  return session.key
}

function getSessionSubtitle(session: Session): string | null {
  if (session.label || session.displayName) {
    const agentId = extractAgentIdFromSessionKey(session.key)
    if (agentId) return agentId
  }
  return session.preview ?? null
}

const SessionItem = memo(function SessionItem({
  session,
  active,
  onClick,
}: {
  session: Session
  active: boolean
  onClick: () => void
}) {
  const { t } = useI18n()
  const agentId = extractAgentIdFromSessionKey(session.key) ?? session.agentKey ?? session.key
  const color = getAgentColor(agentId)
  const displayName = getSessionDisplayName(session)
  const subtitle = getSessionSubtitle(session)
  const ts = session.updatedAt ?? session.lastMessageAt
  const channelCfg = getChannelConfig(extractChannelFromKey(session.key), t)

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl w-full text-left transition-colors',
        active ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]/50'
      )}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          {getAgentIcon(agentId)}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[var(--bg-secondary)]"
          style={{ backgroundColor: channelCfg.bg }}
          title={channelCfg.label}
        >
          {channelCfg.icon}
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1 whitespace-normal break-words text-[var(--text-primary)] text-sm font-medium leading-snug">
            {displayName}
          </span>
          <span className="pt-0.5 text-[var(--text-muted)] text-xs shrink-0">
            {ts != null ? formatTime(ts) : '—'}
          </span>
        </div>
        {subtitle && (
          <span className="whitespace-normal break-words text-[var(--text-muted)] text-xs leading-snug">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  )
})

function AgentDropdownItem({
  agent,
  onClick,
}: {
  agent: AgentEntry
  onClick: () => void
}) {
  const color = getAgentColor(agent.id)
  const displayName = agent.identity?.name ?? agent.name ?? agent.id
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left hover:bg-[var(--bg-secondary)] transition-colors"
    >
      <div
        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <Bot size={10} className="text-white" />
      </div>
      <span className="text-[var(--text-primary)] text-sm">{displayName}</span>
    </button>
  )
}

const ToolCallItem = memo(function ToolCallItem({ tool }: { tool: ToolCall }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex items-start gap-2 py-1">
      <div className="mt-0.5 shrink-0">
        {tool.state === 'running' ? (
          <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
        ) : (
          <CheckCircle size={14} className="text-green-500" />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-left"
        >
          <Wrench size={12} className="text-[var(--text-muted)] shrink-0" />
          <span className="text-[var(--text-secondary)] text-xs font-mono">{tool.toolName}</span>
          {tool.state === 'running' && (
            <span className="text-[var(--text-muted)] text-xs">{t('chat.tool.running')}</span>
          )}
          <ChevronDown
            size={12}
            className={cn('text-[var(--text-muted)] transition-transform ml-auto', expanded && 'rotate-180')}
          />
        </button>
        {expanded && tool.input != null && (
          <pre className="text-[var(--text-muted)] text-xs bg-[var(--bg-primary)] rounded p-2 overflow-x-auto">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
})

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useI18n()
  const isUser = message.role === 'user'
  const text = extractMessageText(message)

  let attachments = message.attachments ? [...message.attachments] : []

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === 'image' || part.type === 'image_url') {
        let mimeType = 'image/jpeg'
        let content = ''

        if (part.image_url && typeof part.image_url === 'object' && typeof (part.image_url as any).url === 'string') {
          const url = (part.image_url as any).url as string
          if (url.startsWith('data:')) {
            const match = url.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.*)$/)
            if (match) {
              mimeType = match[1]
              content = match[2]
            } else {
              content = url.split(',')[1] || url
            }
          }
        } else if (part.source && typeof part.source === 'object' && typeof (part.source as any).data === 'string') {
          content = (part.source as any).data
          if (typeof (part.source as any).media_type === 'string') {
            mimeType = (part.source as any).media_type
          }
        } else if (typeof part.content === 'string') {
          content = part.content
          if (typeof part.mimeType === 'string') mimeType = part.mimeType
        }

        if (content) {
          attachments.push({ mimeType, content })
        }
      }
    }
  }

  const hasAttachments = attachments.length > 0

  if (!text && !hasAttachments && message.role !== 'tool') return null

  return (
    <div className={cn('flex gap-3 w-full', isUser && 'justify-end')}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={cn('flex flex-col gap-1 min-w-0', CHAT_BUBBLE_MAX_WIDTH, isUser && 'items-end')}>
        {hasAttachments && (
          <div className="flex flex-wrap gap-2 justify-end mb-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative rounded-lg border border-[var(--border-color)] overflow-hidden bg-[var(--bg-tertiary)] max-w-sm">
                {att.mimeType?.startsWith('image/') ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.content}`}
                    alt={att.name || t('chat.attachment')}
                    className="max-h-60 w-auto object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center p-3 text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                    📎 {att.name || t('chat.attachment')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {text && (
          <div
            className={cn(
              'px-3 py-2.5 rounded-xl text-sm leading-relaxed break-words min-w-0',
              isUser
                ? 'rounded-br-sm border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-sm'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{text}</p>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {message.ts && (
          <span className="text-[var(--text-muted)] text-xs px-1">{formatTime(message.ts)}</span>
        )}
      </div>
    </div>
  )
})

const StreamingBubble = memo(function StreamingBubble({ segments }: { segments: StreamSegment[] }) {
  const text = segments.map((segment) => segment.text).join('')
  if (!text) return null

  return (
    <div className="flex gap-3 w-full">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
        <Bot size={16} className="text-white" />
      </div>
      <div className={cn('flex flex-col gap-1 min-w-0', CHAT_BUBBLE_MAX_WIDTH)}>
        <div className="px-3 py-2.5 rounded-xl rounded-bl-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm leading-relaxed break-words min-w-0">
          <div className="markdown-content">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse align-middle bg-[var(--primary)]" />
        </div>
      </div>
    </div>
  )
})

type ChatPageProps = {
  sessions: Session[]
  agents: AgentEntry[]
  activeSessionKey: string | null
  chatState: {
    messages: ChatMessage[]
    stream: string | null
    streamSegments: StreamSegment[]
    toolCalls: ToolCall[]
    loading: boolean
    sending: boolean
    runId: string | null
    error: string | null
  }
  onSelectSession: (key: string) => void
  onSendMessage: (text: string, attachments?: Array<{ mimeType: string; content: string; name?: string }>) => void
  onAbort: () => void
  onNewSession: (agentKey?: string) => void
}

export function ChatPage({
  sessions,
  agents,
  activeSessionKey,
  chatState,
  onSelectSession,
  onSendMessage,
  onAbort,
  onNewSession,
}: ChatPageProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ file: File; previewUrl: string }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find((session) => session.key === activeSessionKey)
  const isBusy = chatState.sending || Boolean(chatState.runId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages, chatState.streamSegments])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }, [draft])

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl))
    }
  }, [attachments])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)
      const newAttachments = newFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      setAttachments((prev) => [...prev, ...newAttachments])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
  }

  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if ((!text && attachments.length === 0) || isBusy) return

    let processedAttachments = undefined
    if (attachments.length > 0) {
      processedAttachments = await Promise.all(
        attachments.map((attachment) => (
          new Promise<{ mimeType: string; content: string; name?: string }>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              resolve({
                mimeType: attachment.file.type,
                content: result.split(',')[1],
                name: attachment.file.name,
              })
            }
            reader.onerror = reject
            reader.readAsDataURL(attachment.file)
          })
        ))
      )
    }

    onSendMessage(text, processedAttachments)
    setDraft('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [attachments, draft, isBusy, onSendMessage])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items) return

    const newAttachments: Array<{ file: File; previewUrl: string }> = []

    for (let index = 0; index < items.length; index += 1) {
      if (items[index].type.indexOf('image') !== -1) {
        const file = items[index].getAsFile()
        if (file) {
          if (newAttachments.length === 0) event.preventDefault()
          newAttachments.push({
            file,
            previewUrl: URL.createObjectURL(file),
          })
        }
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const hasContent = chatState.messages.length > 0 || chatState.streamSegments.length > 0

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className={cn('flex flex-col h-full bg-[var(--bg-secondary)] p-5 gap-4 shrink-0 border-r border-[var(--border-color)]', CHAT_SIDEBAR_WIDTH)}>
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between h-10">
            <span className="text-[var(--text-primary)] text-lg font-semibold">{t('chat.title')}</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] transition-colors hover:bg-[var(--primary-hover)]"
                title={t('chat.newSession')}
              >
                <Plus size={18} className="text-[var(--action-foreground)]" />
              </button>

              {showAgentDropdown && (
                <div className="absolute top-10 left-0 z-50 w-72 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-1 shadow-xl animate-fade-in">
                  <div className="px-3 py-1.5">
                    <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">{t('chat.selectAgent')}</span>
                  </div>
                  {agents.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[var(--text-muted)] text-sm">
                      {t('chat.noAgents')}
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <AgentDropdownItem
                        key={agent.id}
                        agent={agent}
                        onClick={() => {
                          setShowAgentDropdown(false)
                          onNewSession(agent.id)
                        }}
                      />
                    ))
                  )}
                  <div className="border-t border-[var(--border-color)] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowAgentDropdown(false)
                        onNewSession()
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Plus size={16} className="text-[var(--text-muted)]" />
                      <span className="text-[var(--text-secondary)] text-sm">{t('chat.defaultConversation')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center h-7">
            <span className="text-[var(--text-secondary)] text-xs">{t('chat.sessionList')}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-1">
          <div className="flex flex-col gap-2 px-1">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <MessageCircle size={32} className="text-[var(--border-color)]" />
                <p className="text-[var(--text-muted)] text-sm text-center">
                  {t('chat.emptyTitle')}<br />
                  <span className="text-xs">{t('chat.emptyHint')}</span>
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <SessionItem
                  key={session.key}
                  session={session}
                  active={session.key === activeSessionKey}
                  onClick={() => onSelectSession(session.key)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex flex-col flex-1 h-full bg-[var(--bg-primary)] overflow-hidden">
        {activeSessionKey ? (
          <>
            <div className="flex items-center h-[72px] px-8 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getAgentColor(activeSession ? (extractAgentIdFromSessionKey(activeSession.key) ?? activeSession.agentKey ?? activeSessionKey) : activeSessionKey ?? '') }}
                >
                  {getAgentIcon(activeSession ? (extractAgentIdFromSessionKey(activeSession.key) ?? activeSession.agentKey) : null)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[var(--text-primary)] text-base font-semibold">
                    {activeSession ? getSessionDisplayName(activeSession) : t('chat.fallbackTitle')}
                  </span>
                  <span className={cn('text-xs', isBusy ? 'text-[var(--primary)]' : 'text-green-500')}>
                    {isBusy ? t('chat.status.thinking') : t('chat.status.online')}
                  </span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-hidden">
              <div className="flex flex-col gap-3 p-8 pb-4">
                {chatState.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                  </div>
                ) : !hasContent ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: getAgentColor(activeSession ? (extractAgentIdFromSessionKey(activeSession.key) ?? activeSession.agentKey ?? activeSessionKey) : activeSessionKey ?? '') }}
                    >
                      {getAgentIcon(activeSession ? (extractAgentIdFromSessionKey(activeSession.key) ?? activeSession.agentKey) : null)}
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--text-primary)] font-medium">
                        {activeSession ? getSessionDisplayName(activeSession) : t('chat.fallbackAssistant')}
                      </p>
                      <p className="text-[var(--text-muted)] text-sm mt-1">{t('chat.welcomePrompt')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatState.messages.map((message, index) => (
                      <MessageBubble key={message.uuid ?? message.id ?? index} message={message} />
                    ))}

                    {chatState.toolCalls.length > 0 && (
                      <div className="flex gap-3">
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className={cn('flex flex-col gap-1 flex-1 min-w-0 bg-[var(--bg-tertiary)] rounded-xl rounded-bl-sm px-3 py-2', CHAT_BUBBLE_MAX_WIDTH)}>
                          {chatState.toolCalls.map((tool) => (
                            <ToolCallItem key={tool.id} tool={tool} />
                          ))}
                        </div>
                      </div>
                    )}

                    {chatState.streamSegments.length > 0 && (
                      <StreamingBubble segments={chatState.streamSegments} />
                    )}
                  </>
                )}

                {chatState.error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-sm">{chatState.error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-2 px-8 py-4 border-t border-[var(--border-color)] shrink-0">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative group w-16 h-16 rounded-lg border border-[var(--border-color)] overflow-hidden bg-[var(--bg-tertiary)]">
                      {attachment.file.type.startsWith('image/') ? (
                        <img src={attachment.previewUrl} alt={attachment.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] p-1 text-center break-words">
                          {attachment.file.name}
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1 flex items-end gap-2 bg-[var(--bg-tertiary)] rounded-xl px-4 py-2 min-h-12 relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-1 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors shrink-0"
                    title={t('chat.addImage')}
                    disabled={isBusy}
                  >
                    <ImagePlus size={20} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={t('chat.inputPlaceholder')}
                    rows={1}
                    className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] resize-none focus:outline-none leading-relaxed py-1.5 max-h-48"
                    disabled={isBusy}
                  />
                </div>
                {isBusy ? (
                  <button
                    onClick={onAbort}
                    className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors shrink-0"
                    title={t('chat.stop')}
                  >
                    <Square size={16} className="text-[var(--text-secondary)]" />
                  </button>
                ) : (
                  <button
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() && attachments.length === 0}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0',
                      (draft.trim() || attachments.length > 0)
                        ? 'bg-[var(--primary)] text-[var(--action-foreground)] hover:bg-[var(--primary-hover)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--border-color)] cursor-not-allowed'
                    )}
                    title={t('chat.send')}
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
              <MessageCircle size={36} className="text-[var(--border-color)]" />
            </div>
            <div className="text-center">
              <p className="text-[var(--text-primary)] text-lg font-medium">{t('chat.selectConversation')}</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">{t('chat.selectConversationHint')}</p>
            </div>
            <Button
              onClick={() => onNewSession()}
              className="gap-2"
            >
              <Plus size={16} />
              {t('chat.newSession')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
