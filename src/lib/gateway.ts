/**
 * OpenClaw Gateway WebSocket Client
 * Simplified version based on openclaw/ui/src/ui/gateway.ts
 */

export type GatewayEventFrame = {
  type: 'event'
  event: string
  payload?: unknown
  seq?: number
}

export type GatewayResponseFrame = {
  type: 'res'
  id: string
  ok: boolean
  payload?: unknown
  error?: { code: string; message: string; details?: unknown }
}

export type GatewayErrorInfo = {
  code: string
  message: string
  details?: unknown
}

export class GatewayRequestError extends Error {
  readonly gatewayCode: string
  readonly details?: unknown

  constructor(error: GatewayErrorInfo) {
    super(error.message)
    this.name = 'GatewayRequestError'
    this.gatewayCode = error.code
    this.details = error.details
  }
}

export type GatewayHelloOk = {
  type: 'hello-ok'
  protocol: number
  server?: { version?: string; connId?: string }
  features?: { methods?: string[]; events?: string[] }
  snapshot?: unknown
  auth?: {
    deviceToken?: string
    role?: string
    scopes?: string[]
    issuedAtMs?: number
  }
  policy?: { tickIntervalMs?: number }
}

type Pending = {
  resolve: (value: unknown) => void
  reject: (err: unknown) => void
}

export type GatewayClientOptions = {
  url: string
  token?: string
  password?: string
  onHello?: (hello: GatewayHelloOk) => void
  onEvent?: (event: string, payload: unknown) => void
  onClose?: (info: { code: number; reason: string; error?: GatewayErrorInfo }) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export class GatewayClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, Pending>()
  private closed = false
  private backoffMs = 800
  private reqCounter = 0
  private pendingConnectError: GatewayErrorInfo | undefined
  private connectNonce: string | null = null

  constructor(private opts: GatewayClientOptions) {}

  start() {
    this.closed = false
    this.connect()
  }

  stop() {
    this.closed = true
    this.ws?.close()
    this.ws = null
    this.flushPending(new Error('gateway client stopped'))
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private connect() {
    if (this.closed) return

    try {
      this.ws = new WebSocket(this.opts.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.addEventListener('open', () => {
      this.backoffMs = 800
      this.connectNonce = null
      // Wait for connect.challenge event before sending connect request
    })

    this.ws.addEventListener('message', (ev) => {
      this.handleMessage(String(ev.data ?? ''))
    })

    this.ws.addEventListener('close', (ev) => {
      this.ws = null
      const reason = String(ev.reason ?? '')
      const connectError = this.pendingConnectError
      this.pendingConnectError = undefined
      this.flushPending(new Error(`gateway closed (${ev.code}): ${reason}`))
      this.opts.onClose?.({ code: ev.code, reason, error: connectError })
      this.opts.onDisconnected?.()
      if (!this.closed) {
        this.scheduleReconnect()
      }
    })

    this.ws.addEventListener('error', () => {
      // close handler will fire
    })
  }

  private scheduleReconnect() {
    if (this.closed) return
    const delay = this.backoffMs
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000)
    window.setTimeout(() => this.connect(), delay)
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) {
      p.reject(err)
    }
    this.pending.clear()
  }

  private async sendConnect() {
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'webchat-ui',
        version: '0.1.0',
        platform: typeof navigator !== 'undefined' ? (navigator.platform ?? 'web') : 'electron',
        mode: 'ui',
      },
      role: 'operator',
      scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
      caps: ['tool-events'],
      auth: this.opts.token || this.opts.password
        ? { token: this.opts.token, password: this.opts.password }
        : undefined,
    }

    try {
      const hello = await this.request<GatewayHelloOk>('connect', params)
      this.opts.onHello?.(hello)
      this.opts.onConnected?.()
    } catch (err) {
      if (err instanceof GatewayRequestError) {
        this.pendingConnectError = {
          code: err.gatewayCode,
          message: err.message,
          details: err.details,
        }
      }
      this.ws?.close(4001, 'connect failed')
    }
  }

  private handleMessage(raw: string) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }

    if (!parsed || typeof parsed !== 'object') return
    const frame = parsed as Record<string, unknown>

    if (frame.type === 'res') {
      const res = frame as unknown as GatewayResponseFrame
      const pending = this.pending.get(res.id)
      if (!pending) return
      this.pending.delete(res.id)
      if (res.ok) {
        pending.resolve(res.payload)
      } else {
        pending.reject(new GatewayRequestError(res.error ?? { code: 'unknown', message: 'Unknown error' }))
      }
    } else if (frame.type === 'event') {
      const ev = frame as unknown as GatewayEventFrame
      if (ev.event === 'connect.challenge') {
        const payload = ev.payload as { nonce?: string } | undefined
        const nonce = payload?.nonce
        if (nonce) {
          this.connectNonce = nonce
          void this.sendConnect()
        }
        return
      }
      this.opts.onEvent?.(ev.event, ev.payload)
    }
  }

  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('not connected'))
        return
      }

      const id = `req-${++this.reqCounter}`
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      this.ws.send(JSON.stringify({ type: 'req', id, method, params }))
    })
  }
}
