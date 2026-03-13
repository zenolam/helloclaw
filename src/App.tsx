import { useState, useEffect, useRef, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import type { Page } from '@/components/Sidebar'
import { ConnectDialog } from '@/components/ConnectDialog'
import { AppView } from '@/components/AppView'
import { ChatPage } from '@/pages/ChatPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { AgentDetailPage } from '@/pages/AgentDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AppCenterPage } from '@/pages/AppCenterPage'
import { useOpenClawConnection } from '@/store/connection'
import { useInstances } from '@/store/instances'
import { useApps } from '@/apps/store'
import type { BootstrapFiles, SkillConfig } from '@/apps/types'
import { buildSkillWorkspacePath } from '@/apps/skills'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AgentEntry } from '@/lib/openclaw-api'
import { GatewayRequestError } from '@/lib/gateway'
import { useI18n } from '@/i18n'

function buildAgentWorkspacePath(agentId: string): string {
  const normalizedId = agentId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  if (!normalizedId || normalizedId === 'main') {
    return '~/.openclaw/workspace'
  }

  return `~/.openclaw/workspace-${normalizedId}`
}

function isMissingAgentError(err: unknown): boolean {
  const messages = [
    err instanceof Error ? err.message : String(err),
    err instanceof GatewayRequestError && typeof err.details === 'object' && err.details
      ? JSON.stringify(err.details)
      : '',
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  return messages.some((message) =>
    message.includes('not found')
    || message.includes('unknown agent id')
    || message.includes('does not exist')
    || message.includes('不存在')
    || message.includes('找不到')
  )
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function retryOnMissingAgent<T>(
  operation: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = opts?.retries ?? 5
  const baseDelayMs = opts?.baseDelayMs ?? 200

  let lastError: unknown

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await operation()
    } catch (err) {
      lastError = err

      if (!isMissingAgentError(err) || attempt === retries - 1) {
        throw err
      }

      await delay(baseDelayMs * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export default function App() {
  const { t } = useI18n()
  const [activePage, setActivePage] = useState<Page>('chat')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedAgent, setSelectedAgent] = useState<AgentEntry | null>(null)
  const isMacDesktop = typeof window !== 'undefined'
    && !!window.electronAPI
    && typeof navigator !== 'undefined'
    && /mac/i.test(navigator.platform)

  // 多实例管理
  const {
    instances,
    activeInstanceId,
    activeInstance,
    addInstance,
    updateInstance,
    removeInstance,
    switchInstance,
    setInstanceStatus,
  } = useInstances()

  // 当前活跃实例的连接
  const connection = useOpenClawConnection()

  // 准备应用 SDK 所需的回调，将应用操作映射到 OpenClaw API
  const sdkCallbacks = useMemo(() => ({
    createAgent: async (config: { id: string; name: string; bootstrapFiles?: BootstrapFiles }) => {
      const createdAgent = await connection.createAgent({
        name: config.name,
        workspace: buildAgentWorkspacePath(config.id),
      })

      const resolvedAgentId = typeof createdAgent?.agentId === 'string' && createdAgent.agentId.trim()
        ? createdAgent.agentId.trim()
        : config.id

      if (config.bootstrapFiles) {
        for (const [name, content] of Object.entries(config.bootstrapFiles)) {
          await retryOnMissingAgent(
            () => connection.saveAgentFile(resolvedAgentId, name, content)
          )
        }
      }

      return createdAgent
    },
    deleteAgent: async (agentId: string) => {
      try {
        await connection.deleteAgent(agentId)
      } catch (err) {
        if (!isMissingAgentError(err)) {
          throw err
        }
        console.warn(`[App] Agent "${agentId}" was already missing during instance cleanup`)
      }
    },
    createSkill: async (agentId: string, skill: SkillConfig) => {
      await retryOnMissingAgent(
        () => connection.saveAgentFile(agentId, buildSkillWorkspacePath(skill.slug), skill.content)
      )

      if (skill.files) {
        for (const [relativePath, content] of Object.entries(skill.files)) {
          await retryOnMissingAgent(
            () => connection.saveAgentFile(agentId, buildSkillWorkspacePath(skill.slug, relativePath), content)
          )
        }
      }
    },
    addCronJob: async (job: any) => {
      await retryOnMissingAgent(
        () => connection.createCronJob(job)
      )
    },
  }), [connection.createAgent, connection.deleteAgent, connection.saveAgentFile, connection.createCronJob])

  // 应用中心状态
  const { installedApps, appInstances, downloadedApps } = useApps(sdkCallbacks)

  const {
    config,
    state,
    connError,
    sessions,
    agentsList,
    activeSessionKey,
    chatState,
    connect,
    disconnect,
    selectSession,
    sendMessage,
    abortChat,
    newSession,
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
  } = connection

  // 同步连接状态到实例状态
  useEffect(() => {
    if (activeInstanceId) {
      setInstanceStatus(activeInstanceId, state === 'connected' ? 'connected' : state === 'connecting' ? 'connecting' : state === 'error' ? 'error' : 'disconnected')
    }
  }, [state, activeInstanceId, setInstanceStatus])

  // 切换实例时重新连接
  const prevInstanceIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!activeInstance) return
    if (prevInstanceIdRef.current === activeInstanceId) return
    prevInstanceIdRef.current = activeInstanceId

    connect(activeInstance.config)
    setSelectedAgent(null)
  }, [activeInstanceId, activeInstance, connect])

  const isConnected = state === 'connected'

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    setSelectedAgent(null)
  }

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleAddInstance = (name: string, cfg: import('@/store/connection').ConnectionConfig) => {
    return addInstance(name, cfg)
  }

  const handleSwitchInstance = (id: string) => {
    switchInstance(id)
  }

  const handleDisconnectInstance = () => {
    disconnect()
  }

  const handleCreateAgent = async (name: string) => {
    await createAgentAction({
      name,
      workspace: buildAgentWorkspacePath(name),
    })
    await refreshAgentsList()
  }

  const handleDeleteAgent = async (agentId: string) => {
    await deleteAgentAction(agentId, { deleteFiles: true })
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null)
    }
    await refreshAgentsList()
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg-primary)]">
        {isMacDesktop && (
          <div className="drag-region h-8 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/95" />
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            activePage={activePage}
            onNavigate={handleNavigate}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            instances={instances}
            activeInstanceId={activeInstanceId}
            onSwitchInstance={handleSwitchInstance}
            onAddInstance={handleAddInstance}
            onUpdateInstance={updateInstance}
            onRemoveInstance={removeInstance}
            onDisconnectInstance={handleDisconnectInstance}
            appInstances={appInstances}
            downloadedApps={downloadedApps}
          />

          <main className="flex min-h-0 flex-1 overflow-hidden">
            {!isConnected ? (
              <ConnectDialog
                onConnect={async (cfg) => {
                  if (activeInstanceId) {
                    updateInstance(activeInstanceId, { config: cfg })
                  } else {
                    const newInstance = await addInstance(t('instances.default.connection'), cfg)
                    switchInstance(newInstance.id)
                  }
                  connect(cfg)
                }}
                state={state}
                connError={connError}
                currentConfig={activeInstance?.config ?? config}
              />
            ) : (
              <>
                {activePage === 'chat' && (
                  <ChatPage
                    sessions={sessions.filter((s) => {
                      const k = s.key
                      if (k.includes(':cron:')) return false
                      if (k.includes(':run:')) return false
                      if (k.includes(':subagent:')) return false
                      return true
                    })}
                    agents={agentsList}
                    activeSessionKey={activeSessionKey}
                    chatState={chatState}
                    onSelectSession={selectSession}
                    onSendMessage={sendMessage}
                    onAbort={abortChat}
                    onNewSession={newSession}
                  />
                )}

                {activePage === 'agents' && !selectedAgent && (
                  <AgentsPage
                    agentsList={agentsList}
                    onSelectAgent={(agent) => setSelectedAgent(agent)}
                    onRefresh={refreshAgentsList}
                    onCreateAgent={handleCreateAgent}
                    onDeleteAgent={handleDeleteAgent}
                  />
                )}

                {activePage === 'agents' && selectedAgent && (
                  <AgentDetailPage
                    agent={selectedAgent}
                    onBack={() => setSelectedAgent(null)}
                    fetchCronJobs={fetchCronJobs}
                    fetchCronRuns={fetchCronRuns}
                    createCronJob={createCronJob}
                    deleteCronJob={deleteCronJob}
                    fetchChannels={fetchChannels}
                    fetchTools={fetchTools}
                    fetchAgentFiles={fetchAgentFiles}
                    fetchAgentFileContent={fetchAgentFileContent}
                    saveAgentFile={saveAgentFile}
                  />
                )}

                {activePage === 'settings' && (
                  <SettingsPage
                    config={activeInstance?.config ?? config}
                    fetchModels={fetchModels}
                    fetchChannels={fetchChannels}
                  />
                )}

                {activePage === 'appCenter' && (
                  <AppCenterPage
                    onOpenApp={(instanceId) => setActivePage({ type: 'appInstance', instanceId })}
                    sdkCallbacks={sdkCallbacks}
                  />
                )}

                {typeof activePage === 'object' && activePage.type === 'appInstance' && (
                  <AppView
                    appId={activePage.instanceId}
                    onBack={() => setActivePage('appCenter')}
                    sdkCallbacks={sdkCallbacks}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
