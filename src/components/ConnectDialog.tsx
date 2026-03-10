import { useState } from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ConnectionConfig, ConnectionError } from '@/store/connection'

type ConnectDialogProps = {
  onConnect: (config: ConnectionConfig) => void
  state: 'disconnected' | 'connecting' | 'connected' | 'error'
  connError?: ConnectionError | null
  currentConfig: ConnectionConfig | null
}

export function ConnectDialog({ onConnect, state, connError, currentConfig }: ConnectDialogProps) {
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

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
            {state === 'connecting' ? (
              <Loader2 size={28} className="text-primary animate-spin" />
            ) : state === 'connected' ? (
              <Wifi size={28} className="text-green-500" />
            ) : (
              <WifiOff size={28} className="text-[#666]" />
            )}
          </div>
        </div>

        <h2 className="text-white text-2xl font-semibold text-center mb-2">
          连接到 OpenClaw
        </h2>
        <p className="text-[#666] text-sm text-center mb-6">
          输入你的 OpenClaw 实例地址以开始使用
        </p>

        {/* Error message */}
        {hasError && connError && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-red-400 text-sm font-medium">连接失败</span>
              <span className="text-red-400/80 text-xs">{connError.message}</span>
              {connError.code === 'ORIGIN_NOT_ALLOWED' || connError.message?.includes('origin') ? (
                <span className="text-[#666] text-xs mt-1">
                  提示：OpenClaw 拒绝了来自此页面的连接请求（Origin 不在白名单）。
                  请在 openclaw 配置中添加 <code className="bg-[#333] px-1 rounded">gateway.controlUi.allowedOrigins: ["*"]</code>
                </span>
              ) : null}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#a0a0a0] text-sm font-medium">服务器地址</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-primary transition-colors"
              disabled={state === 'connecting'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#a0a0a0] text-sm font-medium">
              Token <span className="text-[#555]">(可选)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="sk-..."
                className="h-10 w-full px-3 pr-10 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-primary transition-colors"
                disabled={state === 'connecting'}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#999] transition-colors"
                tabIndex={-1}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#a0a0a0] text-sm font-medium">
              密码 <span className="text-[#555]">(可选)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 px-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-primary transition-colors"
              disabled={state === 'connecting'}
            />
          </div>

          <Button
            type="submit"
            className={cn('h-10 mt-2', isConnecting && 'opacity-70 cursor-not-allowed')}
            disabled={isConnecting || !url.trim()}
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                连接中...
              </>
            ) : hasError ? (
              '重新连接'
            ) : (
              '连接'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
