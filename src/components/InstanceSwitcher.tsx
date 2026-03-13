import { useState, useRef, useEffect } from 'react'
import { ChevronsUpDown, Plus, Check, Circle, Pencil, Trash2, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Instance, InstanceStatus } from '@/store/instances'
import type { ConnectionConfig } from '@/store/connection'
import { useI18n } from '@/i18n'

type InstanceSwitcherProps = {
  instances: Instance[]
  activeInstanceId: string | null
  onSwitch: (id: string) => void
  onAdd: (name: string, config: ConnectionConfig) => Promise<Instance>
  onUpdate: (id: string, updates: Partial<Pick<Instance, 'name' | 'config'>>) => void
  onRemove: (id: string) => void
  onDisconnect?: () => void
}

function StatusDot({ status }: { status: InstanceStatus }) {
  return (
    <span
      className={cn('w-2 h-2 rounded-full shrink-0', {
        'bg-green-500': status === 'connected',
        'bg-yellow-500 animate-pulse': status === 'connecting',
        'bg-[var(--text-muted)]': status === 'disconnected',
        'bg-red-500': status === 'error',
      })}
    />
  )
}

type AddInstanceFormProps = {
  onSubmit: (name: string, config: ConnectionConfig) => void
  onCancel: () => void
  initial?: { name: string; config: ConnectionConfig }
}

function InstanceForm({ onSubmit, onCancel, initial }: AddInstanceFormProps) {
  const { t } = useI18n()
  const [name, setName] = useState(initial?.name ?? '')
  const [url, setUrl] = useState(initial?.config.url ?? 'http://localhost:18789')
  const [token, setToken] = useState(initial?.config.token ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onSubmit(name, { url: url.trim(), token: token.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-2 py-2">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide">{t('instances.form.name')}</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('instances.form.namePlaceholder')}
          className="h-8 px-2.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide">{t('instances.form.serverUrl')}</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:18789"
          className="h-8 px-2.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide">{t('instances.form.token')}</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="sk-..."
          className="h-8 px-2.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={!url.trim()}
          className="flex-1 h-7 rounded-md border border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-foreground)] text-xs font-medium hover:bg-[var(--action-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {initial ? t('instances.form.save') : t('instances.form.add')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-7 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)] transition-colors"
        >
          {t('instances.form.cancel')}
        </button>
      </div>
    </form>
  )
}

export function InstanceSwitcher({
  instances,
  activeInstanceId,
  onSwitch,
  onAdd,
  onUpdate,
  onRemove,
  onDisconnect,
}: InstanceSwitcherProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeInstance = instances.find((i) => i.id === activeInstanceId)

  // 点击外部关闭面板
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setShowAddForm(false)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSwitch = (id: string) => {
    onSwitch(id)
    setOpen(false)
    setShowAddForm(false)
    setEditingId(null)
  }

  const handleAdd = async (name: string, config: ConnectionConfig) => {
    const instance = await onAdd(name, config)
    // 添加后自动切换到新实例
    onSwitch(instance.id)
    setShowAddForm(false)
    setOpen(false)
  }

  const handleUpdate = (id: string, name: string, config: ConnectionConfig) => {
    onUpdate(id, { name, config })
    setEditingId(null)
  }

  const handleRemove = (id: string) => {
    onRemove(id)
    if (instances.length <= 1) setOpen(false)
  }

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        onClick={() => {
          setOpen((v) => !v)
          setShowAddForm(false)
          setEditingId(null)
        }}
        className={cn(
          'flex items-center justify-between w-full h-11 px-3 rounded-lg border transition-colors',
          'bg-[var(--bg-tertiary)] border-[var(--border-color)]',
          'hover:border-[var(--primary)] hover:bg-[var(--bg-tertiary)]',
          open && 'border-[var(--primary)]'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {activeInstance ? (
            <>
              <StatusDot status={activeInstance.status} />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] text-[var(--text-muted)] leading-none mb-0.5">{t('sidebar.instance.current')}</span>
                <span className="text-[13px] text-[var(--text-primary)] font-medium leading-none truncate max-w-[120px]">
                  {activeInstance.name}
                </span>
              </div>
            </>
          ) : (
            <>
              <Circle size={8} className="text-[var(--text-muted)] shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-[var(--text-muted)] leading-none mb-0.5">{t('sidebar.instance.label')}</span>
                <span className="text-[13px] text-[var(--text-muted)] leading-none">{t('sidebar.instance.unselected')}</span>
              </div>
            </>
          )}
        </div>
        <ChevronsUpDown size={14} className="text-[var(--text-muted)] shrink-0" />
      </button>

      {/* 下拉面板 */}
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-[calc(100%+6px)] left-0 w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {/* 面板标题 */}
          <div className="flex items-center justify-between px-3 h-9 border-b border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wide">{t('instances.panel.title')}</span>
            <button
              onClick={() => { setOpen(false); setShowAddForm(false); setEditingId(null) }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* 实例列表 */}
          <div className="flex flex-col p-1.5 gap-0.5 max-h-60 overflow-y-auto">
            {instances.length === 0 && (
              <p className="text-[var(--text-muted)] text-xs text-center py-3">{t('instances.panel.noInstances')}</p>
            )}
            {instances.map((instance) => (
              <div key={instance.id}>
                {editingId === instance.id ? (
                  <InstanceForm
                    initial={{ name: instance.name, config: instance.config }}
                    onSubmit={(name, config) => handleUpdate(instance.id, name, config)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    className={cn(
                      'group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                      instance.id === activeInstanceId
                        ? 'bg-[var(--bg-tertiary)]'
                        : 'hover:bg-[var(--bg-tertiary)]'
                    )}
                    onClick={() => handleSwitch(instance.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusDot status={instance.status} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] text-[var(--text-primary)] font-medium leading-tight truncate">
                          {instance.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] leading-tight truncate">
                          {instance.config.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {instance.id === activeInstanceId && (
                        <Check size={13} className="text-[var(--primary)]" />
                      )}
                      {/* 编辑/删除按钮，hover 时显示 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(instance.id); setShowAddForm(false) }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                        title={t('instances.actions.edit')}
                      >
                        <Pencil size={12} />
                      </button>
                      {instances.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(instance.id) }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-red-400 transition-all"
                          title={t('instances.actions.delete')}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 分割线 + 添加按钮 */}
          <div className="border-t border-[var(--border-color)]">
            {showAddForm ? (
              <InstanceForm
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <>
                <button
                  onClick={() => { setShowAddForm(true); setEditingId(null) }}
                  className="flex items-center gap-2 w-full px-3 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition-colors"
                >
                  <Plus size={14} />
                  {t('instances.panel.addInstance')}
                </button>
                {activeInstanceId && onDisconnect && (
                  <button
                    onClick={() => {
                      onDisconnect()
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-3 h-9 text-[var(--text-muted)] hover:text-red-400 text-xs transition-colors border-t border-[var(--border-color)]"
                  >
                    <LogOut size={14} />
                    {t('instances.panel.disconnect')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
