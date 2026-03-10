import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'

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
const db = new Database(dbPath)

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
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id           TEXT PRIMARY KEY,
    manifest     TEXT NOT NULL,
    installed_at INTEGER NOT NULL,
    enabled      INTEGER DEFAULT 1,
    install_path TEXT NOT NULL
  )
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
    instance.createdAt
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
  db.prepare(`UPDATE instances SET ${fields.join(', ')} WHERE id = ?`).run(...values)
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

// ─── Apps IPC handlers ────────────────────────────────────────────────────────

ipcMain.handle('apps:list', () => {
  return db.prepare('SELECT * FROM apps ORDER BY installed_at DESC').all() as Record<string, unknown>[]
})

ipcMain.handle('apps:get', (_event, id: string) => {
  return db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as Record<string, unknown> | undefined
})

ipcMain.handle('apps:add', (_event, app: {
  id: string
  manifest: string
  installed_at: number
  enabled: number
  install_path: string
}) => {
  db.prepare(`
    INSERT INTO apps (id, manifest, installed_at, enabled, install_path)
    VALUES (?, ?, ?, ?, ?)
  `).run(app.id, app.manifest, app.installed_at, app.enabled, app.install_path)
  return app
})

ipcMain.handle('apps:update', (_event, id: string, updates: Record<string, unknown>) => {
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.manifest !== undefined)     { fields.push('manifest = ?');     values.push(updates.manifest) }
  if (updates.installed_at !== undefined) { fields.push('installed_at = ?'); values.push(updates.installed_at) }
  if (updates.enabled !== undefined)      { fields.push('enabled = ?');      values.push(updates.enabled) }
  if (updates.install_path !== undefined) { fields.push('install_path = ?'); values.push(updates.install_path) }

  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE apps SET ${fields.join(', ')} WHERE id = ?`).run(...values)
})

ipcMain.handle('apps:remove', (_event, id: string) => {
  db.prepare('DELETE FROM apps WHERE id = ?').run(id)
})

// Scan local apps directory
ipcMain.handle('apps:scanLocal', () => {
  console.log('[apps:scanLocal] Scanning for local apps...')

  // In development, use project's apps directory
  // In production, use user data directory
  let localAppsPath: string
  if (VITE_DEV_SERVER_URL) {
    // Development mode - use project root apps directory
    localAppsPath = path.join(process.env.APP_ROOT!, 'apps')
  } else {
    // Production mode - use user data directory
    localAppsPath = path.join(app.getPath('userData'), 'apps')
  }

  console.log(`[apps:scanLocal] localAppsPath: ${localAppsPath}`)

  // Check if apps directory exists
  if (!fs.existsSync(localAppsPath)) {
    console.log('[apps:scanLocal] Apps directory does not exist')
    return []
  }

  const localApps: Array<{
    id: string
    manifest: string
    path: string
    files: string
  }> = []

  try {
    const appDirs = fs.readdirSync(localAppsPath, { withFileTypes: true })
      .filter((dirent: { isDirectory: () => boolean }) => dirent.isDirectory())
      .map((dirent: { name: string }) => dirent.name)

    console.log(`[apps:scanLocal] Found ${appDirs.length} directories: ${appDirs.join(', ')}`)

    for (const appDir of appDirs) {
      const appPath = path.join(localAppsPath, appDir)
      const manifestPath = path.join(appPath, 'manifest.json')

      // Check if manifest.json exists
      if (!fs.existsSync(manifestPath)) {
        continue
      }

      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
        const manifest = JSON.parse(manifestContent)

        // Read all files in the app directory
        const files: Record<string, string> = {}

        const readDir = (dir: string, basePath: string = '') => {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

            if (entry.isDirectory()) {
              readDir(fullPath, relativePath)
            } else {
              // Skip certain files
              if (entry.name === 'icon.svg' || entry.name.endsWith('.png') || entry.name.endsWith('.jpg')) {
                continue
              }
              try {
                files[relativePath] = fs.readFileSync(fullPath, 'utf-8')
              } catch {
                // Skip files that can't be read
              }
            }
          }
        }

        readDir(appPath)

        console.log(`[apps:scanLocal] Successfully scanned app: ${manifest.id || appDir}`)
        console.log(`[apps:scanLocal] App files: ${Object.keys(files).join(', ')}`)
        if (manifest.style) {
          console.log(`[apps:scanLocal] Style file "${manifest.style}" exists: ${!!files[manifest.style]}`)
          if (files[manifest.style]) {
            console.log(`[apps:scanLocal] Style content preview: ${files[manifest.style].substring(0, 100)}...`)
          }
        }

        localApps.push({
          id: manifest.id || appDir,
          manifest: manifestContent,
          path: appPath,
          files: JSON.stringify(files),
        })
      } catch (err) {
        console.error(`[apps:scanLocal] Failed to parse manifest for ${appDir}:`, err)
      }
    }
  } catch (err) {
    console.error('[apps:scanLocal] Failed to scan local apps:', err)
  }

  console.log(`[apps:scanLocal] Returning ${localApps.length} apps`)
  return localApps
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

  // Log preload path for debugging
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('[main] Preload path:', preloadPath)
  console.log('[main] Preload exists:', fs.existsSync(preloadPath))

  // Open DevTools in development mode
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools()
  }

  // Log preload errors
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[main] Preload error:', preloadPath, error)
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

// Debug: Test IPC handler
ipcMain.handle('debug:ping', () => {
  console.log('[DEBUG] Ping received!')
  return 'pong'
})
