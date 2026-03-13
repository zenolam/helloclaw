declare const HelloClawApp: any

type TabId = 'overview' | 'pipeline' | 'publish' | 'analytics' | 'reports'

type AppSettings = {
  operatorName: string
  brandName: string
  primaryGoal: string
  voice: string
  defaultPlatforms: string[]
  reportTz: string
  lastOpenedTab: TabId
}

type PublishTask = {
  id: string
  platform: string
  status: 'draft' | 'ready' | 'queued' | 'published' | 'failed'
  scheduledAt: string
  caption: string
  url: string
  publishedAt: string
  lastAttemptAt: string
}

type ContentMetrics = {
  impressions: number
  reads: number
  interactions: number
  saves: number
  shares: number
  leads: number
  conversions: number
  revenue: number
  followersGained: number
}

type ContentItem = {
  id: string
  title: string
  format: string
  stage: string
  pillar: string
  objective: string
  audience: string
  angle: string
  hook: string
  cta: string
  keywords: string[]
  targetPlatforms: string[]
  dueDate: string
  scheduledAt: string
  outline: string
  body: string
  notes: string
  publishTasks: PublishTask[]
  metrics: ContentMetrics
  createdAt: number
  updatedAt: number
}

type AnalyticsSnapshot = {
  id: string
  date: string
  platform: string
  contentId: string
  impressions: number
  reads: number
  interactions: number
  saves: number
  shares: number
  leads: number
  conversions: number
  revenue: number
  followersGained: number
  notes: string
  createdAt: number
}

type ReportRecord = {
  id: string
  type: string
  title: string
  date: string
  source: string
  relatedContentId: string
  createdAt: number
  content: string
}

type PendingCapture = {
  marker: string
  type: string
  title: string
  relatedContentId: string
}

type PublishQueueItem = PublishTask & {
  contentId: string
  title: string
  stage: string
  format: string
  objective: string
  hook: string
  cta: string
  body: string
  dueDate: string
}

const PLATFORM_OPTIONS = [
  { id: 'wechat', label: '微信公众号', hint: '深度长文 / 品牌沉淀' },
  { id: 'xiaohongshu', label: '小红书', hint: '口语化种草 / 收藏导向' },
  { id: 'zhihu', label: '知乎', hint: '问题导向 / 案例论证' },
  { id: 'weibo', label: '微博', hint: '短观点 / 热点跟进' },
  { id: 'douyin', label: '抖音脚本', hint: '口播节奏 / 镜头拆解' },
  { id: 'newsletter', label: 'Newsletter', hint: '私域沉淀 / 转化跟进' },
] as const

const CONTENT_FORMATS = [
  { value: 'article', label: '长文' },
  { value: 'thread', label: '短帖串' },
  { value: 'video-script', label: '视频脚本' },
  { value: 'newsletter', label: '邮件通讯' },
  { value: 'campaign', label: '营销专题' },
] as const

const CONTENT_STAGES = [
  { value: 'idea', label: '选题池' },
  { value: 'planning', label: '策划中' },
  { value: 'drafting', label: '创作中' },
  { value: 'review', label: '待审校' },
  { value: 'ready', label: '待发布' },
  { value: 'scheduled', label: '已排期' },
  { value: 'published', label: '已发布' },
] as const

const OBJECTIVES = [
  { value: 'growth', label: '增长拉新' },
  { value: 'trust', label: '建立信任' },
  { value: 'conversion', label: '转化成交' },
  { value: 'community', label: '社群运营' },
] as const

const REPORT_TYPES: Record<string, string> = {
  'daily-brief': '日报',
  'weekly-review': '周复盘',
  'experiment-plan': '实验计划',
  'content-brief': '内容 Brief',
  'repurpose-pack': '改写包',
  'publish-package': '发布包',
  'manual-note': '运营笔记',
}

const STORAGE_PATHS = {
  settings: 'meta/settings.json',
  contents: 'content',
  analytics: 'analytics',
  reports: 'reports',
} as const

function createDefaultSettings(): AppSettings {
  return {
    operatorName: '',
    brandName: '内容增长工作台',
    primaryGoal: '稳定产出高质量内容，并持续提升分发效率与转化',
    voice: '专业、真诚、带观点',
    defaultPlatforms: ['wechat', 'xiaohongshu', 'zhihu'],
    reportTz: 'Asia/Shanghai',
    lastOpenedTab: 'overview',
  }
}

function emptyMetrics(): ContentMetrics {
  return {
    impressions: 0,
    reads: 0,
    interactions: 0,
    saves: 0,
    shares: 0,
    leads: 0,
    conversions: 0,
    revenue: 0,
    followersGained: 0,
  }
}

function uid(prefix: string): string {
  const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${randomPart}`
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function nowTimestamp(): number {
  return Date.now()
}

function asNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function clipText(value: string, max = 180): string {
  if (!value) {
    return ''
  }
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function platformLabel(platformId: string): string {
  return PLATFORM_OPTIONS.find((item) => item.id === platformId)?.label || platformId
}

function formatLabel(value: string, options: ReadonlyArray<{ value: string; label: string }>): string {
  return options.find((item) => item.value === value)?.label || value
}

function formatShortDate(value: string | number): string {
  if (!value) {
    return '未设置'
  }
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatDateTime(value: string): string {
  if (!value) {
    return '未排期'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toDateTimeLocalValue(value: string): string {
  if (!value) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function toneClassForStage(stage: string): string {
  if (stage === 'published') return 'tone-success'
  if (stage === 'ready' || stage === 'scheduled') return 'tone-accent'
  if (stage === 'review') return 'tone-warn'
  return 'tone-muted'
}

function toneClassForPublishStatus(status: string): string {
  if (status === 'published') return 'tone-success'
  if (status === 'queued' || status === 'ready') return 'tone-accent'
  if (status === 'failed') return 'tone-danger'
  return 'tone-muted'
}

function metricValue(sum: number): string {
  if (Math.abs(sum) >= 1000000) {
    return `${(sum / 1000000).toFixed(1)}M`
  }
  if (Math.abs(sum) >= 1000) {
    return `${(sum / 1000).toFixed(1)}K`
  }
  return String(Math.round(sum))
}

function isOverdue(dueDate: string, stage: string): boolean {
  return Boolean(dueDate) && dueDate < todayIsoDate() && stage !== 'published'
}

function buildDefaultCaption(content: ContentItem, platform: string): string {
  const hook = content.hook || content.angle || content.title
  return `${hook}\n\n${content.cta || '欢迎在评论区交流你的看法。'}\n#${platformLabel(platform)}`
}

class SocialMediaOpsApp extends HelloClawApp {
  state = {
    initialized: false,
    activeTab: 'overview' as TabId,
    contentStageFilter: 'all',
    contentPlatformFilter: 'all',
    publishStatusFilter: 'all',
    publishPlatformFilter: 'all',
    selectedContentId: '',
    selectedReportId: '',
    settings: createDefaultSettings(),
    contents: [] as ContentItem[],
    analytics: [] as AnalyticsSnapshot[],
    reports: [] as ReportRecord[],
  }

  root: HTMLElement | null = null
  rootEventsBound = false
  disposers: Array<() => void> = []
  pendingCaptures: PendingCapture[] = []

  async onload(): Promise<void> {
    await this.reloadAllData()
    this.registerCommands()

    const unsubscribeChat = this.helloclaw.chat.onMessage((message: any) => {
      void this.handleChatMessage(message)
    })
    this.disposers.push(unsubscribeChat)

    this.helloclaw.ui.createView({
      id: this.viewId(),
      render: (container: HTMLElement) => {
        this.root = container
        this.ensureRootEvents()
        this.render()
      },
      destroy: () => {
        this.teardownRootEvents()
        this.root = null
      },
    })

    this.updateSidebarBadge()
    this.helloclaw.ui.showNotice('内容增长工作台已就绪', 'success')
  }

  onunload(): void {
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
    this.teardownRootEvents()
    this.pendingCaptures = []
  }

