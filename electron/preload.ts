const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event: unknown, message: string) => callback(message))
  },

  // Generic invoke for dynamic IPC calls (used by apps store)
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },

  // ─── Instances (SQLite via main process) ──────────────────────────────────
  instances: {
    list: (): Promise<import('../src/store/instances').Instance[]> =>
      ipcRenderer.invoke('instances:list'),

    add: (instance: {
      id: string; name: string; url: string; token?: string;
      password?: string; useProxy?: boolean; status: string; createdAt: number
    }): Promise<void> =>
      ipcRenderer.invoke('instances:add', instance),

    update: (id: string, updates: {
      name?: string; url?: string; token?: string;
      password?: string; useProxy?: boolean; status?: string
    }): Promise<void> =>
      ipcRenderer.invoke('instances:update', id, updates),

    remove: (id: string): Promise<void> =>
      ipcRenderer.invoke('instances:remove', id),
  },

  // ─── Settings (SQLite via main process) ───────────────────────────────────
  settings: {
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke('settings:get', key),

    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke('settings:set', key, value),
  },
})
