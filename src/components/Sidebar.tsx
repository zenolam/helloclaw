import { MessageSquare, Bot, Settings, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstanceSwitcher } from './InstanceSwitcher'
import type { Instance } from '@/store/instances'
import type { ConnectionConfig } from '@/store/connection'

type NavItem = 'chat' | 'agents' | 'settings'

type SidebarProps = {
  activePage: NavItem
  onNavigate: (page: NavItem) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  instances: Instance[]
  activeInstanceId: string | null
  onSwitchInstance: (id: string) => void
  onAddInstance: (name: string, config: ConnectionConfig) => Promise<Instance>
  onUpdateInstance: (id: string, updates: Partial<Pick<Instance, 'name' | 'config'>>) => void
  onRemoveInstance: (id: string) => void
}

export function Sidebar({
  activePage,
  onNavigate,
  theme,
  onToggleTheme,
  instances,
  activeInstanceId,
  onSwitchInstance,
  onAddInstance,
  onUpdateInstance,
  onRemoveInstance,
}: SidebarProps) {
  const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'chat', icon: <MessageSquare size={20} />, label: '聊天' },
    { id: 'agents', icon: <Bot size={20} />, label: '代理' },
    { id: 'settings', icon: <Settings size={20} />, label: '设置' },
  ]

  return (
    <aside className="flex flex-col w-60 h-full bg-[var(--bg-secondary)] px-5 py-6 gap-2 shrink-0 border-r border-[var(--border-color)]">
      {/* Logo */}
      <div className="flex items-center gap-3 h-10 mb-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <span className="text-[var(--text-primary)] font-semibold text-xl">HelloClaw</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 pt-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors w-full text-left',
              activePage === item.id
                ? 'bg-[var(--primary)] text-white font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="flex items-center rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-0.5 h-10">
          <button className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--primary)] text-white text-xs font-medium">
            中
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)] transition-colors">
            En
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Instance Switcher */}
      <InstanceSwitcher
        instances={instances}
        activeInstanceId={activeInstanceId}
        onSwitch={onSwitchInstance}
        onAdd={onAddInstance}
        onUpdate={onUpdateInstance}
        onRemove={onRemoveInstance}
      />
    </aside>
  )
}