  onSettingsRender(container: HTMLElement): void {
    const settings = this.state.settings
    container.innerHTML = `
      <div class="hc-sm-settings">
        <div class="hc-sm-settings__header">
          <p class="hc-sm-eyebrow">Workspace Settings</p>
          <h2>内容增长工作台设置</h2>
          <p>配置你的品牌信息、默认平台和复盘时区，影响新建内容与 AI 协作提示词。</p>
        </div>
        <div class="hc-sm-settings__grid">
          <label>
            <span>操作者名称</span>
            <input id="hc-settings-operator" value="${escapeHtml(settings.operatorName)}" placeholder="例如：Mina" />
          </label>
          <label>
            <span>品牌 / 账号名称</span>
            <input id="hc-settings-brand" value="${escapeHtml(settings.brandName)}" placeholder="例如：增长实验室" />
          </label>
          <label>
            <span>主要目标</span>
            <input id="hc-settings-goal" value="${escapeHtml(settings.primaryGoal)}" placeholder="例如：提升高质量线索与复购" />
          </label>
          <label>
            <span>内容语气</span>
            <input id="hc-settings-voice" value="${escapeHtml(settings.voice)}" placeholder="例如：专业、克制、可信" />
          </label>
          <label>
            <span>复盘时区</span>
            <input id="hc-settings-tz" value="${escapeHtml(settings.reportTz)}" placeholder="Asia/Shanghai" />
          </label>
          <div class="hc-sm-settings__platforms">
            <span>默认发布平台</span>
            <div class="hc-sm-checklist">
              ${PLATFORM_OPTIONS.map((platform) => `
                <label class="hc-sm-check">
                  <input
                    type="checkbox"
                    data-settings-platform
                    value="${platform.id}"
                    ${settings.defaultPlatforms.includes(platform.id) ? 'checked' : ''}
                  />
                  <strong>${platform.label}</strong>
                  <small>${platform.hint}</small>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="hc-sm-settings__actions">
          <button class="hc-btn hc-btn--primary" id="hc-settings-save">保存设置</button>
        </div>
      </div>
    `

    container.querySelector<HTMLButtonElement>('#hc-settings-save')?.addEventListener('click', () => {
      void this.saveSettingsFromPanel(container)
    })
  }

  viewId(): string {
    return `${this.helloclaw.appId}-main`
  }

  ensureRootEvents(): void {
    if (!this.root || this.rootEventsBound) {
      return
    }
    this.root.addEventListener('click', this.handleRootClick)
    this.root.addEventListener('change', this.handleRootChange)
    this.rootEventsBound = true
  }

  teardownRootEvents(): void {
    if (!this.root || !this.rootEventsBound) {
      return
    }
    this.root.removeEventListener('click', this.handleRootClick)
    this.root.removeEventListener('change', this.handleRootChange)
    this.rootEventsBound = false
  }

  handleRootClick = (event: Event): void => {
    void this.onRootClick(event)
  }

  handleRootChange = (event: Event): void => {
    void this.onRootChange(event)
  }

  async onRootClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement | null
    if (!target) {
      return
    }

    const actionable = target.closest<HTMLElement>('[data-action]')
    if (!actionable) {
      return
    }

    const action = actionable.dataset.action
    if (!action) {
      return
    }

    if (action === 'switch-tab') {
      const nextTab = (actionable.dataset.tab || 'overview') as TabId
      this.state.activeTab = nextTab
      this.state.settings.lastOpenedTab = nextTab
      await this.persistSettings()
      this.render()
      return
    }

    if (action === 'refresh-data') {
      await this.reloadAllData()
      this.render()
      this.helloclaw.ui.showNotice('已重新加载内容、数据和报告', 'success')
      return
    }

    if (action === 'new-content') {
      await this.createContent()
      return
    }

    if (action === 'select-content') {
      this.state.selectedContentId = actionable.dataset.contentId || ''
      this.render()
      return
    }

    if (action === 'save-content') {
      await this.saveSelectedContentFromForm()
      return
    }

    if (action === 'delete-content') {
      await this.deleteContent(actionable.dataset.contentId || this.state.selectedContentId)
      return
    }

    if (action === 'set-publish-status') {
      await this.updatePublishStatus(
        actionable.dataset.contentId || '',
        actionable.dataset.platform || '',
        actionable.dataset.status || '',
      )
      return
    }

    if (action === 'edit-publish-meta') {
      await this.editPublishMeta(
        actionable.dataset.contentId || '',
        actionable.dataset.platform || '',
      )
      return
    }

    if (action === 'run-ai') {
      await this.runAiAction(
        actionable.dataset.ai || '',
        actionable.dataset.contentId || '',
        actionable.dataset.platform || '',
      )
      return
    }

    if (action === 'save-snapshot') {
      await this.saveAnalyticsSnapshotFromForm()
      return
    }

    if (action === 'delete-snapshot') {
      await this.deleteSnapshot(actionable.dataset.snapshotId || '')
      return
    }

    if (action === 'select-report') {
      this.state.selectedReportId = actionable.dataset.reportId || ''
      this.render()
      return
    }

    if (action === 'save-manual-report') {
      await this.saveManualReportFromForm()
      return
    }

    if (action === 'delete-report') {
      await this.deleteReport(actionable.dataset.reportId || this.state.selectedReportId)
    }
  }

  async onRootChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null
    if (!target) {
      return
    }

    const filter = target.dataset.filter
    if (!filter) {
      return
    }

    if (filter === 'content-stage') {
      this.state.contentStageFilter = target.value
    }
    if (filter === 'content-platform') {
      this.state.contentPlatformFilter = target.value
    }
    if (filter === 'publish-status') {
      this.state.publishStatusFilter = target.value
    }
    if (filter === 'publish-platform') {
      this.state.publishPlatformFilter = target.value
    }

    this.render()
  }

  async saveSettingsFromPanel(container: HTMLElement): Promise<void> {
    const operatorName = asString(container.querySelector<HTMLInputElement>('#hc-settings-operator')?.value)
    const brandName = asString(container.querySelector<HTMLInputElement>('#hc-settings-brand')?.value, '内容增长工作台')
    const primaryGoal = asString(container.querySelector<HTMLInputElement>('#hc-settings-goal')?.value)
    const voice = asString(container.querySelector<HTMLInputElement>('#hc-settings-voice')?.value)
    const reportTz = asString(container.querySelector<HTMLInputElement>('#hc-settings-tz')?.value, 'Asia/Shanghai')
    const defaultPlatforms = Array.from(container.querySelectorAll<HTMLInputElement>('[data-settings-platform]:checked'))
      .map((input) => input.value)

    this.state.settings = {
      ...this.state.settings,
      operatorName,
      brandName,
      primaryGoal,
      voice,
      reportTz,
      defaultPlatforms: defaultPlatforms.length > 0 ? defaultPlatforms : ['wechat', 'xiaohongshu'],
    }

    await this.persistSettings()
    this.render()
    this.helloclaw.ui.showNotice('工作台设置已保存', 'success')
  }

  async reloadAllData(): Promise<void> {
    const [settings, contents, analytics, reports] = await Promise.all([
      this.readJson<AppSettings>(STORAGE_PATHS.settings, createDefaultSettings()),
      this.loadCollection<ContentItem>(STORAGE_PATHS.contents),
      this.loadCollection<AnalyticsSnapshot>(STORAGE_PATHS.analytics),
      this.loadCollection<ReportRecord>(STORAGE_PATHS.reports),
    ])

    const normalizedContents = contents
      .map((item) => this.hydrateContent(item))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const normalizedAnalytics = analytics
      .map((item) => this.hydrateAnalytics(item))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    const normalizedReports = reports
      .map((item) => this.hydrateReport(item))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

    const initialTab = this.normalizeTab(settings.lastOpenedTab)
    const selectedContentId = normalizedContents.some((item) => item.id === this.state.selectedContentId)
      ? this.state.selectedContentId
      : normalizedContents[0]?.id || ''
    const selectedReportId = normalizedReports.some((item) => item.id === this.state.selectedReportId)
      ? this.state.selectedReportId
      : normalizedReports[0]?.id || ''

    this.state = {
      ...this.state,
      initialized: true,
      activeTab: this.state.initialized ? this.state.activeTab : initialTab,
      settings: {
        ...createDefaultSettings(),
        ...settings,
        lastOpenedTab: initialTab,
      },
      contents: normalizedContents,
      analytics: normalizedAnalytics,
      reports: normalizedReports,
      selectedContentId,
      selectedReportId,
    }
  }

  normalizeTab(value: string): TabId {
    if (value === 'pipeline' || value === 'publish' || value === 'analytics' || value === 'reports') {
      return value
    }
    return 'overview'
  }

  hydrateContent(raw: Partial<ContentItem>): ContentItem {
    const targetPlatforms = uniqueStrings(asStringArray(raw.targetPlatforms))
    const scheduledAt = asString(raw.scheduledAt)
    const tasks = this.syncPublishTasks(raw.publishTasks, targetPlatforms, scheduledAt)

    return {
      id: asString(raw.id, uid('content')),
      title: asString(raw.title, '未命名内容'),
      format: asString(raw.format, 'article'),
      stage: asString(raw.stage, 'idea'),
      pillar: asString(raw.pillar),
      objective: asString(raw.objective, 'growth'),
      audience: asString(raw.audience),
      angle: asString(raw.angle),
      hook: asString(raw.hook),
      cta: asString(raw.cta),
      keywords: asStringArray(raw.keywords),
      targetPlatforms,
      dueDate: asString(raw.dueDate),
      scheduledAt,
      outline: asString(raw.outline),
      body: asString(raw.body),
      notes: asString(raw.notes),
      publishTasks: tasks,
      metrics: {
        ...emptyMetrics(),
        ...(raw.metrics || {}),
      },
      createdAt: asNumber(raw.createdAt) || nowTimestamp(),
      updatedAt: asNumber(raw.updatedAt) || nowTimestamp(),
    }
  }

  hydrateAnalytics(raw: Partial<AnalyticsSnapshot>): AnalyticsSnapshot {
    return {
      id: asString(raw.id, uid('snapshot')),
      date: asString(raw.date, todayIsoDate()),
      platform: asString(raw.platform, 'wechat'),
      contentId: asString(raw.contentId),
      impressions: asNumber(raw.impressions),
      reads: asNumber(raw.reads),
      interactions: asNumber(raw.interactions),
      saves: asNumber(raw.saves),
      shares: asNumber(raw.shares),
      leads: asNumber(raw.leads),
      conversions: asNumber(raw.conversions),
      revenue: asNumber(raw.revenue),
      followersGained: asNumber(raw.followersGained),
      notes: asString(raw.notes),
      createdAt: asNumber(raw.createdAt) || nowTimestamp(),
    }
  }

  hydrateReport(raw: Partial<ReportRecord>): ReportRecord {
    return {
      id: asString(raw.id, uid('report')),
      type: asString(raw.type, 'manual-note'),
      title: asString(raw.title, '未命名报告'),
      date: asString(raw.date, todayIsoDate()),
      source: asString(raw.source, 'manual'),
      relatedContentId: asString(raw.relatedContentId),
      createdAt: asNumber(raw.createdAt) || nowTimestamp(),
      content: asString(raw.content),
    }
  }

  syncPublishTasks(existing: unknown, platforms: string[], scheduledAt: string): PublishTask[] {
    const taskMap = new Map<string, PublishTask>()

    if (Array.isArray(existing)) {
      existing.forEach((rawTask) => {
        if (!rawTask || typeof rawTask !== 'object') {
          return
        }
        const task = rawTask as Partial<PublishTask>
        const platform = asString(task.platform)
        if (!platform) {
          return
        }
        taskMap.set(platform, {
          id: asString(task.id, uid(`publish-${platform}`)),
          platform,
          status: ['ready', 'queued', 'published', 'failed'].includes(asString(task.status))
            ? (task.status as PublishTask['status'])
            : 'draft',
          scheduledAt: asString(task.scheduledAt, scheduledAt),
          caption: asString(task.caption),
          url: asString(task.url),
          publishedAt: asString(task.publishedAt),
          lastAttemptAt: asString(task.lastAttemptAt),
        })
      })
    }

    return platforms.map((platform) => {
      const existingTask = taskMap.get(platform)
      if (existingTask) {
        return {
          ...existingTask,
          scheduledAt: existingTask.scheduledAt || scheduledAt,
        }
      }
      return {
        id: uid(`publish-${platform}`),
        platform,
        status: 'draft',
        scheduledAt,
        caption: '',
        url: '',
        publishedAt: '',
        lastAttemptAt: '',
      }
    })
  }

  async listSafe(dir: string): Promise<Array<{ path: string; isDirectory?: boolean }>> {
    try {
      return await this.helloclaw.storage.list(dir)
    } catch {
      return []
    }
  }

  async loadCollection<T>(dir: string): Promise<T[]> {
    const entries = await this.listSafe(dir)
    const items: T[] = []

    for (const entry of entries) {
      if (entry.isDirectory || !entry.path.endsWith('.json')) {
        continue
      }
      try {
        const content = await this.helloclaw.storage.read(`${dir}/${entry.path}`)
        items.push(JSON.parse(content) as T)
      } catch {
        // Skip malformed data and keep the rest of the workspace usable.
      }
    }

    return items
  }

  async readJson<T>(path: string, fallback: T): Promise<T> {
    try {
      const content = await this.helloclaw.storage.read(path)
      return JSON.parse(content) as T
    } catch {
      return fallback
    }
  }

  async writeJson(path: string, value: unknown): Promise<void> {
    await this.helloclaw.storage.write(path, JSON.stringify(value, null, 2))
  }

  async persistSettings(): Promise<void> {
    await this.writeJson(STORAGE_PATHS.settings, this.state.settings)
  }

  async persistContent(content: ContentItem): Promise<void> {
    await this.writeJson(`${STORAGE_PATHS.contents}/${content.id}.json`, content)
  }

  async persistSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
    await this.writeJson(`${STORAGE_PATHS.analytics}/${snapshot.id}.json`, snapshot)
  }

  async persistReport(report: ReportRecord): Promise<void> {
    await this.writeJson(`${STORAGE_PATHS.reports}/${report.id}.json`, report)
  }

  async createContent(): Promise<void> {
    const now = nowTimestamp()
    const platforms = this.state.settings.defaultPlatforms.length > 0
      ? this.state.settings.defaultPlatforms
      : ['wechat', 'xiaohongshu']
    const content = this.hydrateContent({
      id: uid('content'),
      title: '新的内容卡',
      format: 'article',
      stage: 'idea',
      objective: 'growth',
      targetPlatforms: platforms,
      publishTasks: platforms.map((platform) => ({
        id: uid(`publish-${platform}`),
        platform,
        status: 'draft',
        scheduledAt: '',
        caption: '',
        url: '',
        publishedAt: '',
        lastAttemptAt: '',
      })),
      createdAt: now,
      updatedAt: now,
    })

    await this.persistContent(content)
    await this.reloadAllData()
    this.state.selectedContentId = content.id
    this.state.activeTab = 'pipeline'
    this.render()
    this.helloclaw.ui.showNotice('已创建新的内容卡', 'success')
  }

  getSelectedContent(): ContentItem | null {
    return this.state.contents.find((item) => item.id === this.state.selectedContentId) || null
  }

  getSelectedReport(): ReportRecord | null {
    return this.state.reports.find((item) => item.id === this.state.selectedReportId) || null
  }

  getFilteredContents(): ContentItem[] {
    return this.state.contents.filter((item) => {
      const stageMatch = this.state.contentStageFilter === 'all' || item.stage === this.state.contentStageFilter
      const platformMatch = this.state.contentPlatformFilter === 'all' || item.targetPlatforms.includes(this.state.contentPlatformFilter)
      return stageMatch && platformMatch
    })
  }

  getPublishQueue(): PublishQueueItem[] {
    const tasks = this.state.contents.flatMap((content) => {
      return content.publishTasks.map((task) => ({
        ...task,
        contentId: content.id,
        title: content.title,
        stage: content.stage,
        format: content.format,
        objective: content.objective,
        hook: content.hook,
        cta: content.cta,
        body: content.body,
        dueDate: content.dueDate,
      }))
    })

    return tasks
      .filter((task) => {
        const statusMatch = this.state.publishStatusFilter === 'all' || task.status === this.state.publishStatusFilter
        const platformMatch = this.state.publishPlatformFilter === 'all' || task.platform === this.state.publishPlatformFilter
        return statusMatch && platformMatch
      })
      .sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
        return bTime - aTime
      })
  }

  getOverviewStats(): Array<{ label: string; value: string; note: string }> {
    const recentSnapshots = this.state.analytics.filter((item) => {
      const delta = nowTimestamp() - new Date(item.date).getTime()
      return delta <= 1000 * 60 * 60 * 24 * 30
    })

    const publishedCount = this.state.contents.filter((item) => item.stage === 'published').length
    const readyCount = this.state.contents.filter((item) => item.stage === 'ready' || item.stage === 'scheduled').length
    const overdueCount = this.state.contents.filter((item) => isOverdue(item.dueDate, item.stage)).length
    const totalImpressions = recentSnapshots.reduce((sum, item) => sum + item.impressions, 0)
    const totalLeads = recentSnapshots.reduce((sum, item) => sum + item.leads, 0)

    return [
      {
        label: '内容资产',
        value: String(this.state.contents.length),
        note: `${publishedCount} 条已发布，${readyCount} 条在排期内`,
      },
      {
        label: '近 30 天曝光',
        value: metricValue(totalImpressions),
        note: `${recentSnapshots.length} 条数据快照`,
      },
      {
        label: '线索 / 转化',
        value: metricValue(totalLeads),
        note: `${this.state.analytics.reduce((sum, item) => sum + item.conversions, 0)} 次转化记录`,
      },
      {
        label: '风险项',
        value: String(overdueCount),
        note: overdueCount > 0 ? '存在逾期未发布内容' : '当前没有逾期内容',
      },
    ]
  }

  getPlatformSummary(): Array<{ platform: string; impressions: number; interactions: number; leads: number }> {
    const map = new Map<string, { impressions: number; interactions: number; leads: number }>()
    this.state.analytics.forEach((item) => {
      const current = map.get(item.platform) || { impressions: 0, interactions: 0, leads: 0 }
      current.impressions += item.impressions
      current.interactions += item.interactions
      current.leads += item.leads
      map.set(item.platform, current)
    })

    return Array.from(map.entries())
      .map(([platform, summary]) => ({
        platform,
        impressions: summary.impressions,
        interactions: summary.interactions,
        leads: summary.leads,
      }))
      .sort((a, b) => b.impressions - a.impressions)
  }

  getUrgentPublishCount(): number {
    return this.state.contents
      .flatMap((item) => item.publishTasks.map((task) => ({ task, item })))
      .filter(({ task, item }) => {
        if (task.status === 'published') {
          return false
        }
        if (item.stage === 'ready' || item.stage === 'scheduled') {
          return true
        }
        return isOverdue(item.dueDate, item.stage)
      }).length
  }

  updateSidebarBadge(): void {
    this.helloclaw.ui.setSidebarBadge(this.getUrgentPublishCount())
  }

  async saveSelectedContentFromForm(): Promise<void> {
    const content = this.getSelectedContent()
    if (!content || !this.root) {
      return
    }

    const title = asString(this.root.querySelector<HTMLInputElement>('#hc-content-title')?.value, '未命名内容')
    const format = asString(this.root.querySelector<HTMLSelectElement>('#hc-content-format')?.value, 'article')
    const stage = asString(this.root.querySelector<HTMLSelectElement>('#hc-content-stage')?.value, 'idea')
    const objective = asString(this.root.querySelector<HTMLSelectElement>('#hc-content-objective')?.value, 'growth')
    const pillar = asString(this.root.querySelector<HTMLInputElement>('#hc-content-pillar')?.value)
    const audience = asString(this.root.querySelector<HTMLInputElement>('#hc-content-audience')?.value)
    const angle = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-content-angle')?.value)
    const hook = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-content-hook')?.value)
    const cta = asString(this.root.querySelector<HTMLInputElement>('#hc-content-cta')?.value)
    const dueDate = asString(this.root.querySelector<HTMLInputElement>('#hc-content-due-date')?.value)
    const scheduledAt = asString(this.root.querySelector<HTMLInputElement>('#hc-content-scheduled-at')?.value)
    const keywords = uniqueStrings(
      asString(this.root.querySelector<HTMLInputElement>('#hc-content-keywords')?.value)
        .split(',')
        .map((item) => item.trim()),
    )
    const targetPlatforms = uniqueStrings(
      Array.from(this.root.querySelectorAll<HTMLInputElement>('input[data-platform-checkbox]:checked'))
        .map((input) => input.value),
    )
    const outline = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-content-outline')?.value)
    const body = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-content-body')?.value)
    const notes = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-content-notes')?.value)

    const publishTasks = this.syncPublishTasks(content.publishTasks, targetPlatforms, scheduledAt).map((task) => ({
      ...task,
      caption: task.caption || buildDefaultCaption(content, task.platform),
      status: stage === 'ready' && task.status === 'draft' ? 'ready' : task.status,
    }))

    const nextContent: ContentItem = {
      ...content,
      title,
      format,
      stage,
      objective,
      pillar,
      audience,
      angle,
      hook,
      cta,
      dueDate,
      scheduledAt,
      keywords,
      targetPlatforms,
      outline,
      body,
      notes,
      publishTasks,
      updatedAt: nowTimestamp(),
    }

    await this.persistContent(nextContent)
    await this.reloadAllData()
    this.state.selectedContentId = nextContent.id
    this.updateSidebarBadge()
    this.render()
    this.helloclaw.ui.showNotice('内容卡已保存', 'success')
  }

  async deleteContent(contentId: string): Promise<void> {
    if (!contentId) {
      return
    }
    if (typeof window !== 'undefined' && !window.confirm('确定删除这条内容卡吗？相关发布计划不会自动恢复。')) {
      return
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.contents}/${contentId}.json`)
    await this.reloadAllData()
    this.updateSidebarBadge()
    this.render()
    this.helloclaw.ui.showNotice('内容卡已删除', 'success')
  }

  async updatePublishStatus(contentId: string, platform: string, status: string): Promise<void> {
    const content = this.state.contents.find((item) => item.id === contentId)
    if (!content) {
      return
    }

    const nextTasks = content.publishTasks.map((task) => {
      if (task.platform !== platform) {
        return task
      }
      return {
        ...task,
        status: ['draft', 'ready', 'queued', 'published', 'failed'].includes(status)
          ? (status as PublishTask['status'])
          : task.status,
        publishedAt: status === 'published' ? new Date().toISOString() : task.publishedAt,
        lastAttemptAt: new Date().toISOString(),
      }
    })

    const publishedAll = nextTasks.length > 0 && nextTasks.every((task) => task.status === 'published')
    const nextStage = publishedAll
      ? 'published'
      : status === 'queued'
        ? 'scheduled'
        : content.stage

    const nextContent: ContentItem = {
      ...content,
      stage: nextStage,
      publishTasks: nextTasks,
      updatedAt: nowTimestamp(),
    }

    await this.persistContent(nextContent)
    await this.reloadAllData()
    this.updateSidebarBadge()
    this.render()
    this.helloclaw.ui.showNotice(`已更新 ${platformLabel(platform)} 发布状态`, 'success')
  }

  async editPublishMeta(contentId: string, platform: string): Promise<void> {
    const content = this.state.contents.find((item) => item.id === contentId)
    const task = content?.publishTasks.find((item) => item.platform === platform)
    if (!content || !task) {
      return
    }

    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      this.helloclaw.ui.showNotice('当前环境不支持编辑发布文案', 'warning')
      return
    }

    const nextCaption = window.prompt('编辑该平台的发布文案', task.caption || buildDefaultCaption(content, platform))
    if (nextCaption === null) {
      return
    }
    const nextUrl = window.prompt('如已发布，可填写发布链接。留空表示暂不设置。', task.url || '') ?? task.url

    const nextTasks = content.publishTasks.map((item) => {
      if (item.platform !== platform) {
        return item
      }
      return {
        ...item,
        caption: nextCaption.trim(),
        url: nextUrl.trim(),
      }
    })

    const nextContent: ContentItem = {
      ...content,
      publishTasks: nextTasks,
      updatedAt: nowTimestamp(),
    }

    await this.persistContent(nextContent)
    await this.reloadAllData()
    this.render()
    this.helloclaw.ui.showNotice(`${platformLabel(platform)} 发布文案已更新`, 'success')
  }

  async saveAnalyticsSnapshotFromForm(): Promise<void> {
    if (!this.root) {
      return
    }

    const snapshot = this.hydrateAnalytics({
      id: uid('snapshot'),
      date: asString(this.root.querySelector<HTMLInputElement>('#hc-analytics-date')?.value, todayIsoDate()),
      platform: asString(this.root.querySelector<HTMLSelectElement>('#hc-analytics-platform')?.value, 'wechat'),
      contentId: asString(this.root.querySelector<HTMLSelectElement>('#hc-analytics-content')?.value),
      impressions: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-impressions')?.value),
      reads: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-reads')?.value),
      interactions: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-interactions')?.value),
      saves: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-saves')?.value),
      shares: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-shares')?.value),
      leads: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-leads')?.value),
      conversions: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-conversions')?.value),
      revenue: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-revenue')?.value),
      followersGained: asNumber(this.root.querySelector<HTMLInputElement>('#hc-analytics-followers')?.value),
      notes: asString(this.root.querySelector<HTMLTextAreaElement>('#hc-analytics-notes')?.value),
      createdAt: nowTimestamp(),
    })

    await this.persistSnapshot(snapshot)
    await this.reloadAllData()
    this.render()
    this.helloclaw.ui.showNotice('运营数据快照已记录', 'success')
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    if (!snapshotId) {
      return
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.analytics}/${snapshotId}.json`)
    await this.reloadAllData()
    this.render()
    this.helloclaw.ui.showNotice('已删除数据快照', 'success')
  }

  async saveManualReportFromForm(): Promise<void> {
    if (!this.root) {
      return
    }

    const title = asString(this.root.querySelector<HTMLInputElement>('#hc-report-title')?.value, '运营笔记')
    const content = asString(this.root.querySelector<HTMLTextAreaElement>('#hc-report-body')?.value)

    if (!content.trim()) {
      this.helloclaw.ui.showNotice('运营笔记内容不能为空', 'warning')
      return
    }

    const report = this.hydrateReport({
      id: uid('report'),
      type: 'manual-note',
      title,
      date: todayIsoDate(),
      source: 'manual',
      relatedContentId: this.state.selectedContentId,
      createdAt: nowTimestamp(),
      content,
    })

    await this.persistReport(report)
    await this.reloadAllData()
    this.state.selectedReportId = report.id
    this.render()
    this.helloclaw.ui.showNotice('运营笔记已保存', 'success')
  }

  async deleteReport(reportId: string): Promise<void> {
    if (!reportId) {
      return
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.reports}/${reportId}.json`)
    await this.reloadAllData()
    this.render()
    this.helloclaw.ui.showNotice('报告已删除', 'success')
  }

  registerCommands(): void {
    const commandSpecs = [
      {
        id: 'open-dashboard',
        name: '打开内容增长工作台',
        callback: async () => {
          this.state.activeTab = 'overview'
          this.state.settings.lastOpenedTab = 'overview'
          await this.persistSettings()
          this.helloclaw.workspace.openView(this.viewId())
          this.render()
        },
      },
      {
        id: 'new-content-card',
        name: '新建内容卡',
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId())
          await this.createContent()
        },
      },
      {
        id: 'daily-brief',
        name: '生成运营日报',
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId())
          await this.runAiAction('daily-brief')
        },
      },
      {
        id: 'weekly-review',
        name: '生成增长周复盘',
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId())
          await this.runAiAction('weekly-review')
        },
      },
    ]

    commandSpecs.forEach((command) => {
      const dispose = this.helloclaw.workspace.registerCommand({
        id: `${this.helloclaw.appId}:${command.id}`,
        name: command.name,
        callback: command.callback,
      })
      this.disposers.push(dispose)
    })
  }

  buildWorkspaceDigest(): string {
    const urgent = this.getUrgentPublishCount()
    const topPlatforms = this.getPlatformSummary().slice(0, 3)
    const recentContents = this.state.contents.slice(0, 5)

    return [
      `品牌/账号：${this.state.settings.brandName}`,
      `主要目标：${this.state.settings.primaryGoal}`,
      `内容资产：${this.state.contents.length} 条，紧急发布项 ${urgent} 条，报告 ${this.state.reports.length} 份`,
      topPlatforms.length > 0
        ? `重点平台：${topPlatforms.map((item) => `${platformLabel(item.platform)} 曝光 ${metricValue(item.impressions)} / 互动 ${metricValue(item.interactions)}`).join('；')}`
        : '重点平台：暂无数据快照',
      recentContents.length > 0
        ? `最近内容：\n${recentContents.map((item) => `- ${item.title} | ${formatLabel(item.stage, CONTENT_STAGES)} | ${item.targetPlatforms.map(platformLabel).join('、') || '未分发'} | 更新于 ${formatShortDate(item.updatedAt)}`).join('\n')}`
        : '最近内容：当前还没有内容卡',
    ].join('\n')
  }

  buildContentContext(content: ContentItem): string {
    return [
      `标题：${content.title}`,
      `格式：${formatLabel(content.format, CONTENT_FORMATS)}`,
      `阶段：${formatLabel(content.stage, CONTENT_STAGES)}`,
      `目标：${formatLabel(content.objective, OBJECTIVES)}`,
      `内容支柱：${content.pillar || '未设置'}`,
      `目标受众：${content.audience || '未设置'}`,
      `目标平台：${content.targetPlatforms.map(platformLabel).join('、') || '未设置'}`,
      `开头钩子：${content.hook || '未设置'}`,
      `核心角度：${content.angle || '未设置'}`,
      `CTA：${content.cta || '未设置'}`,
      `关键词：${content.keywords.join('、') || '未设置'}`,
      `大纲：\n${content.outline || '未填写'}`,
      `正文：\n${clipText(content.body, 3500) || '未填写'}`,
      `备注：${content.notes || '无'}`,
    ].join('\n')
  }

  buildAnalyticsDigest(): string {
    const lastSeven = this.state.analytics.filter((item) => {
      const delta = nowTimestamp() - new Date(item.date).getTime()
      return delta <= 1000 * 60 * 60 * 24 * 7
    })
    if (lastSeven.length === 0) {
      return '最近 7 天暂无运营快照。'
    }
    return lastSeven
      .slice(0, 10)
      .map((item) => {
        const contentTitle = this.state.contents.find((content) => content.id === item.contentId)?.title || '未关联内容'
        return `- ${item.date} | ${platformLabel(item.platform)} | ${contentTitle} | 曝光 ${item.impressions} | 阅读 ${item.reads} | 互动 ${item.interactions} | 线索 ${item.leads} | 转化 ${item.conversions}`
      })
      .join('\n')
  }

  async runAiAction(kind: string, contentId = '', platform = ''): Promise<void> {
    const content = this.state.contents.find((item) => item.id === (contentId || this.state.selectedContentId)) || null
    const marker = `[HC_SOCIAL_REPORT::${uid('capture')}]`
    const digest = this.buildWorkspaceDigest()
    let title = ''
    let type = ''
    let prompt = ''
    let relatedContentId = content?.id || ''

    if (kind === 'daily-brief') {
      title = `AI 日报 · ${todayIsoDate()}`
      type = 'daily-brief'
      prompt = [
        marker,
        '你是内容增长运营 Agent。请基于下面的工作台摘要，输出今天的运营日报。',
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 用“今日重点 / 风险提醒 / 分发动作 / 复盘问题”四段结构输出。',
        '3. 结论必须可执行，不要写空泛口号。',
        '',
        digest,
        '',
        '最近 7 天数据：',
        this.buildAnalyticsDigest(),
      ].join('\n')
    } else if (kind === 'weekly-review') {
      title = `AI 周复盘 · ${todayIsoDate()}`
      type = 'weekly-review'
      prompt = [
        marker,
        '你是内容增长运营 Agent。请对最近一周做增长周复盘。',
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 用“本周结果 / 表现最好内容 / 失速内容诊断 / 下周实验”四段输出。',
        '3. 明确区分事实、推断和建议。',
        '',
        digest,
        '',
        '最近 7 天数据：',
        this.buildAnalyticsDigest(),
      ].join('\n')
    } else if (kind === 'experiments') {
      title = `AI 增长实验清单 · ${todayIsoDate()}`
      type = 'experiment-plan'
      prompt = [
        marker,
        '请基于以下内容与数据，为专业自媒体人提出 3 个最值得执行的增长实验。',
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 每个实验都包含：假设、执行动作、观察指标、停止条件。',
        '',
        digest,
        '',
        '最近 7 天数据：',
        this.buildAnalyticsDigest(),
      ].join('\n')
    } else if (kind === 'content-brief' && content) {
      title = `AI 内容 Brief · ${content.title}`
      type = 'content-brief'
      prompt = [
        marker,
        '请把下面的内容卡整理成专业创作者可直接执行的内容 Brief。',
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 输出结构包含：目标、受众、核心论点、三段式结构、证据、CTA、平台适配建议。',
        '',
        this.buildContentContext(content),
      ].join('\n')
    } else if (kind === 'repurpose' && content) {
      title = `AI 多平台改写包 · ${content.title}`
      type = 'repurpose-pack'
      prompt = [
        marker,
        '请把下面的内容改写为多平台发布包。',
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 至少覆盖当前内容卡里勾选的平台。',
        '3. 每个平台都输出成品文案、开头钩子和 CTA。',
        '',
        this.buildContentContext(content),
      ].join('\n')
    } else if (kind === 'publish' && content) {
      const platformLabelText = platform ? platformLabel(platform) : '所有目标平台'
      title = `AI 发布包 · ${content.title}`
      type = 'publish-package'
      prompt = [
        marker,
        `请为这条内容生成 ${platformLabelText} 的最终发布执行包。如果工具可用，请执行发送；如果工具不可用，请输出可直接复制的最终文案。`,
        '要求：',
        '1. 首行原样输出上面的标记。',
        '2. 先做发布前检查，再给最终发布版本。',
        '3. 如果存在风险或缺素材，必须明确指出。',
        '',
        this.buildContentContext(content),
        '',
        platform
          ? `目标平台：${platformLabel(platform)}`
          : `目标平台：${content.targetPlatforms.map(platformLabel).join('、') || '未设置'}`,
      ].join('\n')
    } else {
      this.helloclaw.ui.showNotice('当前动作缺少必要上下文，请先选中内容或补充数据', 'warning')
      return
    }

    this.pendingCaptures.push({
      marker,
      type,
      title,
      relatedContentId,
    })

    try {
      await this.helloclaw.chat.send(prompt)
      this.helloclaw.ui.showNotice('已将任务发送给 OpenClaw，对话返回后会自动保存到报告中心', 'success')
    } catch {
      this.pendingCaptures = this.pendingCaptures.filter((item) => item.marker !== marker)
      this.helloclaw.ui.showNotice('发送到 OpenClaw 失败，请检查连接状态', 'error')
    }
  }

  async handleChatMessage(message: any): Promise<void> {
    if (!message || message.role !== 'assistant') {
      return
    }

    const text = asString(message.content || message.text)
    if (!text) {
      return
    }

    let pending = this.pendingCaptures.find((item) => text.includes(item.marker))
    if (!pending && this.pendingCaptures.length === 1) {
      pending = this.pendingCaptures[0]
    }
    if (!pending) {
      return
    }

    const report = this.hydrateReport({
      id: uid('report'),
      type: pending.type,
      title: pending.title,
      date: todayIsoDate(),
      source: 'ai',
      relatedContentId: pending.relatedContentId,
      createdAt: nowTimestamp(),
      content: text.replace(pending.marker, '').trim(),
    })

    await this.persistReport(report)
    this.pendingCaptures = this.pendingCaptures.filter((item) => item.marker !== pending.marker)
    await this.reloadAllData()
    this.state.selectedReportId = report.id
    this.render()
    this.helloclaw.ui.showNotice('已将 OpenClaw 输出保存到报告中心', 'success')
  }

  render(): void {
    if (!this.root) {
      return
    }

    const selectedContent = this.getSelectedContent()
    const selectedReport = this.getSelectedReport()
    const filteredContents = this.getFilteredContents()
    const publishQueue = this.getPublishQueue()
    const overviewStats = this.getOverviewStats()
    const platformSummary = this.getPlatformSummary()

    this.root.className = 'hc-sm-root'
    this.root.innerHTML = `
      <div class="hc-sm-app">
        <section class="hc-sm-hero">
          <div>
            <p class="hc-sm-eyebrow">Professional Creator OS</p>
            <h1>${escapeHtml(this.state.settings.brandName)}</h1>
            <p class="hc-sm-subtitle">${escapeHtml(this.state.settings.primaryGoal)}</p>
          </div>
          <div class="hc-sm-hero__actions">
            <button class="hc-btn hc-btn--ghost" data-action="refresh-data">刷新数据</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">生成日报</button>
            <button class="hc-btn hc-btn--primary" data-action="new-content">新建内容卡</button>
          </div>
        </section>

        <nav class="hc-sm-tabs">
          ${this.renderTabButton('overview', '总览')}
          ${this.renderTabButton('pipeline', '内容管线')}
          ${this.renderTabButton('publish', '发布中心')}
          ${this.renderTabButton('analytics', '运营分析')}
          ${this.renderTabButton('reports', 'AI 复盘')}
        </nav>

        <section class="hc-sm-body">
          ${this.state.activeTab === 'overview' ? this.renderOverviewTab(overviewStats, platformSummary, publishQueue) : ''}
          ${this.state.activeTab === 'pipeline' ? this.renderPipelineTab(filteredContents, selectedContent) : ''}
          ${this.state.activeTab === 'publish' ? this.renderPublishTab(publishQueue) : ''}
          ${this.state.activeTab === 'analytics' ? this.renderAnalyticsTab(platformSummary) : ''}
          ${this.state.activeTab === 'reports' ? this.renderReportsTab(selectedReport) : ''}
        </section>
      </div>
    `
  }

  renderTabButton(tab: TabId, label: string): string {
    const activeClass = this.state.activeTab === tab ? 'is-active' : ''
    return `
      <button class="hc-sm-tab ${activeClass}" data-action="switch-tab" data-tab="${tab}">
        ${label}
      </button>
    `
  }

  renderOverviewTab(
    overviewStats: Array<{ label: string; value: string; note: string }>,
    platformSummary: Array<{ platform: string; impressions: number; interactions: number; leads: number }>,
    publishQueue: PublishQueueItem[],
  ): string {
    const urgentQueue = publishQueue
      .filter((item) => item.status !== 'published')
      .slice(0, 5)

    return `
      <div class="hc-sm-stack">
        <div class="hc-sm-grid hc-sm-grid--stats">
          ${overviewStats.map((item) => `
            <article class="hc-card hc-stat-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <small>${escapeHtml(item.note)}</small>
            </article>
          `).join('')}
        </div>

        <div class="hc-sm-grid hc-sm-grid--main">
          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Today Queue</p>
                <h3>待推进事项</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">发给 OpenClaw 晨检</button>
            </div>
            <div class="hc-sm-list">
              ${urgentQueue.length > 0 ? urgentQueue.map((item) => `
                <button class="hc-sm-list__item" data-action="select-content" data-content-id="${item.contentId}">
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${platformLabel(item.platform)} · ${formatDateTime(item.scheduledAt || item.dueDate)} · ${formatLabel(item.stage, CONTENT_STAGES)}</small>
                  </div>
                  <span class="hc-chip ${toneClassForPublishStatus(item.status)}">${escapeHtml(item.status)}</span>
                </button>
              `).join('') : '<p class="hc-empty">当前没有紧急发布项，适合补充选题或复盘。</p>'}
            </div>
          </article>

          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Channel Pulse</p>
                <h3>平台表现</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="weekly-review">生成周复盘</button>
            </div>
            <div class="hc-sm-platform-grid">
              ${platformSummary.length > 0 ? platformSummary.slice(0, 6).map((item) => `
                <article class="hc-sm-mini-card">
                  <strong>${platformLabel(item.platform)}</strong>
                  <span>曝光 ${metricValue(item.impressions)}</span>
                  <span>互动 ${metricValue(item.interactions)}</span>
                  <span>线索 ${metricValue(item.leads)}</span>
                </article>
              `).join('') : '<p class="hc-empty">先在“运营分析”里记录数据快照，平台表现会自动汇总。</p>'}
            </div>
          </article>
        </div>

        <article class="hc-card">
          <div class="hc-card__header">
            <div>
              <p class="hc-sm-eyebrow">Recent Content</p>
              <h3>近期内容与复用机会</h3>
            </div>
            <button class="hc-btn hc-btn--ghost" data-action="switch-tab" data-tab="pipeline">打开内容管线</button>
          </div>
          <div class="hc-sm-grid hc-sm-grid--cards">
            ${this.state.contents.slice(0, 6).map((item) => `
              <article class="hc-sm-content-card">
                <div class="hc-sm-content-card__head">
                  <span class="hc-chip ${toneClassForStage(item.stage)}">${formatLabel(item.stage, CONTENT_STAGES)}</span>
                  <small>${formatLabel(item.format, CONTENT_FORMATS)}</small>
                </div>
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(clipText(item.hook || item.angle || item.body, 120) || '补一条钩子或内容摘要，便于团队快速判断优先级。')}</p>
                <div class="hc-sm-tag-row">
                  ${item.targetPlatforms.map((platform) => `<span class="hc-chip tone-muted">${platformLabel(platform)}</span>`).join('')}
                </div>
                <div class="hc-sm-content-card__footer">
                  <small>${formatShortDate(item.updatedAt)} 更新</small>
                  <button class="hc-btn hc-btn--ghost" data-action="select-content" data-content-id="${item.id}">查看</button>
                </div>
              </article>
            `).join('') || '<p class="hc-empty">还没有内容卡。先创建一条选题，工作台会自动形成发布和复盘链路。</p>'}
          </div>
        </article>
      </div>
    `
  }

  renderPipelineTab(contents: ContentItem[], selectedContent: ContentItem | null): string {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__filters">
            <label>
              <span>阶段</span>
              <select data-filter="content-stage">
                <option value="all">全部阶段</option>
                ${CONTENT_STAGES.map((item) => `<option value="${item.value}" ${this.state.contentStageFilter === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>平台</span>
              <select data-filter="content-platform">
                <option value="all">全部平台</option>
                ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}" ${this.state.contentPlatformFilter === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">生成增长实验</button>
            <button class="hc-btn hc-btn--primary" data-action="new-content">新增内容卡</button>
          </div>
        </div>

        <div class="hc-sm-split">
          <article class="hc-card hc-sm-list-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Pipeline</p>
                <h3>内容列表</h3>
              </div>
              <span class="hc-chip tone-muted">${contents.length} 条</span>
            </div>
            <div class="hc-sm-list">
              ${contents.length > 0 ? contents.map((item) => `
                <button
                  class="hc-sm-list__item ${this.state.selectedContentId === item.id ? 'is-selected' : ''}"
                  data-action="select-content"
                  data-content-id="${item.id}"
                >
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${formatLabel(item.stage, CONTENT_STAGES)} · ${item.targetPlatforms.map(platformLabel).join('、') || '未设置平台'}</small>
                  </div>
                  <small>${formatShortDate(item.updatedAt)}</small>
                </button>
              `).join('') : '<p class="hc-empty">当前筛选条件下没有内容。你可以新建一条内容卡，或切换筛选。</p>'}
            </div>
          </article>

          <article class="hc-card hc-sm-editor-panel">
            ${selectedContent ? this.renderContentEditor(selectedContent) : `
              <div class="hc-empty hc-empty--large">
                选择左侧内容卡后，可以编辑选题、平台、排期、正文，并把任务发送给 OpenClaw。
              </div>
            `}
          </article>
        </div>
      </div>
    `
  }

  renderContentEditor(content: ContentItem): string {
    return `
      <div class="hc-card__header">
        <div>
          <p class="hc-sm-eyebrow">Editor</p>
          <h3>${escapeHtml(content.title)}</h3>
        </div>
        <div class="hc-sm-toolbar__actions">
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="content-brief" data-content-id="${content.id}">生成 Brief</button>
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="repurpose" data-content-id="${content.id}">多平台改写</button>
          <button class="hc-btn hc-btn--primary" data-action="save-content">保存</button>
        </div>
      </div>

      <div class="hc-sm-form-grid">
        <label>
          <span>标题</span>
          <input id="hc-content-title" value="${escapeHtml(content.title)}" placeholder="例如：我如何把一篇长文拆成 5 个平台版本" />
        </label>
        <label>
          <span>内容格式</span>
          <select id="hc-content-format">
            ${CONTENT_FORMATS.map((item) => `<option value="${item.value}" ${content.format === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>阶段</span>
          <select id="hc-content-stage">
            ${CONTENT_STAGES.map((item) => `<option value="${item.value}" ${content.stage === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>目标</span>
          <select id="hc-content-objective">
            ${OBJECTIVES.map((item) => `<option value="${item.value}" ${content.objective === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>内容支柱</span>
          <input id="hc-content-pillar" value="${escapeHtml(content.pillar)}" placeholder="例如：增长方法论 / 案例拆解" />
        </label>
        <label>
          <span>目标受众</span>
          <input id="hc-content-audience" value="${escapeHtml(content.audience)}" placeholder="例如：SaaS 创始人 / 运营负责人" />
        </label>
        <label>
          <span>截止日期</span>
          <input id="hc-content-due-date" type="date" value="${escapeHtml(content.dueDate)}" />
        </label>
        <label>
          <span>计划发布时间</span>
          <input id="hc-content-scheduled-at" type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(content.scheduledAt))}" />
        </label>
      </div>

      <div class="hc-sm-form-grid">
        <label class="is-wide">
          <span>开头钩子</span>
          <textarea id="hc-content-hook" rows="3" placeholder="前三秒或前三句，要让目标用户立刻停下来">${escapeHtml(content.hook)}</textarea>
        </label>
        <label class="is-wide">
          <span>核心角度 / 论点</span>
          <textarea id="hc-content-angle" rows="3" placeholder="这条内容真正想传递什么，不要只写主题">${escapeHtml(content.angle)}</textarea>
        </label>
      </div>

      <div class="hc-sm-form-grid">
        <label>
          <span>CTA</span>
          <input id="hc-content-cta" value="${escapeHtml(content.cta)}" placeholder="例如：引导私信、预约 Demo、加入社群" />
        </label>
        <label class="is-wide">
          <span>关键词</span>
          <input id="hc-content-keywords" value="${escapeHtml(content.keywords.join(', '))}" placeholder="用逗号分隔：增长, 分发, 线索" />
        </label>
      </div>

      <div class="hc-card hc-card--subtle">
        <div class="hc-card__header">
          <div>
            <p class="hc-sm-eyebrow">Distribution</p>
            <h4>目标平台</h4>
          </div>
        </div>
        <div class="hc-sm-platform-grid">
          ${PLATFORM_OPTIONS.map((platform) => `
            <label class="hc-sm-check">
              <input
                type="checkbox"
                data-platform-checkbox
                value="${platform.id}"
                ${content.targetPlatforms.includes(platform.id) ? 'checked' : ''}
              />
              <strong>${platform.label}</strong>
              <small>${platform.hint}</small>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="hc-sm-form-grid">
        <label class="is-wide">
          <span>内容大纲</span>
          <textarea id="hc-content-outline" rows="6" placeholder="建议每行一个段落或小标题">${escapeHtml(content.outline)}</textarea>
        </label>
        <label class="is-wide">
          <span>正文 / 脚本</span>
          <textarea id="hc-content-body" rows="14" placeholder="这里放核心长文、脚本或草稿全文">${escapeHtml(content.body)}</textarea>
        </label>
      </div>

      <label class="is-wide">
        <span>运营备注</span>
        <textarea id="hc-content-notes" rows="4" placeholder="记录风险、素材、协作依赖或复盘提醒">${escapeHtml(content.notes)}</textarea>
      </label>

      <div class="hc-sm-meta-row">
        <div class="hc-sm-tag-row">
          ${content.publishTasks.map((task) => `<span class="hc-chip ${toneClassForPublishStatus(task.status)}">${platformLabel(task.platform)} · ${task.status}</span>`).join('')}
        </div>
        <div class="hc-sm-toolbar__actions">
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="publish" data-content-id="${content.id}">生成发布包</button>
          <button class="hc-btn hc-btn--danger" data-action="delete-content" data-content-id="${content.id}">删除</button>
        </div>
      </div>
    `
  }

  renderPublishTab(queue: PublishQueueItem[]): string {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__filters">
            <label>
              <span>发布状态</span>
              <select data-filter="publish-status">
                <option value="all">全部状态</option>
                <option value="draft" ${this.state.publishStatusFilter === 'draft' ? 'selected' : ''}>草稿</option>
                <option value="ready" ${this.state.publishStatusFilter === 'ready' ? 'selected' : ''}>待发</option>
                <option value="queued" ${this.state.publishStatusFilter === 'queued' ? 'selected' : ''}>已排队</option>
                <option value="published" ${this.state.publishStatusFilter === 'published' ? 'selected' : ''}>已发布</option>
                <option value="failed" ${this.state.publishStatusFilter === 'failed' ? 'selected' : ''}>失败</option>
              </select>
            </label>
            <label>
              <span>平台</span>
              <select data-filter="publish-platform">
                <option value="all">全部平台</option>
                ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}" ${this.state.publishPlatformFilter === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">让 OpenClaw 处理今日队列</button>
          </div>
        </div>

        <div class="hc-sm-grid hc-sm-grid--cards">
          ${queue.length > 0 ? queue.map((item) => `
            <article class="hc-card hc-sm-publish-card">
              <div class="hc-card__header">
                <div>
                  <p class="hc-sm-eyebrow">${platformLabel(item.platform)}</p>
                  <h3>${escapeHtml(item.title)}</h3>
                  <small>${formatDateTime(item.scheduledAt || item.dueDate)} · ${formatLabel(item.stage, CONTENT_STAGES)}</small>
                </div>
                <span class="hc-chip ${toneClassForPublishStatus(item.status)}">${escapeHtml(item.status)}</span>
              </div>
              <p>${escapeHtml(clipText(item.caption || item.hook || item.body, 160) || '当前还没有单独发布文案，建议先在内容卡里完善钩子或正文。')}</p>
              <div class="hc-sm-tag-row">
                <span class="hc-chip tone-muted">${formatLabel(item.format, CONTENT_FORMATS)}</span>
                <span class="hc-chip tone-muted">${formatLabel(item.objective, OBJECTIVES)}</span>
                ${item.url ? `<a class="hc-chip tone-success" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">已记录链接</a>` : ''}
              </div>
              <div class="hc-sm-publish-actions">
                <button class="hc-btn hc-btn--ghost" data-action="edit-publish-meta" data-content-id="${item.contentId}" data-platform="${item.platform}">编辑文案/链接</button>
                <button class="hc-btn hc-btn--ghost" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="queued">排队</button>
                <button class="hc-btn hc-btn--ghost" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="published">已发布</button>
                <button class="hc-btn hc-btn--danger" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="failed">失败</button>
                <button class="hc-btn hc-btn--primary" data-action="run-ai" data-ai="publish" data-content-id="${item.contentId}" data-platform="${item.platform}">发送给 OpenClaw</button>
              </div>
            </article>
          `).join('') : '<p class="hc-empty">当前筛选条件下没有发布任务。内容卡勾选目标平台后，会自动出现在这里。</p>'}
        </div>
      </div>
    `
  }

  renderAnalyticsTab(platformSummary: Array<{ platform: string; impressions: number; interactions: number; leads: number }>): string {
    const topSnapshots = this.state.analytics.slice(0, 8)

    return `
      <div class="hc-sm-stack">
        <div class="hc-sm-grid hc-sm-grid--main">
          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Performance Overview</p>
                <h3>平台汇总</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">用 OpenClaw 找实验机会</button>
            </div>
            <div class="hc-sm-platform-grid">
              ${platformSummary.length > 0 ? platformSummary.map((item) => `
                <article class="hc-sm-mini-card">
                  <strong>${platformLabel(item.platform)}</strong>
                  <span>曝光 ${metricValue(item.impressions)}</span>
                  <span>互动 ${metricValue(item.interactions)}</span>
                  <span>线索 ${metricValue(item.leads)}</span>
                </article>
              `).join('') : '<p class="hc-empty">还没有数据快照。先录入平台数据，再做分析与复盘。</p>'}
            </div>
          </article>

          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Snapshot Input</p>
                <h3>记录运营数据</h3>
              </div>
            </div>
            <div class="hc-sm-form-grid">
              <label>
                <span>日期</span>
                <input id="hc-analytics-date" type="date" value="${todayIsoDate()}" />
              </label>
              <label>
                <span>平台</span>
                <select id="hc-analytics-platform">
                  ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join('')}
                </select>
              </label>
              <label class="is-wide">
                <span>关联内容</span>
                <select id="hc-analytics-content">
                  <option value="">不关联具体内容</option>
                  ${this.state.contents.map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join('')}
                </select>
              </label>
            </div>
            <div class="hc-sm-form-grid">
              <label><span>曝光</span><input id="hc-analytics-impressions" type="number" min="0" placeholder="0" /></label>
              <label><span>阅读/播放</span><input id="hc-analytics-reads" type="number" min="0" placeholder="0" /></label>
              <label><span>互动</span><input id="hc-analytics-interactions" type="number" min="0" placeholder="0" /></label>
              <label><span>收藏</span><input id="hc-analytics-saves" type="number" min="0" placeholder="0" /></label>
              <label><span>分享</span><input id="hc-analytics-shares" type="number" min="0" placeholder="0" /></label>
              <label><span>线索</span><input id="hc-analytics-leads" type="number" min="0" placeholder="0" /></label>
              <label><span>转化</span><input id="hc-analytics-conversions" type="number" min="0" placeholder="0" /></label>
              <label><span>收入</span><input id="hc-analytics-revenue" type="number" min="0" placeholder="0" /></label>
              <label><span>新增关注</span><input id="hc-analytics-followers" type="number" min="0" placeholder="0" /></label>
            </div>
            <label class="is-wide">
              <span>备注</span>
              <textarea id="hc-analytics-notes" rows="3" placeholder="记录异常、投流、素材、热点或转化链路变化"></textarea>
            </label>
            <div class="hc-sm-toolbar__actions">
              <button class="hc-btn hc-btn--primary" data-action="save-snapshot">保存数据快照</button>
            </div>
          </article>
        </div>

        <article class="hc-card">
          <div class="hc-card__header">
            <div>
              <p class="hc-sm-eyebrow">Recent Snapshots</p>
              <h3>最近数据记录</h3>
            </div>
          </div>
          <div class="hc-sm-list">
            ${topSnapshots.length > 0 ? topSnapshots.map((item) => `
              <div class="hc-sm-list__item hc-sm-list__item--static">
                <div>
                  <strong>${platformLabel(item.platform)} · ${escapeHtml(item.date)}</strong>
                  <small>
                    ${this.state.contents.find((content) => content.id === item.contentId)?.title || '未关联内容'}
                    · 曝光 ${item.impressions}
                    · 阅读 ${item.reads}
                    · 互动 ${item.interactions}
                    · 线索 ${item.leads}
                  </small>
                </div>
                <button class="hc-btn hc-btn--danger" data-action="delete-snapshot" data-snapshot-id="${item.id}">删除</button>
              </div>
            `).join('') : '<p class="hc-empty">保存第一条数据快照后，这里会按时间倒序展示。</p>'}
          </div>
        </article>
      </div>
    `
  }

  renderReportsTab(selectedReport: ReportRecord | null): string {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">生成日报</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="weekly-review">生成周复盘</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">生成实验计划</button>
          </div>
        </div>

        <div class="hc-sm-split">
          <article class="hc-card hc-sm-list-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Reports</p>
                <h3>报告中心</h3>
              </div>
              <span class="hc-chip tone-muted">${this.state.reports.length} 份</span>
            </div>
            <div class="hc-sm-list">
              ${this.state.reports.length > 0 ? this.state.reports.map((item) => `
                <button
                  class="hc-sm-list__item ${this.state.selectedReportId === item.id ? 'is-selected' : ''}"
                  data-action="select-report"
                  data-report-id="${item.id}"
                >
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${REPORT_TYPES[item.type] || item.type} · ${item.source === 'ai' ? 'OpenClaw' : '手动'} · ${escapeHtml(item.date)}</small>
                  </div>
                  <small>${formatShortDate(item.createdAt)}</small>
                </button>
              `).join('') : '<p class="hc-empty">还没有报告。可以手动记录运营笔记，或把任务发送给 OpenClaw 自动生成。</p>'}
            </div>
          </article>

          <article class="hc-card hc-sm-editor-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Manual Note</p>
                <h3>记录运营笔记</h3>
              </div>
              <button class="hc-btn hc-btn--primary" data-action="save-manual-report">保存笔记</button>
            </div>
            <div class="hc-sm-form-grid">
              <label class="is-wide">
                <span>标题</span>
                <input id="hc-report-title" value="" placeholder="例如：本周选题会结论 / 发布异常记录" />
              </label>
              <label class="is-wide">
                <span>内容</span>
                <textarea id="hc-report-body" rows="8" placeholder="记录会议结论、素材缺口、增长判断或后续动作"></textarea>
              </label>
            </div>

            <div class="hc-card hc-card--subtle">
              <div class="hc-card__header">
                <div>
                  <p class="hc-sm-eyebrow">Selected Report</p>
                  <h3>${escapeHtml(selectedReport?.title || '暂无选中报告')}</h3>
                </div>
                ${selectedReport ? `<button class="hc-btn hc-btn--danger" data-action="delete-report" data-report-id="${selectedReport.id}">删除</button>` : ''}
              </div>
              ${selectedReport ? `
                <div class="hc-sm-tag-row">
                  <span class="hc-chip tone-muted">${escapeHtml(REPORT_TYPES[selectedReport.type] || selectedReport.type)}</span>
                  <span class="hc-chip tone-muted">${selectedReport.source === 'ai' ? 'OpenClaw 输出' : '手动记录'}</span>
                  <span class="hc-chip tone-muted">${escapeHtml(selectedReport.date)}</span>
                </div>
                <div class="hc-sm-report-body">${nl2br(selectedReport.content)}</div>
              ` : '<p class="hc-empty">左侧选择一份报告后，这里会展示完整内容。</p>'}
            </div>
          </article>
        </div>
      </div>
    `
  }
}

export default SocialMediaOpsApp
