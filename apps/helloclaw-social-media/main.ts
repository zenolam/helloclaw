/**
 * 自媒体助手 - HelloClaw 应用
 *
 * 提供自媒体内容管理和发布功能
 * 包含：文章管理、OKR管理、日报展示、发布历史
 *
 * 注意：此文件需要编译为 main.js 后使用
 */

// 当应用在 HelloClaw 中加载时，HelloClawApp 和 helloclaw 会被注入
declare const HelloClawApp: new (helloclaw: any) => any

// ─────────────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────────────

interface Article {
  id: string
  title: string
  status: 'draft' | 'published' | 'scheduled'
  platforms: string[]
  created: string
}

interface KeyResult {
  id: string
  title: string
  target: number
  current: number
  unit: string
}

interface Objective {
  id: string
  title: string
  keyResults: KeyResult[]
}

interface OKR {
  id: string
  title: string
  period: string
  status: 'active' | 'completed' | 'archived'
  created: string
  objectives: Objective[]
}

interface DailyReport {
  date: string
  generatedAt: string
  content: string
}

interface PublishRecord {
  id: string
  articleId: string
  articleTitle: string
  platform: string
  platformLabel: string
  publishedAt: string
  status: 'success' | 'failed' | 'pending'
  url?: string
}

type TabId = 'articles' | 'okr' | 'daily-reports' | 'publish-history'

// ─────────────────────────────────────────────────────────────────────────────
// 文章视图组件
// ─────────────────────────────────────────────────────────────────────────────

class ArticlesView {
  private container: HTMLElement
  private sdk: any
  private articles: Article[] = []
  private parentView: SocialMediaView

  constructor(container: HTMLElement, sdk: any, parentView: SocialMediaView) {
    this.container = container
    this.sdk = sdk
    this.parentView = parentView
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="articles-view">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="total-articles">0</div>
            <div class="stat-label">文章总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="published-count">0</div>
            <div class="stat-label">已发布</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="draft-count">0</div>
            <div class="stat-label">草稿</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="scheduled-count">0</div>
            <div class="stat-label">待发布</div>
          </div>
        </div>

        <div class="articles-section">
          <div class="section-header">
            <h2>文章列表</h2>
            <button id="new-article-btn" class="btn-primary">新建文章</button>
          </div>
          <div id="articles-list" class="articles-list">
            <div class="loading">加载中...</div>
          </div>
        </div>
      </div>
    `

    this.bindEvents()
    await this.loadArticles()
  }

  private bindEvents(): void {
    const newArticleBtn = this.container.querySelector('#new-article-btn')
    newArticleBtn?.addEventListener('click', () => this.createNewArticle())
  }

  async loadArticles(): Promise<void> {
    const listEl = this.container.querySelector('#articles-list')
    if (!listEl) return

    try {
      const entries = await this.sdk.storage.list('articles')
      this.articles = []

      for (const entry of entries) {
        if (entry.path.endsWith('.md')) {
          try {
            const fm = await this.sdk.storage.readFrontmatter(`articles/${entry.path}`)
            this.articles.push({
              id: entry.path.replace('.md', ''),
              title: fm.title || '未命名',
              status: fm.status || 'draft',
              platforms: fm.platforms || [],
              created: fm.created || '未知',
            })
          } catch {
            // 跳过无法解析的文件
          }
        }
      }

      this.renderArticlesList()
      this.updateStats()
    } catch (err) {
      console.error('[SocialMedia] 加载文章失败:', err)
      listEl.innerHTML = '<div class="error">加载失败，请重试</div>'
    }
  }

  private renderArticlesList(): void {
    const listEl = this.container.querySelector('#articles-list')
    if (!listEl) return

    if (this.articles.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>暂无文章</p>
          <p class="hint">点击"新建文章"开始创作</p>
        </div>
      `
      return
    }

