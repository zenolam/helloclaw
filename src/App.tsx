import { useState, useEffect, useRef } from 'react'
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
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AgentEntry } from '@/lib/openclaw-api'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('chat')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedAgent, setSelectedAgent] = useState<AgentEntry | null>(null)

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

  // 应用中心状态
  const { installedApps } = useApps()

  // 当前活跃实例的连接
  const connection = useOpenClawConnection()

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

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
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
          installedApps={installedApps}
        />

        <main className="flex flex-1 h-full overflow-hidden">
          {!isConnected ? (
            <ConnectDialog
              onConnect={async (cfg) => {
                if (activeInstanceId) {
                  updateInstance(activeInstanceId, { config: cfg })
                } else {
                  const newInstance = await addInstance('默认实例', cfg)
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
                  onOpenApp={(appId) => setActivePage({ type: 'app', id: appId })}
                />
              )}

              {typeof activePage === 'object' && activePage.type === 'app' && (
                <AppView
                  appId={activePage.id}
                  onBack={() => setActivePage('appCenter')}
                />
              )}
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
