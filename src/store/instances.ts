import { useState, useCallback, useEffect } from 'react'
import type { ConnectionConfig } from './connection'

export type InstanceStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

export type Instance = {
  id: string
  name: string
  config: ConnectionConfig
  status: InstanceStatus
  createdAt: number
}

// ─── Environment detection ────────────────────────────────────────────────────

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window

type ElectronAPI = {
  instances: {
    list: () => Promise<Instance[]>
    add: (instance: {
      id: string; name: string; url: string; token?: string;
      password?: string; useProxy?: boolean; status: string; createdAt: number
    }) => Promise<void>
    update: (id: string, updates: {
      name?: string; url?: string; token?: string;
      password?: string; useProxy?: boolean; status?: string
    }) => Promise<void>
    remove: (id: string) => Promise<void>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
  }
}

function getElectronAPI(): ElectronAPI {
  return (window as unknown as { electronAPI: ElectronAPI }).electronAPI
}

// ─── localStorage fallback (Web mode) ────────────────────────────────────────

const LS_INSTANCES_KEY = 'helloclaw:instances'
const LS_ACTIVE_KEY = 'helloclaw:active-instance'

function lsLoadInstances(): Instance[] {
  try {
    const raw = localStorage.getItem(LS_INSTANCES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Instance[]
  } catch {
    return []
  }
}

function lsSaveInstances(instances: Instance[]) {
  localStorage.setItem(LS_INSTANCES_KEY, JSON.stringify(instances))
}

function lsGetActiveId(): string | null {
  return localStorage.getItem(LS_ACTIVE_KEY)
}

function lsSetActiveId(id: string | null) {
  if (id) localStorage.setItem(LS_ACTIVE_KEY, id)
  else localStorage.removeItem(LS_ACTIVE_KEY)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * 将旧版单连接配置（helloclaw:connection）迁移为第一个实例
 * 仅在 Web 模式下执行（Electron 模式下 SQLite 为空时也会触发）
 */
function migrateFromLegacy(): Instance[] {
  const existing = lsLoadInstances()
  if (existing.length > 0) return existing

  try {
    const raw = localStorage.getItem('helloclaw:connection')
    if (!raw) return []
    const config = JSON.parse(raw) as ConnectionConfig
    const instance: Instance = {
      id: generateId(),
      name: 'Production',
      config,
      status: 'disconnected',
      createdAt: Date.now(),
    }
    lsSaveInstances([instance])
    return [instance]
  } catch {
    return []
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInstances() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // 初始化：从 SQLite 或 localStorage 加载
  useEffect(() => {
    async function init() {
      let loaded: Instance[]
      let activeId: string | null

      if (isElectron) {
        const api = getElectronAPI()
        loaded = await api.instances.list()

        // 如果 SQLite 为空，尝试从 localStorage 迁移
        if (loaded.length === 0) {
          const legacy = migrateFromLegacy()
          for (const inst of legacy) {
            await api.instances.add({
              id: inst.id,
              name: inst.name,
              url: inst.config.url,
              token: inst.config.token,
              password: inst.config.password,
              useProxy: inst.config.useProxy,
              status: inst.status,
              createdAt: inst.createdAt,
            })
          }
          loaded = legacy
        }

        const savedActive = await api.settings.get('active-instance-id')
        activeId = savedActive && loaded.find((i) => i.id === savedActive)
          ? savedActive
          : loaded[0]?.id ?? null
      } else {
        loaded = migrateFromLegacy()
        const savedActive = lsGetActiveId()
        activeId = savedActive && loaded.find((i) => i.id === savedActive)
          ? savedActive
          : loaded[0]?.id ?? null
      }

      setInstances(loaded)
      setActiveInstanceId(activeId)
      setReady(true)
    }

    init()
  }, [])

  const activeInstance = instances.find((i) => i.id === activeInstanceId) ?? null

  const addInstance = useCallback(async (name: string, config: ConnectionConfig): Promise<Instance> => {
    const instance: Instance = {
      id: generateId(),
      name: name.trim() || '新实例',
      config,
      status: 'disconnected',
      createdAt: Date.now(),
    }

    if (isElectron) {
      await getElectronAPI().instances.add({
        id: instance.id,
        name: instance.name,
        url: config.url,
        token: config.token,
        password: config.password,
        useProxy: config.useProxy,
        status: instance.status,
        createdAt: instance.createdAt,
      })
    } else {
      setInstances((prev) => {
        const next = [...prev, instance]
        lsSaveInstances(next)
        return next
      })
      return instance
    }

    setInstances((prev) => [...prev, instance])
    return instance
  }, [])

  const updateInstance = useCallback(async (
    id: string,
    updates: Partial<Pick<Instance, 'name' | 'config'>>
  ) => {
    if (isElectron) {
      await getElectronAPI().instances.update(id, {
        name: updates.name,
        url: updates.config?.url,
        token: updates.config?.token,
        password: updates.config?.password,
        useProxy: updates.config?.useProxy,
      })
    }

    setInstances((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      if (!isElectron) lsSaveInstances(next)
      return next
    })
  }, [])

  const removeInstance = useCallback(async (id: string) => {
    if (isElectron) {
      await getElectronAPI().instances.remove(id)
    }

    setInstances((prev) => {
      const next = prev.filter((i) => i.id !== id)
      if (!isElectron) lsSaveInstances(next)
      return next
    })

    setActiveInstanceId((prev) => {
      if (prev !== id) return prev
      const remaining = instances.filter((i) => i.id !== id)
      const nextId = remaining[0]?.id ?? null
      if (isElectron) {
        getElectronAPI().settings.set('active-instance-id', nextId ?? '')
      } else {
        lsSetActiveId(nextId)
      }
      return nextId
    })
  }, [instances])

  const switchInstance = useCallback(async (id: string) => {
    setActiveInstanceId(id)
    if (isElectron) {
      await getElectronAPI().settings.set('active-instance-id', id)
    } else {
      lsSetActiveId(id)
    }
  }, [])

  const setInstanceStatus = useCallback(async (id: string, status: InstanceStatus) => {
    if (isElectron) {
      await getElectronAPI().instances.update(id, { status })
    }
    setInstances((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, status } : i))
      if (!isElectron) lsSaveInstances(next)
      return next
    })
  }, [])

  return {
    instances,
    activeInstanceId,
    activeInstance,
    ready,
    addInstance,
    updateInstance,
    removeInstance,
    switchInstance,
    setInstanceStatus,
  }
}
