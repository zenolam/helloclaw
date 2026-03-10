/**
 * Electron API Type Definitions
 */

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  onMainProcessMessage: (callback: (message: string) => void) => void

  // Generic invoke for dynamic IPC calls
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>

  // Instances API
  instances: {
    list: () => Promise<import('@/store/instances').Instance[]>
    add: (instance: {
      id: string
      name: string
      url: string
      token?: string
      password?: string
      useProxy?: boolean
      status: string
      createdAt: number
    }) => Promise<void>
    update: (id: string, updates: {
      name?: string
      url?: string
      token?: string
      password?: string
      useProxy?: boolean
      status?: string
    }) => Promise<void>
    remove: (id: string) => Promise<void>
  }

  // Settings API
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
