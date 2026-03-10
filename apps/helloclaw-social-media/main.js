"use strict";
class ArticlesView {
  container;
  sdk;
  articles = [];
  parentView;
  constructor(container, sdk, parentView) {
    this.container = container;
    this.sdk = sdk;
    this.parentView = parentView;
  }
  async render() {
    this.container.innerHTML = `
      <div class="articles-view">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="total-articles">0</div>
            <div class="stat-label">\u6587\u7AE0\u603B\u6570</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="published-count">0</div>
            <div class="stat-label">\u5DF2\u53D1\u5E03</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="draft-count">0</div>
            <div class="stat-label">\u8349\u7A3F</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="scheduled-count">0</div>
            <div class="stat-label">\u5F85\u53D1\u5E03</div>
          </div>
        </div>

        <div class="articles-section">
          <div class="section-header">
            <h2>\u6587\u7AE0\u5217\u8868</h2>
            <button id="new-article-btn" class="btn-primary">\u65B0\u5EFA\u6587\u7AE0</button>
          </div>
          <div id="articles-list" class="articles-list">
            <div class="loading">\u52A0\u8F7D\u4E2D...</div>
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
    await this.loadArticles();
  }
  bindEvents() {
    const newArticleBtn = this.container.querySelector("#new-article-btn");
    newArticleBtn?.addEventListener("click", () => this.createNewArticle());
  }
  async loadArticles() {
    const listEl = this.container.querySelector("#articles-list");
    if (!listEl) return;
    try {
      const entries = await this.sdk.storage.list("articles");
      this.articles = [];
      for (const entry of entries) {
        if (entry.path.endsWith(".md")) {
          try {
            const fm = await this.sdk.storage.readFrontmatter(`articles/${entry.path}`);
            this.articles.push({
              id: entry.path.replace(".md", ""),
              title: fm.title || "\u672A\u547D\u540D",
              status: fm.status || "draft",
              platforms: fm.platforms || [],
              created: fm.created || "\u672A\u77E5"
            });
          } catch {
          }
        }
      }
      this.renderArticlesList();
      this.updateStats();
    } catch (err) {
      console.error("[SocialMedia] \u52A0\u8F7D\u6587\u7AE0\u5931\u8D25:", err);
      listEl.innerHTML = '<div class="error">\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5</div>';
    }
  }
  renderArticlesList() {
    const listEl = this.container.querySelector("#articles-list");
    if (!listEl) return;
    if (this.articles.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>\u6682\u65E0\u6587\u7AE0</p>
          <p class="hint">\u70B9\u51FB"\u65B0\u5EFA\u6587\u7AE0"\u5F00\u59CB\u521B\u4F5C</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = this.articles.map(
      (article) => `
      <div class="article-card" data-id="${article.id}">
        <div class="article-info">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span class="status status-${article.status}">${this.getStatusLabel(article.status)}</span>
            <span>${article.created}</span>
            ${article.platforms.length > 0 ? `<span>${article.platforms.join(", ")}</span>` : ""}
          </div>
        </div>
        <div class="article-actions">
          <button class="btn-icon btn-edit" title="\u7F16\u8F91">\u270F\uFE0F</button>
          <button class="btn-icon btn-publish" title="\u53D1\u5E03">\u{1F4E4}</button>
          <button class="btn-icon btn-delete" title="\u5220\u9664">\u{1F5D1}\uFE0F</button>
        </div>
      </div>
    `
    ).join("");
    listEl.querySelectorAll(".article-card").forEach((card) => {
      const id = card.dataset.id;
      card.querySelector(".btn-edit")?.addEventListener("click", () => this.editArticle(id));
      card.querySelector(".btn-publish")?.addEventListener("click", () => this.publishArticle(id));
      card.querySelector(".btn-delete")?.addEventListener("click", () => this.deleteArticle(id));
    });
  }
  updateStats() {
    const totalEl = this.container.querySelector("#total-articles");
    const publishedEl = this.container.querySelector("#published-count");
    const draftEl = this.container.querySelector("#draft-count");
    const scheduledEl = this.container.querySelector("#scheduled-count");
    if (totalEl) totalEl.textContent = String(this.articles.length);
    if (publishedEl)
      publishedEl.textContent = String(this.articles.filter((a) => a.status === "published").length);
    if (draftEl)
      draftEl.textContent = String(this.articles.filter((a) => a.status === "draft").length);
    if (scheduledEl)
      scheduledEl.textContent = String(this.articles.filter((a) => a.status === "scheduled").length);
  }
  getStatusLabel(status) {
    const labels = {
      draft: "\u8349\u7A3F",
      published: "\u5DF2\u53D1\u5E03",
      scheduled: "\u5F85\u53D1\u5E03"
    };
    return labels[status] || status;
  }
  async createNewArticle() {
    this.sdk.ui.showModal({
      title: "\u65B0\u5EFA\u6587\u7AE0",
      content: `
        <div class="form-group">
          <label for="article-title">\u6587\u7AE0\u6807\u9898</label>
          <input type="text" id="article-title" placeholder="\u8BF7\u8F93\u5165\u6587\u7AE0\u6807\u9898" />
        </div>
      `,
      confirmText: "\u521B\u5EFA",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        const titleInput = document.getElementById("article-title");
        const title = titleInput?.value?.trim();
        if (!title) {
          this.sdk.ui.showNotice("\u8BF7\u8F93\u5165\u6587\u7AE0\u6807\u9898", "error");
          return;
        }
        const id = `article-${Date.now()}`;
        const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const content = `---
title: "${title}"
created: "${now}"
status: draft
platforms: []
---

# ${title}

\u5728\u8FD9\u91CC\u5F00\u59CB\u5199\u4F5C...
`;
        try {
          await this.sdk.storage.write(`articles/${id}.md`, content);
          this.sdk.ui.showNotice("\u6587\u7AE0\u521B\u5EFA\u6210\u529F", "success");
          await this.loadArticles();
        } catch (err) {
          console.error("[SocialMedia] \u521B\u5EFA\u6587\u7AE0\u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u521B\u5EFA\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  editArticle(id) {
    this.sdk.ui.showNotice("\u7F16\u8F91\u529F\u80FD\u5F00\u53D1\u4E2D...", "info");
  }
  async publishArticle(id) {
    const article = this.articles.find((a) => a.id === id);
    const articleTitle = article?.title || id;
    this.sdk.ui.showModal({
      title: "\u53D1\u5E03\u6587\u7AE0",
      content: `
        <div class="form-group">
          <label>\u9009\u62E9\u53D1\u5E03\u5E73\u53F0</label>
          <div class="checkbox-group">
            <label><input type="checkbox" value="wechat" /> \u5FAE\u4FE1\u516C\u4F17\u53F7</label>
            <label><input type="checkbox" value="weibo" /> \u65B0\u6D6A\u5FAE\u535A</label>
            <label><input type="checkbox" value="zhihu" /> \u77E5\u4E4E</label>
            <label><input type="checkbox" value="toutiao" /> \u4ECA\u65E5\u5934\u6761</label>
          </div>
        </div>
      `,
      confirmText: "\u53D1\u5E03",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        const checkboxes = document.querySelectorAll(".checkbox-group input:checked");
        const platforms = Array.from(checkboxes).map((cb) => cb.value);
        if (platforms.length === 0) {
          this.sdk.ui.showNotice("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5E73\u53F0", "error");
          return;
        }
        const platformLabels = {
          wechat: "\u5FAE\u4FE1\u516C\u4F17\u53F7",
          weibo: "\u65B0\u6D6A\u5FAE\u535A",
          zhihu: "\u77E5\u4E4E",
          toutiao: "\u4ECA\u65E5\u5934\u6761"
        };
        try {
          await this.savePublishRecords(id, articleTitle, platforms, platformLabels);
          await this.sdk.chat.send(
            `\u8BF7\u5C06\u6587\u7AE0 ${id} \u53D1\u5E03\u5230\u4EE5\u4E0B\u5E73\u53F0\uFF1A${platforms.join(", ")}

\u4F7F\u7528 publish_article \u6280\u80FD\u6267\u884C\u53D1\u5E03\u64CD\u4F5C\u3002`
          );
          this.sdk.ui.showNotice("\u6B63\u5728\u53D1\u5E03...", "info");
          this.parentView.refreshPublishHistory();
        } catch (err) {
          console.error("[SocialMedia] \u53D1\u5E03\u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u53D1\u5E03\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  async savePublishRecords(articleId, articleTitle, platforms, platformLabels) {
    const records = await this.loadPublishRecords();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const platform of platforms) {
      records.push({
        id: `pub-${Date.now()}-${platform}`,
        articleId,
        articleTitle,
        platform,
        platformLabel: platformLabels[platform] || platform,
        publishedAt: now,
        status: "pending"
      });
    }
    await this.sdk.storage.write("publish-records.json", JSON.stringify(records, null, 2));
  }
  async loadPublishRecords() {
    try {
      const content = await this.sdk.storage.read("publish-records.json");
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  async deleteArticle(id) {
    this.sdk.ui.showModal({
      title: "\u5220\u9664\u6587\u7AE0",
      content: "<p>\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u7BC7\u6587\u7AE0\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002</p>",
      confirmText: "\u5220\u9664",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        try {
          await this.sdk.storage.delete(`articles/${id}.md`);
          this.sdk.ui.showNotice("\u6587\u7AE0\u5DF2\u5220\u9664", "success");
          await this.loadArticles();
        } catch (err) {
          console.error("[SocialMedia] \u5220\u9664\u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  destroy() {
    this.container.innerHTML = "";
  }
}
class OKRView {
  container;
  sdk;
  okrs = [];
  constructor(container, sdk) {
    this.container = container;
    this.sdk = sdk;
  }
  async render() {
    this.container.innerHTML = `
      <div class="okr-view">
        <div class="section-header">
          <h2>OKR \u7BA1\u7406</h2>
          <button id="new-okr-btn" class="btn-primary">\u65B0\u5EFA OKR</button>
        </div>
        <div id="okr-list" class="okr-list">
          <div class="loading">\u52A0\u8F7D\u4E2D...</div>
        </div>
      </div>
    `;
    this.bindEvents();
    await this.loadOKRs();
  }
  bindEvents() {
    const newOkrBtn = this.container.querySelector("#new-okr-btn");
    newOkrBtn?.addEventListener("click", () => this.createNewOKR());
  }
  async loadOKRs() {
    const listEl = this.container.querySelector("#okr-list");
    if (!listEl) return;
    try {
      const entries = await this.sdk.storage.list("okr");
      this.okrs = [];
      for (const entry of entries) {
        if (entry.path.endsWith(".md")) {
          try {
            const fm = await this.sdk.storage.readFrontmatter(`okr/${entry.path}`);
            this.okrs.push({
              id: fm.id || entry.path.replace(".md", ""),
              title: fm.title || "\u672A\u547D\u540D OKR",
              period: fm.period || "",
              status: fm.status || "active",
              created: fm.created || "",
              objectives: fm.objectives || []
            });
          } catch {
          }
        }
      }
      this.okrs.sort((a, b) => b.period.localeCompare(a.period));
      this.renderOKRList();
    } catch (err) {
      console.error("[SocialMedia] \u52A0\u8F7D OKR \u5931\u8D25:", err);
      listEl.innerHTML = '<div class="error">\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5</div>';
    }
  }
  renderOKRList() {
    const listEl = this.container.querySelector("#okr-list");
    if (!listEl) return;
    if (this.okrs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>\u6682\u65E0 OKR</p>
          <p class="hint">\u70B9\u51FB"\u65B0\u5EFA OKR"\u5F00\u59CB\u5236\u5B9A\u76EE\u6807</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = this.okrs.map(
      (okr) => `
      <div class="okr-card" data-id="${okr.id}">
        <div class="okr-header">
          <div class="okr-title-row">
            <h3 class="okr-title">${okr.title}</h3>
            <span class="status status-${okr.status}">${this.getStatusLabel(okr.status)}</span>
          </div>
          <div class="okr-meta">
            <span>\u5468\u671F\uFF1A${okr.period}</span>
            <span>\u521B\u5EFA\u4E8E\uFF1A${okr.created}</span>
          </div>
        </div>
        <div class="objectives-list">
          ${okr.objectives.map(
        (obj) => `
            <div class="objective-item">
              <div class="objective-header">
                <span class="objective-icon">\u{1F3AF}</span>
                <span class="objective-title">${obj.title}</span>
              </div>
              <div class="key-results-list">
                ${obj.keyResults.map(
          (kr) => `
                  <div class="key-result-item" data-okr="${okr.id}" data-obj="${obj.id}" data-kr="${kr.id}">
                    <div class="kr-info">
                      <span class="kr-title">${kr.title}</span>
                      <span class="kr-progress-text">${kr.current} / ${kr.target} ${kr.unit}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${Math.min(100, kr.current / kr.target * 100)}%"></div>
                    </div>
                    <div class="kr-actions">
                      <button class="btn-icon btn-update-kr" title="\u66F4\u65B0\u8FDB\u5EA6">\u{1F4CA}</button>
                    </div>
                  </div>
                `
        ).join("")}
              </div>
            </div>
          `
      ).join("")}
        </div>
        <div class="okr-actions">
          <button class="btn-icon btn-delete-okr" title="\u5220\u9664 OKR">\u{1F5D1}\uFE0F</button>
        </div>
      </div>
    `
    ).join("");
    listEl.querySelectorAll(".btn-update-kr").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = btn.closest(".key-result-item");
        const okrId = item?.dataset.okr;
        const objId = item?.dataset.obj;
        const krId = item?.dataset.kr;
        if (okrId && objId && krId) this.updateKRProgress(okrId, objId, krId);
      });
    });
    listEl.querySelectorAll(".btn-delete-okr").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".okr-card");
        const okrId = card?.dataset.id;
        if (okrId) this.deleteOKR(okrId);
      });
    });
  }
  getStatusLabel(status) {
    const labels = {
      active: "\u8FDB\u884C\u4E2D",
      completed: "\u5DF2\u5B8C\u6210",
      archived: "\u5DF2\u5F52\u6863"
    };
    return labels[status] || status;
  }
  async createNewOKR() {
    const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const quarter = Math.ceil(((/* @__PURE__ */ new Date()).getMonth() + 1) / 3);
    this.sdk.ui.showModal({
      title: "\u65B0\u5EFA OKR",
      content: `
        <div class="form-group">
          <label for="okr-title">OKR \u6807\u9898</label>
          <input type="text" id="okr-title" placeholder="\u4F8B\u5982\uFF1A2024 Q1 \u76EE\u6807" value="${year} Q${quarter} \u76EE\u6807" />
        </div>
        <div class="form-group">
          <label for="okr-period">\u5468\u671F</label>
          <input type="text" id="okr-period" placeholder="\u4F8B\u5982\uFF1A2024-Q1" value="${year}-Q${quarter}" />
        </div>
        <div class="form-group">
          <label>\u7B2C\u4E00\u4E2A\u76EE\u6807</label>
          <input type="text" id="obj-title" placeholder="\u76EE\u6807\u540D\u79F0" />
        </div>
        <div class="form-group">
          <label>\u5173\u952E\u7ED3\u679C 1</label>
          <div class="kr-input-row">
            <input type="text" id="kr-title" placeholder="\u5173\u952E\u7ED3\u679C\u63CF\u8FF0" style="flex: 2" />
            <input type="number" id="kr-target" placeholder="\u76EE\u6807\u503C" style="flex: 1" />
            <input type="text" id="kr-unit" placeholder="\u5355\u4F4D" style="flex: 1" />
          </div>
        </div>
      `,
      confirmText: "\u521B\u5EFA",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        const title = document.getElementById("okr-title")?.value?.trim();
        const period = document.getElementById("okr-period")?.value?.trim();
        const objTitle = document.getElementById("obj-title")?.value?.trim();
        const krTitle = document.getElementById("kr-title")?.value?.trim();
        const krTarget = document.getElementById("kr-target")?.value;
        const krUnit = document.getElementById("kr-unit")?.value?.trim();
        if (!title || !period) {
          this.sdk.ui.showNotice("\u8BF7\u586B\u5199 OKR \u6807\u9898\u548C\u5468\u671F", "error");
          return;
        }
        const id = `okr-${Date.now()}`;
        const objectives = [];
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
                unit: krUnit || "\u4E2A"
              }
            ]
          });
        }
        const content = `---
id: "${id}"
title: "${title}"
period: "${period}"
status: active
created: "${now}"
objectives:
${objectives.map(
          (obj) => `  - id: ${obj.id}
    title: "${obj.title}"
    keyResults:
${obj.keyResults.map(
            (kr) => `      - id: ${kr.id}
        title: "${kr.title}"
        target: ${kr.target}
        current: ${kr.current}
        unit: "${kr.unit}"
  `
          ).join("\n")}
  `
        ).join("\n")}
---

# ${title}

## \u76EE\u6807\u4E0E\u5173\u952E\u7ED3\u679C

${objectives.map(
          (obj) => `### ${obj.title}

${obj.keyResults.map((kr) => `- [ ] ${kr.title} (${kr.current}/${kr.target} ${kr.unit})`).join("\n")}
  `
        ).join("\n\n")}
`;
        try {
          await this.sdk.storage.write(`okr/${id}.md`, content);
          this.sdk.ui.showNotice("OKR \u521B\u5EFA\u6210\u529F", "success");
          await this.loadOKRs();
        } catch (err) {
          console.error("[SocialMedia] \u521B\u5EFA OKR \u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u521B\u5EFA\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  async updateKRProgress(okrId, objId, krId) {
    const okr = this.okrs.find((o) => o.id === okrId);
    const obj = okr?.objectives.find((o) => o.id === objId);
    const kr = obj?.keyResults.find((k) => k.id === krId);
    if (!kr) return;
    this.sdk.ui.showModal({
      title: "\u66F4\u65B0\u5173\u952E\u7ED3\u679C\u8FDB\u5EA6",
      content: `
        <div class="form-group">
          <label>${kr.title}</label>
          <p class="kr-current-status">\u5F53\u524D\u8FDB\u5EA6\uFF1A${kr.current} / ${kr.target} ${kr.unit}</p>
          <div class="progress-bar large">
            <div class="progress-fill" style="width: ${Math.min(100, kr.current / kr.target * 100)}%"></div>
          </div>
        </div>
        <div class="form-group">
          <label for="new-progress">\u65B0\u7684\u5F53\u524D\u503C</label>
          <input type="number" id="new-progress" value="${kr.current}" min="0" max="${kr.target * 2}" />
          <p class="hint">\u76EE\u6807\u503C\uFF1A${kr.target} ${kr.unit}</p>
        </div>
      `,
      confirmText: "\u66F4\u65B0",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        const newValue = parseInt(
          document.getElementById("new-progress")?.value || "0"
        );
        try {
          kr.current = newValue;
          await this.saveOKR(okr);
          this.sdk.ui.showNotice("\u8FDB\u5EA6\u5DF2\u66F4\u65B0", "success");
          await this.loadOKRs();
        } catch (err) {
          console.error("[SocialMedia] \u66F4\u65B0\u8FDB\u5EA6\u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  async saveOKR(okr) {
    const content = `---
id: "${okr.id}"
title: "${okr.title}"
period: "${okr.period}"
status: ${okr.status}
created: "${okr.created}"
objectives:
${okr.objectives.map(
      (obj) => `  - id: ${obj.id}
    title: "${obj.title}"
    keyResults:
${obj.keyResults.map(
        (kr) => `      - id: ${kr.id}
        title: "${kr.title}"
        target: ${kr.target}
        current: ${kr.current}
        unit: "${kr.unit}"
  `
      ).join("\n")}
  `
    ).join("\n")}
---

# ${okr.title}

## \u76EE\u6807\u4E0E\u5173\u952E\u7ED3\u679C

${okr.objectives.map(
      (obj) => `### ${obj.title}

${obj.keyResults.map((kr) => `- [${kr.current >= kr.target ? "x" : " "}] ${kr.title} (${kr.current}/${kr.target} ${kr.unit})`).join("\n")}
  `
    ).join("\n\n")}
`;
    await this.sdk.storage.write(`okr/${okr.id}.md`, content);
  }
  async deleteOKR(id) {
    this.sdk.ui.showModal({
      title: "\u5220\u9664 OKR",
      content: "<p>\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A OKR \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002</p>",
      confirmText: "\u5220\u9664",
      cancelText: "\u53D6\u6D88",
      onConfirm: async () => {
        try {
          await this.sdk.storage.delete(`okr/${id}.md`);
          this.sdk.ui.showNotice("OKR \u5DF2\u5220\u9664", "success");
          await this.loadOKRs();
        } catch (err) {
          console.error("[SocialMedia] \u5220\u9664\u5931\u8D25:", err);
          this.sdk.ui.showNotice("\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", "error");
        }
      }
    });
  }
  destroy() {
    this.container.innerHTML = "";
  }
}
class DailyReportView {
  container;
  sdk;
  reports = [];
  constructor(container, sdk) {
    this.container = container;
    this.sdk = sdk;
  }
  async render() {
    this.container.innerHTML = `
      <div class="daily-report-view">
        <div class="section-header">
          <h2>\u65E5\u62A5\u8BB0\u5F55</h2>
          <span class="hint-text">AI \u81EA\u52A8\u751F\u6210\uFF0C\u53EA\u8BFB\u5C55\u793A</span>
        </div>
        <div id="report-list" class="report-list">
          <div class="loading">\u52A0\u8F7D\u4E2D...</div>
        </div>
      </div>
    `;
    await this.loadReports();
  }
  async loadReports() {
    const listEl = this.container.querySelector("#report-list");
    if (!listEl) return;
    try {
      const entries = await this.sdk.storage.list("daily-reports");
      this.reports = [];
      for (const entry of entries) {
        if (entry.path.endsWith(".md")) {
          try {
            const content = await this.sdk.storage.read(`daily-reports/${entry.path}`);
            const fm = await this.sdk.storage.readFrontmatter(`daily-reports/${entry.path}`);
            this.reports.push({
              date: fm.date || entry.path.replace(".md", ""),
              generatedAt: fm.generatedAt || "",
              content
            });
          } catch {
          }
        }
      }
      this.reports.sort((a, b) => b.date.localeCompare(a.date));
      this.renderReportList();
    } catch (err) {
      console.error("[SocialMedia] \u52A0\u8F7D\u65E5\u62A5\u5931\u8D25:", err);
      listEl.innerHTML = '<div class="error">\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5</div>';
    }
  }
  renderReportList() {
    const listEl = this.container.querySelector("#report-list");
    if (!listEl) return;
    if (this.reports.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>\u6682\u65E0\u65E5\u62A5\u8BB0\u5F55</p>
          <p class="hint">\u65E5\u62A5\u7531 AI \u5728\u6BCF\u65E5\u7ED3\u675F\u65F6\u81EA\u52A8\u751F\u6210</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = this.reports.map(
      (report) => `
      <div class="report-card" data-date="${report.date}">
        <div class="report-header">
          <h3 class="report-date">\u{1F4C5} ${this.formatDate(report.date)}</h3>
          <span class="report-generated">\u751F\u6210\u4E8E ${this.formatDateTime(report.generatedAt)}</span>
        </div>
        <div class="report-content preview">
          ${this.getPreviewText(report.content)}
        </div>
        <button class="btn-secondary btn-view-full">\u67E5\u770B\u5B8C\u6574\u65E5\u62A5</button>
      </div>
    `
    ).join("");
    listEl.querySelectorAll(".btn-view-full").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".report-card");
        const date = card?.dataset.date;
        const report = this.reports.find((r) => r.date === date);
        if (report) this.showReportDetail(report);
      });
    });
  }
  getPreviewText(content) {
    const lines = content.split("\n");
    const bodyStart = lines.findIndex((l) => l.startsWith("---", 1));
    const body = lines.slice(bodyStart + 1).join("\n");
    return body.slice(0, 200) + (body.length > 200 ? "..." : "");
  }
  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      });
    } catch {
      return dateStr;
    }
  }
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "\u672A\u77E5";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString("zh-CN");
    } catch {
      return dateTimeStr;
    }
  }
  showReportDetail(report) {
    this.sdk.ui.showModal({
      title: `\u65E5\u62A5 - ${this.formatDate(report.date)}`,
      content: `<div class="report-detail">${this.renderMarkdown(report.content)}</div>`,
      confirmText: "\u5173\u95ED",
      showCancel: false
    });
  }
  renderMarkdown(content) {
    const lines = content.split("\n");
    const bodyStart = lines.findIndex((l) => l.startsWith("---", 1));
    const body = lines.slice(bodyStart + 1).join("\n");
    return body.replace(/^### (.+)$/gm, "<h4>$1</h4>").replace(/^## (.+)$/gm, "<h3>$1</h3>").replace(/^# (.+)$/gm, "<h2>$1</h2>").replace(/^- (.+)$/gm, "<li>$1</li>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
  }
  destroy() {
    this.container.innerHTML = "";
  }
}
class PublishHistoryView {
  container;
  sdk;
  records = [];
  filterPlatform = "all";
  constructor(container, sdk) {
    this.container = container;
    this.sdk = sdk;
  }
  async render() {
    this.container.innerHTML = `
      <div class="publish-history-view">
        <div class="section-header">
          <h2>\u53D1\u5E03\u5386\u53F2</h2>
          <div class="filter-group">
            <label>\u5E73\u53F0\u7B5B\u9009\uFF1A</label>
            <select id="platform-filter" class="filter-select">
              <option value="all">\u5168\u90E8\u5E73\u53F0</option>
              <option value="wechat">\u5FAE\u4FE1\u516C\u4F17\u53F7</option>
              <option value="weibo">\u65B0\u6D6A\u5FAE\u535A</option>
              <option value="zhihu">\u77E5\u4E4E</option>
              <option value="toutiao">\u4ECA\u65E5\u5934\u6761</option>
            </select>
          </div>
        </div>
        <div id="history-list" class="history-list">
          <div class="loading">\u52A0\u8F7D\u4E2D...</div>
        </div>
      </div>
    `;
    this.bindEvents();
    await this.loadRecords();
  }
  bindEvents() {
    const filterSelect = this.container.querySelector("#platform-filter");
    filterSelect?.addEventListener("change", (e) => {
      this.filterPlatform = e.target.value;
      this.renderHistoryList();
    });
  }
  async loadRecords() {
    const listEl = this.container.querySelector("#history-list");
    if (!listEl) return;
    try {
      const content = await this.sdk.storage.read("publish-records.json");
      this.records = JSON.parse(content);
      this.records.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      this.renderHistoryList();
    } catch {
      this.records = [];
      this.renderHistoryList();
    }
  }
  renderHistoryList() {
    const listEl = this.container.querySelector("#history-list");
    if (!listEl) return;
    const filteredRecords = this.filterPlatform === "all" ? this.records : this.records.filter((r) => r.platform === this.filterPlatform);
    if (filteredRecords.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>\u6682\u65E0\u53D1\u5E03\u8BB0\u5F55</p>
          <p class="hint">\u53D1\u5E03\u6587\u7AE0\u540E\u4F1A\u81EA\u52A8\u8BB0\u5F55\u5230\u8FD9\u91CC</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = filteredRecords.map(
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
        ${record.url ? `
          <div class="history-actions">
            <a href="${record.url}" target="_blank" class="btn-secondary">\u67E5\u770B\u53D1\u5E03</a>
          </div>
        ` : ""}
      </div>
    `
    ).join("");
  }
  getStatusLabel(status) {
    const labels = {
      success: "\u53D1\u5E03\u6210\u529F",
      failed: "\u53D1\u5E03\u5931\u8D25",
      pending: "\u53D1\u5E03\u4E2D"
    };
    return labels[status] || status;
  }
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "\u672A\u77E5";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString("zh-CN");
    } catch {
      return dateTimeStr;
    }
  }
  destroy() {
    this.container.innerHTML = "";
  }
}
class SocialMediaView {
  container;
  sdk;
  currentTab = "articles";
  tabContent = null;
  articlesView = null;
  okrView = null;
  dailyReportView = null;
  publishHistoryView = null;
  constructor(container, sdk) {
    this.container = container;
    this.sdk = sdk;
  }
  async render() {
    this.container.innerHTML = `
      <div class="social-media-app">
        <header class="app-header">
          <h1>\u81EA\u5A92\u4F53\u52A9\u624B</h1>
          <div class="header-actions">
            <button id="refresh-btn" class="btn-secondary">\u5237\u65B0</button>
          </div>
        </header>

        <nav class="tab-nav">
          <button class="tab-btn active" data-tab="articles">\u6587\u7AE0</button>
          <button class="tab-btn" data-tab="okr">OKR</button>
          <button class="tab-btn" data-tab="daily-reports">\u65E5\u62A5</button>
          <button class="tab-btn" data-tab="publish-history">\u53D1\u5E03\u5386\u53F2</button>
        </nav>

        <main class="app-main">
          <div id="tab-content" class="tab-content"></div>
        </main>
      </div>
    `;
    this.tabContent = this.container.querySelector("#tab-content");
    this.bindEvents();
    await this.switchTab(this.currentTab);
  }
  bindEvents() {
    const refreshBtn = this.container.querySelector("#refresh-btn");
    refreshBtn?.addEventListener("click", () => this.refreshCurrentTab());
    this.container.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }
  async switchTab(tabId) {
    this.container.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    this.currentTab = tabId;
    this.articlesView?.destroy();
    this.okrView?.destroy();
    this.dailyReportView?.destroy();
    this.publishHistoryView?.destroy();
    if (!this.tabContent) return;
    switch (tabId) {
      case "articles":
        this.articlesView = new ArticlesView(this.tabContent, this.sdk, this);
        await this.articlesView.render();
        break;
      case "okr":
        this.okrView = new OKRView(this.tabContent, this.sdk);
        await this.okrView.render();
        break;
      case "daily-reports":
        this.dailyReportView = new DailyReportView(this.tabContent, this.sdk);
        await this.dailyReportView.render();
        break;
      case "publish-history":
        this.publishHistoryView = new PublishHistoryView(this.tabContent, this.sdk);
        await this.publishHistoryView.render();
        break;
    }
  }
  refreshCurrentTab() {
    switch (this.currentTab) {
      case "articles":
        this.articlesView?.loadArticles();
        break;
      case "okr":
        this.okrView?.loadOKRs();
        break;
      case "daily-reports":
        this.dailyReportView?.loadReports();
        break;
      case "publish-history":
        this.publishHistoryView?.loadRecords();
        break;
    }
  }
  refreshPublishHistory() {
    if (this.currentTab === "publish-history") {
      this.publishHistoryView?.loadRecords();
    }
  }
  destroy() {
    this.articlesView?.destroy();
    this.okrView?.destroy();
    this.dailyReportView?.destroy();
    this.publishHistoryView?.destroy();
    this.container.innerHTML = "";
  }
}
module.exports = class SocialMediaApp extends HelloClawApp {
  view = null;
  async onload() {
    console.log("[SocialMedia] \u81EA\u5A92\u4F53\u52A9\u624B\u5DF2\u52A0\u8F7D");
    const view = this.helloclaw.ui.createView({
      id: "social-media-main",
      render: (container) => {
        this.view = new SocialMediaView(container, this.helloclaw);
        this.view.render();
      },
      destroy: () => {
        this.view?.destroy();
        this.view = null;
      }
    });
    this.helloclaw.workspace.registerCommand({
      id: "social-media.new-article",
      name: "\u65B0\u5EFA\u6587\u7AE0",
      callback: () => {
        this.helloclaw.workspace.openView("social-media-main");
        if (this.view) {
          this.view.render();
        }
      }
    });
    this.helloclaw.workspace.registerCommand({
      id: "social-media.publish",
      name: "\u5FEB\u901F\u53D1\u5E03",
      callback: () => {
        this.helloclaw.workspace.openView("social-media-main");
      }
    });
    this.helloclaw.chat.onMessage((msg) => {
      if (msg.role === "assistant") {
        this.handleAIResponse(msg);
      }
    });
  }
  handleAIResponse(msg) {
    if (msg.content.includes("\u53D1\u5E03\u6210\u529F") || msg.content.includes("\u5DF2\u53D1\u5E03")) {
      this.view?.render();
    }
  }
  onunload() {
    console.log("[SocialMedia] \u81EA\u5A92\u4F53\u52A9\u624B\u5DF2\u5378\u8F7D");
    this.view?.destroy();
    this.view = null;
  }
};
