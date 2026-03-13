import { useState } from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ConnectionConfig, ConnectionError } from '@/store/connection'
import { useI18n } from '@/i18n'

type ConnectDialogProps = {
  onConnect: (config: ConnectionConfig) => void
  state: 'disconnected' | 'connecting' | 'connected' | 'error'
  connError?: ConnectionError | null
  currentConfig: ConnectionConfig | null
}

export function ConnectDialog({ onConnect, state, connError, currentConfig }: ConnectDialogProps) {
  const { t } = useI18n()
  const [url, setUrl] = useState(currentConfig?.url ?? 'http://localhost:18789')
  const [token, setToken] = useState(currentConfig?.token ?? 'e935006e41165e187aecd9ceeed7e965969fce796173bc14')
  const [password, setPassword] = useState(currentConfig?.password ?? '')
  const [showToken, setShowToken] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onConnect({
      url: url.trim(),
      token: token.trim() || undefined,
      password: password.trim() || undefined,
    })
  }

  const isConnecting = state === 'connecting'
  const hasError = state === 'error' || (state === 'disconnected' && connError != null)
  const resolvedErrorMessage = connError?.code === 'CONNECT_FAILED'
    ? t('connection.error.connectFailed')
    : connError?.code === 'UNREACHABLE'
    ? t('connection.error.unreachable')
    : connError?.message

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex w-16 h-16 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            {state === 'connecting' ? (
              <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
            ) : state === 'connected' ? (
              <Wifi size={28} className="text-green-500" />
            ) : (
              <WifiOff size={28} className="text-[var(--text-muted)]" />
            )}
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-semibold text-[var(--text-primary)]">
          {t('connect.title')}
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--text-secondary)]">
          {t('connect.description')}
        </p>

        {/* Error message */}
        {hasError && connError && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-red-400 text-sm font-medium">{t('connect.errorTitle')}</span>
              <span className="text-red-400/80 text-xs">{resolvedErrorMessage}</span>
              {connError.code === 'ORIGIN_NOT_ALLOWED' || connError.message?.includes('origin') ? (
                <span className="mt-1 text-xs text-[var(--text-secondary)]">
                  {t('connect.originHint')}{' '}
                  <code className="rounded bg-[var(--bg-tertiary)] px-1">gateway.controlUi.allowedOrigins: ["*"]</code>
                </span>
              ) : null}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('connect.serverUrl')}</label>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="h-10 rounded-lg"
              disabled={state === 'connecting'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {t('connect.token')} <span className="text-[var(--text-muted)]">({t('common.optional')})</span>
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="sk-..."
                className="h-10 rounded-lg pr-10"
                disabled={state === 'connecting'}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                tabIndex={-1}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {t('connect.password')} <span className="text-[var(--text-muted)]">({t('common.optional')})</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-lg"
              disabled={state === 'connecting'}
            />
          </div>

          <Button
            type="submit"
            className={cn(
              'mt-2 h-10 border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)] hover:bg-[var(--action-hover)]',
              isConnecting && 'cursor-not-allowed opacity-70'
            )}
            disabled={isConnecting || !url.trim()}
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('connect.connecting')}
              </>
            ) : hasError ? (
              t('connect.reconnect')
            ) : (
              t('connect.connect')
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
