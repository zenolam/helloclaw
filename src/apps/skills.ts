import type { RemoteSkillDefinition, SkillConfig } from './types'

const SKILL_FILE_PATH_REGEX = /^skills\/([^/]+)\/SKILL\.md$/
export const REMOTE_SKILLS_CONFIG_PATH = 'skills/remote.json'

export function extractSkillSlug(skillPath: string): string | null {
  const normalizedPath = skillPath.replace(/\\/g, '/')
  const match = normalizedPath.match(SKILL_FILE_PATH_REGEX)
  return match ? match[1] : null
}

function parseSkillFrontmatter(content: string): Record<string, string> {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/
  const match = content.match(frontmatterRegex)
  const frontmatter: Record<string, string> = {}

  if (match) {
    match[1].split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        frontmatter[key] = value
      }
    })
  }

  return frontmatter
}

export function normalizeSkillSlug(skillSlug: string): string {
  const normalizedSlug = skillSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  if (!normalizedSlug) {
    throw new Error('Skill slug is required')
  }

  return normalizedSlug
}

function normalizeSkillRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.?\//, '').trim()
  if (!normalized || normalized.startsWith('/') || normalized.split('/').some((part) => part === '' || part === '..')) {
    throw new Error(`Invalid skill file path: ${relativePath}`)
  }
  return normalized
}

export function buildSkillWorkspacePath(skillSlug: string, relativePath: string = 'SKILL.md'): string {
  return `skills/${normalizeSkillSlug(skillSlug)}/${normalizeSkillRelativePath(relativePath)}`
}

function buildSkillConfigFromFiles(slug: string, skillFiles: Record<string, string>): SkillConfig {
  const skillContent = skillFiles['SKILL.md']
  if (typeof skillContent !== 'string') {
    throw new Error(`Skill "${slug}" is missing SKILL.md`)
  }

  const frontmatter = parseSkillFrontmatter(skillContent)
  const extraFiles = Object.fromEntries(
    Object.entries(skillFiles).filter(([relativePath]) => relativePath !== 'SKILL.md')
  )

  return {
    slug: normalizeSkillSlug(slug),
    name: frontmatter.name || slug,
    description: frontmatter.description || '',
    content: skillContent,
    files: Object.keys(extraFiles).length > 0 ? extraFiles : undefined,
  }
}

export function parseAppSkillFile(skillPath: string, files: Record<string, string>): SkillConfig | null {
  const slug = extractSkillSlug(skillPath)
  if (!slug) {
    return null
  }

  const skillRoot = `skills/${slug}/`
  const skillFiles = Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => path.startsWith(skillRoot))
      .map(([path, content]) => [path.slice(skillRoot.length), content])
  )

  if (!skillFiles['SKILL.md'] && typeof files[skillPath] === 'string') {
    skillFiles['SKILL.md'] = files[skillPath]
  }

  return buildSkillConfigFromFiles(slug, skillFiles)
}

function parseRemoteSkillDefinitions(content: string): RemoteSkillDefinition[] {
  const parsed = JSON.parse(content) as unknown

  if (Array.isArray(parsed)) {
    return parsed as RemoteSkillDefinition[]
  }

  if (
    parsed
    && typeof parsed === 'object'
    && Array.isArray((parsed as { skills?: unknown }).skills)
  ) {
    return (parsed as { skills: RemoteSkillDefinition[] }).skills
  }

  throw new Error('skills/remote.json must be an array or an object with a "skills" array')
}

function resolveRemoteUrl(rawUrl: string): URL {
  const baseUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost/'
  return new URL(rawUrl, baseUrl)
}

function inferRemoteSkillSlug(entry: RemoteSkillDefinition): string {
  if (typeof entry.slug === 'string' && entry.slug.trim()) {
    return normalizeSkillSlug(entry.slug)
  }

  if (typeof entry.url === 'string' && entry.url.trim()) {
    const url = resolveRemoteUrl(entry.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]
    const parentSegment = pathSegments[pathSegments.length - 2]
    if (lastSegment === 'SKILL.md' && parentSegment) {
      return normalizeSkillSlug(parentSegment)
    }
  }

  throw new Error('Remote skill entry must provide a valid "slug" or a "url" ending with /<slug>/SKILL.md')
}

async function fetchRemoteTextFile(url: string): Promise<string> {
  const response = await fetch(resolveRemoteUrl(url).toString())
  if (!response.ok) {
    throw new Error(`Failed to download remote skill file: ${url} (${response.status} ${response.statusText})`)
  }
  return await response.text()
}

export async function loadRemoteAppSkills(files: Record<string, string>): Promise<SkillConfig[]> {
  const configContent = files[REMOTE_SKILLS_CONFIG_PATH]
  if (!configContent) {
    return []
  }

  const entries = parseRemoteSkillDefinitions(configContent)
  const skills: SkillConfig[] = []

  for (const entry of entries) {
    const slug = inferRemoteSkillSlug(entry)
    const skillFiles: Record<string, string> = {}

    if (typeof entry.url === 'string' && entry.url.trim()) {
      skillFiles['SKILL.md'] = await fetchRemoteTextFile(entry.url)
    }

    if (entry.files && typeof entry.files === 'object') {
      for (const [relativePath, fileUrl] of Object.entries(entry.files)) {
        if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
          throw new Error(`Remote skill "${slug}" has an invalid URL for file "${relativePath}"`)
        }
        skillFiles[normalizeSkillRelativePath(relativePath)] = await fetchRemoteTextFile(fileUrl)
      }
    }

    skills.push(buildSkillConfigFromFiles(slug, skillFiles))
  }

  return skills
}
