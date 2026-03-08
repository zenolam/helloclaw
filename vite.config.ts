import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isWebOnly = process.env.VITE_WEB_ONLY === 'true'

export default defineConfig({
  plugins: [
    react(),
    ...(!isWebOnly ? [
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
            },
          },
          onstart(options) {
            options.reload()
          },
        },
      ]),
      renderer(),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy WebSocket to OpenClaw gateway.
      // This makes the browser's Origin appear as a loopback address,
      // passing OpenClaw's origin check (isLocalClient=true + loopback origin).
      // Target can be overridden via OPENCLAW_URL env var.
      '/openclaw-ws': {
        target: process.env.OPENCLAW_URL ?? 'http://localhost:18789',
        ws: true,
        rewrite: (path) => path.replace(/^\/openclaw-ws/, ''),
        changeOrigin: true,
      },
    },
  },
})