    listEl.innerHTML = this.articles
      .map(
        (article) => `
      <div class="article-card" data-id="${article.id}">
        <div class="article-info">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span class="status status-${article.status}">${this.getStatusLabel(article.status)}</span>
            <span>${article.created}</span>
            ${article.platforms.length > 0 ? `<span>${article.platforms.join(', ')}</span>` : ''}
          </div>
        </div>
        <div class="article-actions">
          <button class="btn-icon btn-edit" title="编辑">✏️</button>
          <button class="btn-icon btn-publish" title="发布">📤</button>
          <button class="btn-icon btn-delete" title="删除">🗑️</button>
        </div>
      </div>
    `
      )
      .join('')

    // 绑定按钮事件
    listEl.querySelectorAll('.article-card').forEach((card) => {
      const id = (card as HTMLElement).dataset.id
      card.querySelector('.btn-edit')?.addEventListener('click', () => this.editArticle(id!))
      card.querySelector('.btn-publish')?.addEventListener('click', () => this.publishArticle(id!))
      card.querySelector('.btn-delete')?.addEventListener('click', () => this.deleteArticle(id!))
    })
  }

  private updateStats(): void {
    const totalEl = this.container.querySelector('#total-articles')
    const publishedEl = this.container.querySelector('#published-count')
    const draftEl = this.container.querySelector('#draft-count')
    const scheduledEl = this.container.querySelector('#scheduled-count')

    if (totalEl) totalEl.textContent = String(this.articles.length)
    if (publishedEl)
      publishedEl.textContent = String(this.articles.filter((a) => a.status === 'published').length)
    if (draftEl)
      draftEl.textContent = String(this.articles.filter((a) => a.status === 'draft').length)
    if (scheduledEl)
      scheduledEl.textContent = String(this.articles.filter((a) => a.status === 'scheduled').length)
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      scheduled: '待发布',
    }
    return labels[status] || status
  }

  private async createNewArticle(): Promise<void> {
    this.sdk.ui.showModal({
      title: '新建文章',
      content: `
        <div class="form-group">
          <label for="article-title">文章标题</label>
          <input type="text" id="article-title" placeholder="请输入文章标题" />
        </div>
      `,
      confirmText: '创建',
      cancelText: '取消',
      onConfirm: async () => {
        const titleInput = document.getElementById('article-title') as HTMLInputElement
        const title = titleInput?.value?.trim()

        if (!title) {
          this.sdk.ui.showNotice('请输入文章标题', 'error')
          return
        }

        const id = `article-${Date.now()}`
        const now = new Date().toISOString().split('T')[0]
        const content = `---
title: "${title}"
created: "${now}"
status: draft
platforms: []
---

# ${title}

在这里开始写作...
`

        try {
          await this.sdk.storage.write(`articles/${id}.md`, content)
          this.sdk.ui.showNotice('文章创建成功', 'success')
          await this.loadArticles()
        } catch (err) {
          console.error('[SocialMedia] 创建文章失败:', err)
          this.sdk.ui.showNotice('创建失败，请重试', 'error')
        }
      },
    })
  }

  private editArticle(id: string): void {
    this.sdk.ui.showNotice('编辑功能开发中...', 'info')
  }

  private async publishArticle(id: string): Promise<void> {
    const article = this.articles.find((a) => a.id === id)
    const articleTitle = article?.title || id

    this.sdk.ui.showModal({
      title: '发布文章',
      content: `
        <div class="form-group">
          <label>选择发布平台</label>
          <div class="checkbox-group">
            <label><input type="checkbox" value="wechat" /> 微信公众号</label>
            <label><input type="checkbox" value="weibo" /> 新浪微博</label>
            <label><input type="checkbox" value="zhihu" /> 知乎</label>
            <label><input type="checkbox" value="toutiao" /> 今日头条</label>
          </div>
        </div>
      `,
      confirmText: '发布',
      cancelText: '取消',
      onConfirm: async () => {
        const checkboxes = document.querySelectorAll('.checkbox-group input:checked')
        const platforms = Array.from(checkboxes).map((cb) => (cb as HTMLInputElement).value)

        if (platforms.length === 0) {
          this.sdk.ui.showNotice('请至少选择一个平台', 'error')
          return
        }

        const platformLabels: Record<string, string> = {
          wechat: '微信公众号',
          weibo: '新浪微博',
          zhihu: '知乎',
          toutiao: '今日头条',
        }

        try {
          // 记录发布历史
          await this.savePublishRecords(id, articleTitle, platforms, platformLabels)

          // 发送发布指令
          await this.sdk.chat.send(
            `请将文章 ${id} 发布到以下平台：${platforms.join(', ')}\n\n使用 publish_article 技能执行发布操作。`
          )
          this.sdk.ui.showNotice('正在发布...', 'info')

          // 刷新发布历史
          this.parentView.refreshPublishHistory()
        } catch (err) {
          console.error('[SocialMedia] 发布失败:', err)
          this.sdk.ui.showNotice('发布失败，请重试', 'error')
        }
      },
    })
  }

  private async savePublishRecords(
    articleId: string,
    articleTitle: string,
    platforms: string[],
    platformLabels: Record<string, string>
  ): Promise<void> {
    const records = await this.loadPublishRecords()
    const now = new Date().toISOString()

    for (const platform of platforms) {
      records.push({
        id: `pub-${Date.now()}-${platform}`,
        articleId,
        articleTitle,
        platform,
        platformLabel: platformLabels[platform] || platform,
        publishedAt: now,
        status: 'pending',
      })
    }

    await this.sdk.storage.write('publish-records.json', JSON.stringify(records, null, 2))
  }

  private async loadPublishRecords(): Promise<PublishRecord[]> {
    try {
      const content = await this.sdk.storage.read('publish-records.json')
      return JSON.parse(content)
    } catch {
      return []
    }
  }

  private async deleteArticle(id: string): Promise<void> {
    this.sdk.ui.showModal({
      title: '删除文章',
      content: '<p>确定要删除这篇文章吗？此操作不可恢复。</p>',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await this.sdk.storage.delete(`articles/${id}.md`)
          this.sdk.ui.showNotice('文章已删除', 'success')
          await this.loadArticles()
        } catch (err) {
          console.error('[SocialMedia] 删除失败:', err)
          this.sdk.ui.showNotice('删除失败，请重试', 'error')
        }
      },
    })
  }

  destroy(): void {
    this.container.innerHTML = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OKR 视图组件
// ─────────────────────────────────────────────────────────────────────────────

class OKRView {
  private container: HTMLElement
  private sdk: any
  private okrs: OKR[] = []

  constructor(container: HTMLElement, sdk: any) {
    this.container = container
    this.sdk = sdk
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="okr-view">
        <div class="section-header">
          <h2>OKR 管理</h2>
          <button id="new-okr-btn" class="btn-primary">新建 OKR</button>
        </div>
        <div id="okr-list" class="okr-list">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `

    this.bindEvents()
    await this.loadOKRs()
  }

  private bindEvents(): void {
    const newOkrBtn = this.container.querySelector('#new-okr-btn')
    newOkrBtn?.addEventListener('click', () => this.createNewOKR())
  }

  async loadOKRs(): Promise<void> {
    const listEl = this.container.querySelector('#okr-list')
    if (!listEl) return

    try {
      const entries = await this.sdk.storage.list('okr')
      this.okrs = []

      for (const entry of entries) {
        if (entry.path.endsWith('.md')) {
          try {
            const fm = await this.sdk.storage.readFrontmatter(`okr/${entry.path}`)
            this.okrs.push({
              id: fm.id || entry.path.replace('.md', ''),
              title: fm.title || '未命名 OKR',
              period: fm.period || '',
              status: fm.status || 'active',
              created: fm.created || '',
              objectives: fm.objectives || [],
            })
          } catch {
            // 跳过无法解析的文件
          }
        }
      }

      // 按周期排序
      this.okrs.sort((a, b) => b.period.localeCompare(a.period))
      this.renderOKRList()
    } catch (err) {
      console.error('[SocialMedia] 加载 OKR 失败:', err)
      listEl.innerHTML = '<div class="error">加载失败，请重试</div>'
    }
  }

  private renderOKRList(): void {
    const listEl = this.container.querySelector('#okr-list')
    if (!listEl) return

    if (this.okrs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>暂无 OKR</p>
          <p class="hint">点击"新建 OKR"开始制定目标</p>
        </div>
      `
      return
    }

    listEl.innerHTML = this.okrs
      .map(
        (okr) => `
      <div class="okr-card" data-id="${okr.id}">
        <div class="okr-header">
          <div class="okr-title-row">
            <h3 class="okr-title">${okr.title}</h3>
            <span class="status status-${okr.status}">${this.getStatusLabel(okr.status)}</span>
          </div>
          <div class="okr-meta">
            <span>周期：${okr.period}</span>
            <span>创建于：${okr.created}</span>
          </div>
        </div>
        <div class="objectives-list">
          ${okr.objectives
            .map(
              (obj) => `
            <div class="objective-item">
              <div class="objective-header">
                <span class="objective-icon">🎯</span>
                <span class="objective-title">${obj.title}</span>
              </div>
              <div class="key-results-list">
                ${obj.keyResults
                  .map(
                    (kr) => `
                  <div class="key-result-item" data-okr="${okr.id}" data-obj="${obj.id}" data-kr="${kr.id}">
                    <div class="kr-info">
                      <span class="kr-title">${kr.title}</span>
                      <span class="kr-progress-text">${kr.current} / ${kr.target} ${kr.unit}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${Math.min(100, (kr.current / kr.target) * 100)}%"></div>
                    </div>
                    <div class="kr-actions">
                      <button class="btn-icon btn-update-kr" title="更新进度">📊</button>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="okr-actions">
          <button class="btn-icon btn-delete-okr" title="删除 OKR">🗑️</button>
        </div>
      </div>
    `
      )
      .join('')

    // 绑定事件
    listEl.querySelectorAll('.btn-update-kr').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.key-result-item') as HTMLElement
        const okrId = item?.dataset.okr
        const objId = item?.dataset.obj
        const krId = item?.dataset.kr
        if (okrId && objId && krId) this.updateKRProgress(okrId, objId, krId)
      })
    })

    listEl.querySelectorAll('.btn-delete-okr').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const card = btn.closest('.okr-card') as HTMLElement
        const okrId = card?.dataset.id
        if (okrId) this.deleteOKR(okrId)
      })
    })
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: '进行中',
      completed: '已完成',
      archived: '已归档',
    }
    return labels[status] || status
  }

  private async createNewOKR(): Promise<void> {
    const now = new Date().toISOString().split('T')[0]
    const year = new Date().getFullYear()
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3)

    this.sdk.ui.showModal({
      title: '新建 OKR',
      content: `
        <div class="form-group">
          <label for="okr-title">OKR 标题</label>
          <input type="text" id="okr-title" placeholder="例如：2024 Q1 目标" value="${year} Q${quarter} 目标" />
        </div>
        <div class="form-group">
          <label for="okr-period">周期</label>
          <input type="text" id="okr-period" placeholder="例如：2024-Q1" value="${year}-Q${quarter}" />
        </div>
        <div class="form-group">
          <label>第一个目标</label>
          <input type="text" id="obj-title" placeholder="目标名称" />
        </div>
        <div class="form-group">
          <label>关键结果 1</label>
          <div class="kr-input-row">
            <input type="text" id="kr-title" placeholder="关键结果描述" style="flex: 2" />
            <input type="number" id="kr-target" placeholder="目标值" style="flex: 1" />
            <input type="text" id="kr-unit" placeholder="单位" style="flex: 1" />
          </div>
        </div>
      `,
      confirmText: '创建',
      cancelText: '取消',
      onConfirm: async () => {
        const title = (document.getElementById('okr-title') as HTMLInputElement)?.value?.trim()
        const period = (document.getElementById('okr-period') as HTMLInputElement)?.value?.trim()
        const objTitle = (document.getElementById('obj-title') as HTMLInputElement)?.value?.trim()
        const krTitle = (document.getElementById('kr-title') as HTMLInputElement)?.value?.trim()
        const krTarget = (document.getElementById('kr-target') as HTMLInputElement)?.value
        const krUnit = (document.getElementById('kr-unit') as HTMLInputElement)?.value?.trim()

        if (!title || !period) {
          this.sdk.ui.showNotice('请填写 OKR 标题和周期', 'error')
          return
        }

        const id = `okr-${Date.now()}`
        const objectives: Objective[] = []

        if (objTitle && krTitle && krTarget) {
          objectives.push({
            id: `obj-${Date.now()}`,
            title: objTitle,
            keyResults: [
              {
                id: `kr-${Date.now()}`,
                title: krTitle,
                target: parseInt(krTarget) || 0,
                current: 0,
                unit: krUnit || '个',
              },
            ],
          })
        }

        const content = `---
id: "${id}"
title: "${title}"
period: "${period}"
status: active
created: "${now}"
objectives:
${objectives
  .map(
    (obj) => `  - id: ${obj.id}
    title: "${obj.title}"
    keyResults:
${obj.keyResults
  .map(
    (kr) => `      - id: ${kr.id}
        title: "${kr.title}"
        target: ${kr.target}
        current: ${kr.current}
        unit: "${kr.unit}"
  `
  )
  .join('\n')}
  `
  )
  .join('\n')}
---

# ${title}

## 目标与关键结果

${objectives
  .map(
    (obj) => `### ${obj.title}

${obj.keyResults.map((kr) => `- [ ] ${kr.title} (${kr.current}/${kr.target} ${kr.unit})`).join('\n')}
  `
  )
  .join('\n\n')}
`

        try {
          await this.sdk.storage.write(`okr/${id}.md`, content)
          this.sdk.ui.showNotice('OKR 创建成功', 'success')
          await this.loadOKRs()
        } catch (err) {
          console.error('[SocialMedia] 创建 OKR 失败:', err)
          this.sdk.ui.showNotice('创建失败，请重试', 'error')
        }
      },
    })
  }

  private async updateKRProgress(okrId: string, objId: string, krId: string): Promise<void> {
    const okr = this.okrs.find((o) => o.id === okrId)
    const obj = okr?.objectives.find((o) => o.id === objId)
    const kr = obj?.keyResults.find((k) => k.id === krId)

    if (!kr) return

    this.sdk.ui.showModal({
      title: '更新关键结果进度',
      content: `
        <div class="form-group">
          <label>${kr.title}</label>
          <p class="kr-current-status">当前进度：${kr.current} / ${kr.target} ${kr.unit}</p>
          <div class="progress-bar large">
            <div class="progress-fill" style="width: ${Math.min(100, (kr.current / kr.target) * 100)}%"></div>
          </div>
        </div>
        <div class="form-group">
          <label for="new-progress">新的当前值</label>
          <input type="number" id="new-progress" value="${kr.current}" min="0" max="${kr.target * 2}" />
          <p class="hint">目标值：${kr.target} ${kr.unit}</p>
        </div>
      `,
      confirmText: '更新',
      cancelText: '取消',
      onConfirm: async () => {
        const newValue = parseInt(
          (document.getElementById('new-progress') as HTMLInputElement)?.value || '0'
        )

        try {
          // 更新内存中的数据
          kr.current = newValue

          // 重新生成文件内容
          await this.saveOKR(okr!)
          this.sdk.ui.showNotice('进度已更新', 'success')
          await this.loadOKRs()
        } catch (err) {
          console.error('[SocialMedia] 更新进度失败:', err)
          this.sdk.ui.showNotice('更新失败，请重试', 'error')
        }
      },
    })
  }

  private async saveOKR(okr: OKR): Promise<void> {
    const content = `---
id: "${okr.id}"
title: "${okr.title}"
period: "${okr.period}"
status: ${okr.status}
created: "${okr.created}"
objectives:
${okr.objectives
  .map(
    (obj) => `  - id: ${obj.id}
    title: "${obj.title}"
    keyResults:
${obj.keyResults
  .map(
    (kr) => `      - id: ${kr.id}
        title: "${kr.title}"
        target: ${kr.target}
        current: ${kr.current}
        unit: "${kr.unit}"
  `
  )
  .join('\n')}
  `
  )
  .join('\n')}
---

# ${okr.title}

## 目标与关键结果

${okr.objectives
  .map(
    (obj) => `### ${obj.title}

${obj.keyResults
  .map((kr) => `- [${kr.current >= kr.target ? 'x' : ' '}] ${kr.title} (${kr.current}/${kr.target} ${kr.unit})`)
  .join('\n')}
  `
  )
  .join('\n\n')}
`

    await this.sdk.storage.write(`okr/${okr.id}.md`, content)
  }

  private async deleteOKR(id: string): Promise<void> {
    this.sdk.ui.showModal({
      title: '删除 OKR',
      content: '<p>确定要删除这个 OKR 吗？此操作不可恢复。</p>',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await this.sdk.storage.delete(`okr/${id}.md`)
          this.sdk.ui.showNotice('OKR 已删除', 'success')
          await this.loadOKRs()
        } catch (err) {
          console.error('[SocialMedia] 删除失败:', err)
          this.sdk.ui.showNotice('删除失败，请重试', 'error')
        }
      },
    })
  }

  destroy(): void {
    this.container.innerHTML = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 日报视图组件（只读）
// ─────────────────────────────────────────────────────────────────────────────

class DailyReportView {
  private container: HTMLElement
  private sdk: any
  private reports: DailyReport[] = []

  constructor(container: HTMLElement, sdk: any) {
    this.container = container
    this.sdk = sdk
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="daily-report-view">
        <div class="section-header">
          <h2>日报记录</h2>
          <span class="hint-text">AI 自动生成，只读展示</span>
        </div>
        <div id="report-list" class="report-list">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `

    await this.loadReports()
  }

  async loadReports(): Promise<void> {
    const listEl = this.container.querySelector('#report-list')
    if (!listEl) return

    try {
      const entries = await this.sdk.storage.list('daily-reports')
      this.reports = []

      for (const entry of entries) {
        if (entry.path.endsWith('.md')) {
          try {
            const content = await this.sdk.storage.read(`daily-reports/${entry.path}`)
            const fm = await this.sdk.storage.readFrontmatter(`daily-reports/${entry.path}`)
            this.reports.push({
              date: fm.date || entry.path.replace('.md', ''),
              generatedAt: fm.generatedAt || '',
              content: content,
            })
          } catch {
            // 跳过无法解析的文件
          }
        }
      }

      // 按日期倒序排序
      this.reports.sort((a, b) => b.date.localeCompare(a.date))
      this.renderReportList()
    } catch (err) {
      console.error('[SocialMedia] 加载日报失败:', err)
      listEl.innerHTML = '<div class="error">加载失败，请重试</div>'
    }
  }

  private renderReportList(): void {
    const listEl = this.container.querySelector('#report-list')
    if (!listEl) return

    if (this.reports.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>暂无日报记录</p>
          <p class="hint">日报由 AI 在每日结束时自动生成</p>
        </div>
      `
      return
    }

    listEl.innerHTML = this.reports
      .map(
        (report) => `
      <div class="report-card" data-date="${report.date}">
        <div class="report-header">
          <h3 class="report-date">📅 ${this.formatDate(report.date)}</h3>
          <span class="report-generated">生成于 ${this.formatDateTime(report.generatedAt)}</span>
        </div>
        <div class="report-content preview">
          ${this.getPreviewText(report.content)}
        </div>
        <button class="btn-secondary btn-view-full">查看完整日报</button>
      </div>
    `
      )
      .join('')

    // 绑定查看详情事件
    listEl.querySelectorAll('.btn-view-full').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.report-card') as HTMLElement
        const date = card?.dataset.date
        const report = this.reports.find((r) => r.date === date)
        if (report) this.showReportDetail(report)
      })
    })
  }

  private getPreviewText(content: string): string {
    // 提取正文内容，截取前 200 字符
    const lines = content.split('\n')
    const bodyStart = lines.findIndex((l) => l.startsWith('---', 1))
    const body = lines.slice(bodyStart + 1).join('\n')
    return body.slice(0, 200) + (body.length > 200 ? '...' : '')
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    } catch {
      return dateStr
    }
  }

  private formatDateTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '未知'
    try {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN')
    } catch {
      return dateTimeStr
    }
  }

  private showReportDetail(report: DailyReport): void {
    this.sdk.ui.showModal({
      title: `日报 - ${this.formatDate(report.date)}`,
      content: `<div class="report-detail">${this.renderMarkdown(report.content)}</div>`,
      confirmText: '关闭',
      showCancel: false,
    })
  }

  private renderMarkdown(content: string): string {
    // 简单的 Markdown 渲染
    const lines = content.split('\n')
    const bodyStart = lines.findIndex((l) => l.startsWith('---', 1))
    const body = lines.slice(bodyStart + 1).join('\n')

    return body
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
  }

  destroy(): void {
    this.container.innerHTML = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 发布历史视图组件
// ─────────────────────────────────────────────────────────────────────────────

class PublishHistoryView {
  private container: HTMLElement
  private sdk: any
  private records: PublishRecord[] = []
  private filterPlatform: string = 'all'

  constructor(container: HTMLElement, sdk: any) {
    this.container = container
    this.sdk = sdk
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="publish-history-view">
        <div class="section-header">
          <h2>发布历史</h2>
          <div class="filter-group">
            <label>平台筛选：</label>
            <select id="platform-filter" class="filter-select">
              <option value="all">全部平台</option>
              <option value="wechat">微信公众号</option>
              <option value="weibo">新浪微博</option>
              <option value="zhihu">知乎</option>
              <option value="toutiao">今日头条</option>
            </select>
          </div>
        </div>
        <div id="history-list" class="history-list">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `

    this.bindEvents()
    await this.loadRecords()
  }

  private bindEvents(): void {
    const filterSelect = this.container.querySelector('#platform-filter')
    filterSelect?.addEventListener('change', (e) => {
      this.filterPlatform = (e.target as HTMLSelectElement).value
      this.renderHistoryList()
    })
  }

  async loadRecords(): Promise<void> {
    const listEl = this.container.querySelector('#history-list')
    if (!listEl) return

    try {
      const content = await this.sdk.storage.read('publish-records.json')
      this.records = JSON.parse(content)

      // 按时间倒序排序
      this.records.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      this.renderHistoryList()
    } catch {
      this.records = []
      this.renderHistoryList()
    }
  }

  private renderHistoryList(): void {
    const listEl = this.container.querySelector('#history-list')
    if (!listEl) return

    const filteredRecords =
      this.filterPlatform === 'all'
        ? this.records
        : this.records.filter((r) => r.platform === this.filterPlatform)

    if (filteredRecords.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>暂无发布记录</p>
          <p class="hint">发布文章后会自动记录到这里</p>
        </div>
      `
      return
    }

    listEl.innerHTML = filteredRecords
      .map(
        (record) => `
      <div class="history-card">
        <div class="history-info">
          <h3 class="history-title">${record.articleTitle}</h3>
          <div class="history-meta">
            <span class="platform-badge platform-${record.platform}">${record.platformLabel}</span>
            <span class="publish-time">${this.formatDateTime(record.publishedAt)}</span>
            <span class="status status-${record.status}">${this.getStatusLabel(record.status)}</span>
          </div>
        </div>
        ${
          record.url
            ? `
          <div class="history-actions">
            <a href="${record.url}" target="_blank" class="btn-secondary">查看发布</a>
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('')
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      success: '发布成功',
      failed: '发布失败',
      pending: '发布中',
    }
    return labels[status] || status
  }

  private formatDateTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '未知'
    try {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN')
    } catch {
      return dateTimeStr
    }
  }

  destroy(): void {
    this.container.innerHTML = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 主视图组件
// ─────────────────────────────────────────────────────────────────────────────

class SocialMediaView {
  private container: HTMLElement
  private sdk: any
  private currentTab: TabId = 'articles'
  private tabContent: HTMLElement | null = null
  private articlesView: ArticlesView | null = null
  private okrView: OKRView | null = null
  private dailyReportView: DailyReportView | null = null
  private publishHistoryView: PublishHistoryView | null = null

  constructor(container: HTMLElement, sdk: any) {
    this.container = container
    this.sdk = sdk
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="social-media-app">
        <header class="app-header">
          <h1>自媒体助手</h1>
          <div class="header-actions">
            <button id="refresh-btn" class="btn-secondary">刷新</button>
          </div>
        </header>

        <nav class="tab-nav">
          <button class="tab-btn active" data-tab="articles">文章</button>
          <button class="tab-btn" data-tab="okr">OKR</button>
          <button class="tab-btn" data-tab="daily-reports">日报</button>
          <button class="tab-btn" data-tab="publish-history">发布历史</button>
        </nav>

        <main class="app-main">
          <div id="tab-content" class="tab-content"></div>
        </main>
      </div>
    `

    this.tabContent = this.container.querySelector('#tab-content')
    this.bindEvents()
    await this.switchTab(this.currentTab)
  }

  private bindEvents(): void {
    const refreshBtn = this.container.querySelector('#refresh-btn')
    refreshBtn?.addEventListener('click', () => this.refreshCurrentTab())

    this.container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = (btn as HTMLElement).dataset.tab as TabId
        this.switchTab(tabId)
      })
    })
  }

  private async switchTab(tabId: TabId): Promise<void> {
    // 更新 Tab 状态
    this.container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabId)
    })

    this.currentTab = tabId

    // 销毁旧视图
    this.articlesView?.destroy()
    this.okrView?.destroy()
    this.dailyReportView?.destroy()
    this.publishHistoryView?.destroy()

    if (!this.tabContent) return

    // 创建新视图
    switch (tabId) {
      case 'articles':
        this.articlesView = new ArticlesView(this.tabContent, this.sdk, this)
        await this.articlesView.render()
        break
      case 'okr':
        this.okrView = new OKRView(this.tabContent, this.sdk)
        await this.okrView.render()
        break
      case 'daily-reports':
        this.dailyReportView = new DailyReportView(this.tabContent, this.sdk)
        await this.dailyReportView.render()
        break
      case 'publish-history':
        this.publishHistoryView = new PublishHistoryView(this.tabContent, this.sdk)
        await this.publishHistoryView.render()
        break
    }
  }

  private refreshCurrentTab(): void {
    switch (this.currentTab) {
      case 'articles':
        this.articlesView?.loadArticles()
        break
      case 'okr':
        this.okrView?.loadOKRs()
        break
      case 'daily-reports':
        this.dailyReportView?.loadReports()
        break
      case 'publish-history':
        this.publishHistoryView?.loadRecords()
        break
    }
  }

  refreshPublishHistory(): void {
    if (this.currentTab === 'publish-history') {
      this.publishHistoryView?.loadRecords()
    }
  }

  destroy(): void {
    this.articlesView?.destroy()
    this.okrView?.destroy()
    this.dailyReportView?.destroy()
    this.publishHistoryView?.destroy()
    this.container.innerHTML = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 应用主类
// ─────────────────────────────────────────────────────────────────────────────

// 导出应用类
module.exports = class SocialMediaApp extends HelloClawApp {
  private view: SocialMediaView | null = null

  async onload() {
    console.log('[SocialMedia] 自媒体助手已加载')

    // 创建主视图
    const view = this.helloclaw.ui.createView({
      id: 'social-media-main',
      render: (container: HTMLElement) => {
        this.view = new SocialMediaView(container, this.helloclaw)
        this.view.render()
      },
      destroy: () => {
        this.view?.destroy()
        this.view = null
      },
    })

    // 注册命令
    this.helloclaw.workspace.registerCommand({
      id: 'social-media.new-article',
      name: '新建文章',
      callback: () => {
        this.helloclaw.workspace.openView('social-media-main')
        if (this.view) {
          this.view.render()
        }
      },
    })

    this.helloclaw.workspace.registerCommand({
      id: 'social-media.publish',
      name: '快速发布',
      callback: () => {
        this.helloclaw.workspace.openView('social-media-main')
      },
    })

    // 监听聊天消息
    this.helloclaw.chat.onMessage((msg: any) => {
      if (msg.role === 'assistant') {
        this.handleAIResponse(msg)
      }
    })
  }

  private handleAIResponse(msg: { content: string }): void {
    // 检查是否包含发布结果
    if (msg.content.includes('发布成功') || msg.content.includes('已发布')) {
      this.view?.render()
    }
  }

  onunload() {
    console.log('[SocialMedia] 自媒体助手已卸载')
    this.view?.destroy()
    this.view = null
  }
}
