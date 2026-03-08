import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

// ─── SQLite setup ────────────────────────────────────────────────────────────

const dbPath = path.join(app.getPath('userData'), 'helloclaw.db')
const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS instances (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    token       TEXT,
    password    TEXT,
    use_proxy   INTEGER,
    status      TEXT NOT NULL DEFAULT 'disconnected',
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// ─── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.handle('instances:list', () => {
  const rows = db.prepare('SELECT * FROM instances ORDER BY created_at ASC').all() as Record<string, unknown>[]
  return rows.map(rowToInstance)
})

ipcMain.handle('instances:add', (_event, instance: {
  id: string; name: string; url: string; token?: string;
  password?: string; useProxy?: boolean; status: string; createdAt: number
}) => {
  db.prepare(`
    INSERT INTO instances (id, name, url, token, password, use_proxy, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    instance.id,
    instance.name,
    instance.url,
    instance.token ?? null,
    instance.password ?? null,
    instance.useProxy ? 1 : 0,
    instance.status,
    instance.createdAt,
  )
  return instance
})

ipcMain.handle('instances:update', (_event, id: string, updates: {
  name?: string; url?: string; token?: string; password?: string;
  useProxy?: boolean; status?: string
}) => {
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.name !== undefined)     { fields.push('name = ?');      values.push(updates.name) }
  if (updates.url !== undefined)      { fields.push('url = ?');       values.push(updates.url) }
  if (updates.token !== undefined)    { fields.push('token = ?');     values.push(updates.token || null) }
  if (updates.password !== undefined) { fields.push('password = ?');  values.push(updates.password || null) }
  if (updates.useProxy !== undefined) { fields.push('use_proxy = ?'); values.push(updates.useProxy ? 1 : 0) }
  if (updates.status !== undefined)   { fields.push('status = ?');    values.push(updates.status) }

  if (fields.length === 0) return
  values.push(id)
  type SQLValue = string | number | null | Uint8Array
  db.prepare(`UPDATE instances SET ${fields.join(', ')} WHERE id = ?`).run(...(values as SQLValue[]))
})

ipcMain.handle('instances:remove', (_event, id: string) => {
  db.prepare('DELETE FROM instances WHERE id = ?').run(id)
})

ipcMain.handle('settings:get', (_event, key: string) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
})

ipcMain.handle('settings:set', (_event, key: string, value: string) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
})

function rowToInstance(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    config: {
      url: row.url as string,
      token: (row.token as string | null) ?? undefined,
      password: (row.password as string | null) ?? undefined,
      useProxy: row.use_proxy ? true : undefined,
    },
    status: row.status as string,
    createdAt: row.created_at as number,
  }
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

ipcMain.handle('get-app-version', () => app.getVersion())
