import type { BootstrapFileName, BootstrapFiles } from './types'

export const OPENCLAW_BOOTSTRAP_FILE_NAMES: readonly BootstrapFileName[] = [
  'AGENTS.md',
  'SOUL.md',
  'TOOLS.md',
  'IDENTITY.md',
  'USER.md',
  'HEARTBEAT.md',
  'BOOTSTRAP.md',
  'MEMORY.md',
  'memory.md',
]

export function collectAppBootstrapFiles(
  files: Record<string, string>,
  overrides?: BootstrapFiles
): BootstrapFiles {
  const bootstrapFiles: BootstrapFiles = {}

  for (const name of OPENCLAW_BOOTSTRAP_FILE_NAMES) {
    const content = overrides?.[name] ?? files[name]
    if (typeof content === 'string') {
      bootstrapFiles[name] = content
    }
  }

  return bootstrapFiles
}
