"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);
const PLATFORM_OPTIONS = [
  { id: "wechat", label: "\u5FAE\u4FE1\u516C\u4F17\u53F7", hint: "\u6DF1\u5EA6\u957F\u6587 / \u54C1\u724C\u6C89\u6DC0" },
  { id: "xiaohongshu", label: "\u5C0F\u7EA2\u4E66", hint: "\u53E3\u8BED\u5316\u79CD\u8349 / \u6536\u85CF\u5BFC\u5411" },
  { id: "zhihu", label: "\u77E5\u4E4E", hint: "\u95EE\u9898\u5BFC\u5411 / \u6848\u4F8B\u8BBA\u8BC1" },
  { id: "weibo", label: "\u5FAE\u535A", hint: "\u77ED\u89C2\u70B9 / \u70ED\u70B9\u8DDF\u8FDB" },
  { id: "douyin", label: "\u6296\u97F3\u811A\u672C", hint: "\u53E3\u64AD\u8282\u594F / \u955C\u5934\u62C6\u89E3" },
  { id: "newsletter", label: "Newsletter", hint: "\u79C1\u57DF\u6C89\u6DC0 / \u8F6C\u5316\u8DDF\u8FDB" }
];
const CONTENT_FORMATS = [
  { value: "article", label: "\u957F\u6587" },
  { value: "thread", label: "\u77ED\u5E16\u4E32" },
  { value: "video-script", label: "\u89C6\u9891\u811A\u672C" },
  { value: "newsletter", label: "\u90AE\u4EF6\u901A\u8BAF" },
  { value: "campaign", label: "\u8425\u9500\u4E13\u9898" }
];
const CONTENT_STAGES = [
  { value: "idea", label: "\u9009\u9898\u6C60" },
  { value: "planning", label: "\u7B56\u5212\u4E2D" },
  { value: "drafting", label: "\u521B\u4F5C\u4E2D" },
  { value: "review", label: "\u5F85\u5BA1\u6821" },
  { value: "ready", label: "\u5F85\u53D1\u5E03" },
  { value: "scheduled", label: "\u5DF2\u6392\u671F" },
  { value: "published", label: "\u5DF2\u53D1\u5E03" }
];
const OBJECTIVES = [
  { value: "growth", label: "\u589E\u957F\u62C9\u65B0" },
  { value: "trust", label: "\u5EFA\u7ACB\u4FE1\u4EFB" },
  { value: "conversion", label: "\u8F6C\u5316\u6210\u4EA4" },
  { value: "community", label: "\u793E\u7FA4\u8FD0\u8425" }
];
const REPORT_TYPES = {
  "daily-brief": "\u65E5\u62A5",
  "weekly-review": "\u5468\u590D\u76D8",
  "experiment-plan": "\u5B9E\u9A8C\u8BA1\u5212",
  "content-brief": "\u5185\u5BB9 Brief",
  "repurpose-pack": "\u6539\u5199\u5305",
  "publish-package": "\u53D1\u5E03\u5305",
  "manual-note": "\u8FD0\u8425\u7B14\u8BB0"
};
const STORAGE_PATHS = {
  settings: "meta/settings.json",
  contents: "content",
  analytics: "analytics",
  reports: "reports"
};
function createDefaultSettings() {
  return {
    operatorName: "",
    brandName: "\u5185\u5BB9\u589E\u957F\u5DE5\u4F5C\u53F0",
    primaryGoal: "\u7A33\u5B9A\u4EA7\u51FA\u9AD8\u8D28\u91CF\u5185\u5BB9\uFF0C\u5E76\u6301\u7EED\u63D0\u5347\u5206\u53D1\u6548\u7387\u4E0E\u8F6C\u5316",
    voice: "\u4E13\u4E1A\u3001\u771F\u8BDA\u3001\u5E26\u89C2\u70B9",
    defaultPlatforms: ["wechat", "xiaohongshu", "zhihu"],
    reportTz: "Asia/Shanghai",
    lastOpenedTab: "overview"
  };
}
function emptyMetrics() {
  return {
    impressions: 0,
    reads: 0,
    interactions: 0,
    saves: 0,
    shares: 0,
    leads: 0,
    conversions: 0,
    revenue: 0,
    followersGained: 0
  };
}
function uid(prefix) {
  const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`;
}
function todayIsoDate() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function nowTimestamp() {
  return Date.now();
}
function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}
function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}
function clipText(value, max = 180) {
  if (!value) {
    return "";
  }
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
function platformLabel(platformId) {
  return PLATFORM_OPTIONS.find((item) => item.id === platformId)?.label || platformId;
}
function formatLabel(value, options) {
  return options.find((item) => item.value === value)?.label || value;
}
function formatShortDate(value) {
  if (!value) {
    return "\u672A\u8BBE\u7F6E";
  }
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric"
  }).format(date);
}
function formatDateTime(value) {
  if (!value) {
    return "\u672A\u6392\u671F";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
function toneClassForStage(stage) {
  if (stage === "published") return "tone-success";
  if (stage === "ready" || stage === "scheduled") return "tone-accent";
  if (stage === "review") return "tone-warn";
  return "tone-muted";
}
function toneClassForPublishStatus(status) {
  if (status === "published") return "tone-success";
  if (status === "queued" || status === "ready") return "tone-accent";
  if (status === "failed") return "tone-danger";
  return "tone-muted";
}
function metricValue(sum) {
  if (Math.abs(sum) >= 1e6) {
    return `${(sum / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(sum) >= 1e3) {
    return `${(sum / 1e3).toFixed(1)}K`;
  }
  return String(Math.round(sum));
}
function isOverdue(dueDate, stage) {
  return Boolean(dueDate) && dueDate < todayIsoDate() && stage !== "published";
}
function buildDefaultCaption(content, platform) {
  const hook = content.hook || content.angle || content.title;
  return `${hook}

${content.cta || "\u6B22\u8FCE\u5728\u8BC4\u8BBA\u533A\u4EA4\u6D41\u4F60\u7684\u770B\u6CD5\u3002"}
#${platformLabel(platform)}`;
}
class SocialMediaOpsApp extends HelloClawApp {
  constructor() {
    super(...arguments);
    __publicField(this, "state", {
      initialized: false,
      activeTab: "overview",
      contentStageFilter: "all",
      contentPlatformFilter: "all",
      publishStatusFilter: "all",
      publishPlatformFilter: "all",
      selectedContentId: "",
      selectedReportId: "",
      settings: createDefaultSettings(),
      contents: [],
      analytics: [],
      reports: []
    });
    __publicField(this, "root", null);
    __publicField(this, "rootEventsBound", false);
    __publicField(this, "disposers", []);
    __publicField(this, "pendingCaptures", []);
    __publicField(this, "handleRootClick", (event) => {
      void this.onRootClick(event);
    });
    __publicField(this, "handleRootChange", (event) => {
      void this.onRootChange(event);
    });
  }
  async onload() {
    await this.reloadAllData();
    this.registerCommands();
    const unsubscribeChat = this.helloclaw.chat.onMessage((message) => {
      void this.handleChatMessage(message);
    });
    this.disposers.push(unsubscribeChat);
    this.helloclaw.ui.createView({
      id: this.viewId(),
      render: (container) => {
        this.root = container;
        this.ensureRootEvents();
        this.render();
      },
      destroy: () => {
        this.teardownRootEvents();
        this.root = null;
      }
    });
    this.updateSidebarBadge();
    this.helloclaw.ui.showNotice("\u5185\u5BB9\u589E\u957F\u5DE5\u4F5C\u53F0\u5DF2\u5C31\u7EEA", "success");
  }
  onunload() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    this.teardownRootEvents();
    this.pendingCaptures = [];
  }
  onSettingsRender(container) {
    const settings = this.state.settings;
    container.innerHTML = `
      <div class="hc-sm-settings">
        <div class="hc-sm-settings__header">
          <p class="hc-sm-eyebrow">Workspace Settings</p>
          <h2>\u5185\u5BB9\u589E\u957F\u5DE5\u4F5C\u53F0\u8BBE\u7F6E</h2>
          <p>\u914D\u7F6E\u4F60\u7684\u54C1\u724C\u4FE1\u606F\u3001\u9ED8\u8BA4\u5E73\u53F0\u548C\u590D\u76D8\u65F6\u533A\uFF0C\u5F71\u54CD\u65B0\u5EFA\u5185\u5BB9\u4E0E AI \u534F\u4F5C\u63D0\u793A\u8BCD\u3002</p>
        </div>
        <div class="hc-sm-settings__grid">
          <label>
            <span>\u64CD\u4F5C\u8005\u540D\u79F0</span>
            <input id="hc-settings-operator" value="${escapeHtml(settings.operatorName)}" placeholder="\u4F8B\u5982\uFF1AMina" />
          </label>
          <label>
            <span>\u54C1\u724C / \u8D26\u53F7\u540D\u79F0</span>
            <input id="hc-settings-brand" value="${escapeHtml(settings.brandName)}" placeholder="\u4F8B\u5982\uFF1A\u589E\u957F\u5B9E\u9A8C\u5BA4" />
          </label>
          <label>
            <span>\u4E3B\u8981\u76EE\u6807</span>
            <input id="hc-settings-goal" value="${escapeHtml(settings.primaryGoal)}" placeholder="\u4F8B\u5982\uFF1A\u63D0\u5347\u9AD8\u8D28\u91CF\u7EBF\u7D22\u4E0E\u590D\u8D2D" />
          </label>
          <label>
            <span>\u5185\u5BB9\u8BED\u6C14</span>
            <input id="hc-settings-voice" value="${escapeHtml(settings.voice)}" placeholder="\u4F8B\u5982\uFF1A\u4E13\u4E1A\u3001\u514B\u5236\u3001\u53EF\u4FE1" />
          </label>
          <label>
            <span>\u590D\u76D8\u65F6\u533A</span>
            <input id="hc-settings-tz" value="${escapeHtml(settings.reportTz)}" placeholder="Asia/Shanghai" />
          </label>
          <div class="hc-sm-settings__platforms">
            <span>\u9ED8\u8BA4\u53D1\u5E03\u5E73\u53F0</span>
            <div class="hc-sm-checklist">
              ${PLATFORM_OPTIONS.map((platform) => `
                <label class="hc-sm-check">
                  <input
                    type="checkbox"
                    data-settings-platform
                    value="${platform.id}"
                    ${settings.defaultPlatforms.includes(platform.id) ? "checked" : ""}
                  />
                  <strong>${platform.label}</strong>
                  <small>${platform.hint}</small>
                </label>
              `).join("")}
            </div>
          </div>
        </div>
        <div class="hc-sm-settings__actions">
          <button class="hc-btn hc-btn--primary" id="hc-settings-save">\u4FDD\u5B58\u8BBE\u7F6E</button>
        </div>
      </div>
    `;
    container.querySelector("#hc-settings-save")?.addEventListener("click", () => {
      void this.saveSettingsFromPanel(container);
    });
  }
  viewId() {
    return `${this.helloclaw.appId}-main`;
  }
  ensureRootEvents() {
    if (!this.root || this.rootEventsBound) {
      return;
    }
    this.root.addEventListener("click", this.handleRootClick);
    this.root.addEventListener("change", this.handleRootChange);
    this.rootEventsBound = true;
  }
  teardownRootEvents() {
    if (!this.root || !this.rootEventsBound) {
      return;
    }
    this.root.removeEventListener("click", this.handleRootClick);
    this.root.removeEventListener("change", this.handleRootChange);
    this.rootEventsBound = false;
  }
  async onRootClick(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    const actionable = target.closest("[data-action]");
    if (!actionable) {
      return;
    }
    const action = actionable.dataset.action;
    if (!action) {
      return;
    }
    if (action === "switch-tab") {
      const nextTab = actionable.dataset.tab || "overview";
      this.state.activeTab = nextTab;
      this.state.settings.lastOpenedTab = nextTab;
      await this.persistSettings();
      this.render();
      return;
    }
    if (action === "refresh-data") {
      await this.reloadAllData();
      this.render();
      this.helloclaw.ui.showNotice("\u5DF2\u91CD\u65B0\u52A0\u8F7D\u5185\u5BB9\u3001\u6570\u636E\u548C\u62A5\u544A", "success");
      return;
    }
    if (action === "new-content") {
      await this.createContent();
      return;
    }
    if (action === "select-content") {
      this.state.selectedContentId = actionable.dataset.contentId || "";
      this.render();
      return;
    }
    if (action === "save-content") {
      await this.saveSelectedContentFromForm();
      return;
    }
    if (action === "delete-content") {
      await this.deleteContent(actionable.dataset.contentId || this.state.selectedContentId);
      return;
    }
    if (action === "set-publish-status") {
      await this.updatePublishStatus(
        actionable.dataset.contentId || "",
        actionable.dataset.platform || "",
        actionable.dataset.status || ""
      );
      return;
    }
    if (action === "edit-publish-meta") {
      await this.editPublishMeta(
        actionable.dataset.contentId || "",
        actionable.dataset.platform || ""
      );
      return;
    }
    if (action === "run-ai") {
      await this.runAiAction(
        actionable.dataset.ai || "",
        actionable.dataset.contentId || "",
        actionable.dataset.platform || ""
      );
      return;
    }
    if (action === "save-snapshot") {
      await this.saveAnalyticsSnapshotFromForm();
      return;
    }
    if (action === "delete-snapshot") {
      await this.deleteSnapshot(actionable.dataset.snapshotId || "");
      return;
    }
    if (action === "select-report") {
      this.state.selectedReportId = actionable.dataset.reportId || "";
      this.render();
      return;
    }
    if (action === "save-manual-report") {
      await this.saveManualReportFromForm();
      return;
    }
    if (action === "delete-report") {
      await this.deleteReport(actionable.dataset.reportId || this.state.selectedReportId);
    }
  }
  async onRootChange(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    const filter = target.dataset.filter;
    if (!filter) {
      return;
    }
    if (filter === "content-stage") {
      this.state.contentStageFilter = target.value;
    }
    if (filter === "content-platform") {
      this.state.contentPlatformFilter = target.value;
    }
    if (filter === "publish-status") {
      this.state.publishStatusFilter = target.value;
    }
    if (filter === "publish-platform") {
      this.state.publishPlatformFilter = target.value;
    }
    this.render();
  }
  async saveSettingsFromPanel(container) {
    const operatorName = asString(container.querySelector("#hc-settings-operator")?.value);
    const brandName = asString(container.querySelector("#hc-settings-brand")?.value, "\u5185\u5BB9\u589E\u957F\u5DE5\u4F5C\u53F0");
    const primaryGoal = asString(container.querySelector("#hc-settings-goal")?.value);
    const voice = asString(container.querySelector("#hc-settings-voice")?.value);
    const reportTz = asString(container.querySelector("#hc-settings-tz")?.value, "Asia/Shanghai");
    const defaultPlatforms = Array.from(container.querySelectorAll("[data-settings-platform]:checked")).map((input) => input.value);
    this.state.settings = {
      ...this.state.settings,
      operatorName,
      brandName,
      primaryGoal,
      voice,
      reportTz,
      defaultPlatforms: defaultPlatforms.length > 0 ? defaultPlatforms : ["wechat", "xiaohongshu"]
    };
    await this.persistSettings();
    this.render();
    this.helloclaw.ui.showNotice("\u5DE5\u4F5C\u53F0\u8BBE\u7F6E\u5DF2\u4FDD\u5B58", "success");
  }
  async reloadAllData() {
    const [settings, contents, analytics, reports] = await Promise.all([
      this.readJson(STORAGE_PATHS.settings, createDefaultSettings()),
      this.loadCollection(STORAGE_PATHS.contents),
      this.loadCollection(STORAGE_PATHS.analytics),
      this.loadCollection(STORAGE_PATHS.reports)
    ]);
    const normalizedContents = contents.map((item) => this.hydrateContent(item)).sort((a, b) => b.updatedAt - a.updatedAt);
    const normalizedAnalytics = analytics.map((item) => this.hydrateAnalytics(item)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const normalizedReports = reports.map((item) => this.hydrateReport(item)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const initialTab = this.normalizeTab(settings.lastOpenedTab);
    const selectedContentId = normalizedContents.some((item) => item.id === this.state.selectedContentId) ? this.state.selectedContentId : normalizedContents[0]?.id || "";
    const selectedReportId = normalizedReports.some((item) => item.id === this.state.selectedReportId) ? this.state.selectedReportId : normalizedReports[0]?.id || "";
    this.state = {
      ...this.state,
      initialized: true,
      activeTab: this.state.initialized ? this.state.activeTab : initialTab,
      settings: {
        ...createDefaultSettings(),
        ...settings,
        lastOpenedTab: initialTab
      },
      contents: normalizedContents,
      analytics: normalizedAnalytics,
      reports: normalizedReports,
      selectedContentId,
      selectedReportId
    };
  }
  normalizeTab(value) {
    if (value === "pipeline" || value === "publish" || value === "analytics" || value === "reports") {
      return value;
    }
    return "overview";
  }
  hydrateContent(raw) {
    const targetPlatforms = uniqueStrings(asStringArray(raw.targetPlatforms));
    const scheduledAt = asString(raw.scheduledAt);
    const tasks = this.syncPublishTasks(raw.publishTasks, targetPlatforms, scheduledAt);
    return {
      id: asString(raw.id, uid("content")),
      title: asString(raw.title, "\u672A\u547D\u540D\u5185\u5BB9"),
      format: asString(raw.format, "article"),
      stage: asString(raw.stage, "idea"),
      pillar: asString(raw.pillar),
      objective: asString(raw.objective, "growth"),
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
        ...raw.metrics || {}
      },
      createdAt: asNumber(raw.createdAt) || nowTimestamp(),
      updatedAt: asNumber(raw.updatedAt) || nowTimestamp()
    };
  }
  hydrateAnalytics(raw) {
    return {
      id: asString(raw.id, uid("snapshot")),
      date: asString(raw.date, todayIsoDate()),
      platform: asString(raw.platform, "wechat"),
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
      createdAt: asNumber(raw.createdAt) || nowTimestamp()
    };
  }
  hydrateReport(raw) {
    return {
      id: asString(raw.id, uid("report")),
      type: asString(raw.type, "manual-note"),
      title: asString(raw.title, "\u672A\u547D\u540D\u62A5\u544A"),
      date: asString(raw.date, todayIsoDate()),
      source: asString(raw.source, "manual"),
      relatedContentId: asString(raw.relatedContentId),
      createdAt: asNumber(raw.createdAt) || nowTimestamp(),
      content: asString(raw.content)
    };
  }
  syncPublishTasks(existing, platforms, scheduledAt) {
    const taskMap = /* @__PURE__ */ new Map();
    if (Array.isArray(existing)) {
      existing.forEach((rawTask) => {
        if (!rawTask || typeof rawTask !== "object") {
          return;
        }
        const task = rawTask;
        const platform = asString(task.platform);
        if (!platform) {
          return;
        }
        taskMap.set(platform, {
          id: asString(task.id, uid(`publish-${platform}`)),
          platform,
          status: ["ready", "queued", "published", "failed"].includes(asString(task.status)) ? task.status : "draft",
          scheduledAt: asString(task.scheduledAt, scheduledAt),
          caption: asString(task.caption),
          url: asString(task.url),
          publishedAt: asString(task.publishedAt),
          lastAttemptAt: asString(task.lastAttemptAt)
        });
      });
    }
    return platforms.map((platform) => {
      const existingTask = taskMap.get(platform);
      if (existingTask) {
        return {
          ...existingTask,
          scheduledAt: existingTask.scheduledAt || scheduledAt
        };
      }
      return {
        id: uid(`publish-${platform}`),
        platform,
        status: "draft",
        scheduledAt,
        caption: "",
        url: "",
        publishedAt: "",
        lastAttemptAt: ""
      };
    });
  }
  async listSafe(dir) {
    try {
      return await this.helloclaw.storage.list(dir);
    } catch {
      return [];
    }
  }
  async loadCollection(dir) {
    const entries = await this.listSafe(dir);
    const items = [];
    for (const entry of entries) {
      if (entry.isDirectory || !entry.path.endsWith(".json")) {
        continue;
      }
      try {
        const content = await this.helloclaw.storage.read(`${dir}/${entry.path}`);
        items.push(JSON.parse(content));
      } catch {
      }
    }
    return items;
  }
  async readJson(path, fallback) {
    try {
      const content = await this.helloclaw.storage.read(path);
      return JSON.parse(content);
    } catch {
      return fallback;
    }
  }
  async writeJson(path, value) {
    await this.helloclaw.storage.write(path, JSON.stringify(value, null, 2));
  }
  async persistSettings() {
    await this.writeJson(STORAGE_PATHS.settings, this.state.settings);
  }
  async persistContent(content) {
    await this.writeJson(`${STORAGE_PATHS.contents}/${content.id}.json`, content);
  }
  async persistSnapshot(snapshot) {
    await this.writeJson(`${STORAGE_PATHS.analytics}/${snapshot.id}.json`, snapshot);
  }
  async persistReport(report) {
    await this.writeJson(`${STORAGE_PATHS.reports}/${report.id}.json`, report);
  }
  async createContent() {
    const now = nowTimestamp();
    const platforms = this.state.settings.defaultPlatforms.length > 0 ? this.state.settings.defaultPlatforms : ["wechat", "xiaohongshu"];
    const content = this.hydrateContent({
      id: uid("content"),
      title: "\u65B0\u7684\u5185\u5BB9\u5361",
      format: "article",
      stage: "idea",
      objective: "growth",
      targetPlatforms: platforms,
      publishTasks: platforms.map((platform) => ({
        id: uid(`publish-${platform}`),
        platform,
        status: "draft",
        scheduledAt: "",
        caption: "",
        url: "",
        publishedAt: "",
        lastAttemptAt: ""
      })),
      createdAt: now,
      updatedAt: now
    });
    await this.persistContent(content);
    await this.reloadAllData();
    this.state.selectedContentId = content.id;
    this.state.activeTab = "pipeline";
    this.render();
    this.helloclaw.ui.showNotice("\u5DF2\u521B\u5EFA\u65B0\u7684\u5185\u5BB9\u5361", "success");
  }
  getSelectedContent() {
    return this.state.contents.find((item) => item.id === this.state.selectedContentId) || null;
  }
  getSelectedReport() {
    return this.state.reports.find((item) => item.id === this.state.selectedReportId) || null;
  }
  getFilteredContents() {
    return this.state.contents.filter((item) => {
      const stageMatch = this.state.contentStageFilter === "all" || item.stage === this.state.contentStageFilter;
      const platformMatch = this.state.contentPlatformFilter === "all" || item.targetPlatforms.includes(this.state.contentPlatformFilter);
      return stageMatch && platformMatch;
    });
  }
  getPublishQueue() {
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
        dueDate: content.dueDate
      }));
    });
    return tasks.filter((task) => {
      const statusMatch = this.state.publishStatusFilter === "all" || task.status === this.state.publishStatusFilter;
      const platformMatch = this.state.publishPlatformFilter === "all" || task.platform === this.state.publishPlatformFilter;
      return statusMatch && platformMatch;
    }).sort((a, b) => {
      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return bTime - aTime;
    });
  }
  getOverviewStats() {
    const recentSnapshots = this.state.analytics.filter((item) => {
      const delta = nowTimestamp() - new Date(item.date).getTime();
      return delta <= 1e3 * 60 * 60 * 24 * 30;
    });
    const publishedCount = this.state.contents.filter((item) => item.stage === "published").length;
    const readyCount = this.state.contents.filter((item) => item.stage === "ready" || item.stage === "scheduled").length;
    const overdueCount = this.state.contents.filter((item) => isOverdue(item.dueDate, item.stage)).length;
    const totalImpressions = recentSnapshots.reduce((sum, item) => sum + item.impressions, 0);
    const totalLeads = recentSnapshots.reduce((sum, item) => sum + item.leads, 0);
    return [
      {
        label: "\u5185\u5BB9\u8D44\u4EA7",
        value: String(this.state.contents.length),
        note: `${publishedCount} \u6761\u5DF2\u53D1\u5E03\uFF0C${readyCount} \u6761\u5728\u6392\u671F\u5185`
      },
      {
        label: "\u8FD1 30 \u5929\u66DD\u5149",
        value: metricValue(totalImpressions),
        note: `${recentSnapshots.length} \u6761\u6570\u636E\u5FEB\u7167`
      },
      {
        label: "\u7EBF\u7D22 / \u8F6C\u5316",
        value: metricValue(totalLeads),
        note: `${this.state.analytics.reduce((sum, item) => sum + item.conversions, 0)} \u6B21\u8F6C\u5316\u8BB0\u5F55`
      },
      {
        label: "\u98CE\u9669\u9879",
        value: String(overdueCount),
        note: overdueCount > 0 ? "\u5B58\u5728\u903E\u671F\u672A\u53D1\u5E03\u5185\u5BB9" : "\u5F53\u524D\u6CA1\u6709\u903E\u671F\u5185\u5BB9"
      }
    ];
  }
  getPlatformSummary() {
    const map = /* @__PURE__ */ new Map();
    this.state.analytics.forEach((item) => {
      const current = map.get(item.platform) || { impressions: 0, interactions: 0, leads: 0 };
      current.impressions += item.impressions;
      current.interactions += item.interactions;
      current.leads += item.leads;
      map.set(item.platform, current);
    });
    return Array.from(map.entries()).map(([platform, summary]) => ({
      platform,
      impressions: summary.impressions,
      interactions: summary.interactions,
      leads: summary.leads
    })).sort((a, b) => b.impressions - a.impressions);
  }
  getUrgentPublishCount() {
    return this.state.contents.flatMap((item) => item.publishTasks.map((task) => ({ task, item }))).filter(({ task, item }) => {
      if (task.status === "published") {
        return false;
      }
      if (item.stage === "ready" || item.stage === "scheduled") {
        return true;
      }
      return isOverdue(item.dueDate, item.stage);
    }).length;
  }
  updateSidebarBadge() {
    this.helloclaw.ui.setSidebarBadge(this.getUrgentPublishCount());
  }
  async saveSelectedContentFromForm() {
    const content = this.getSelectedContent();
    if (!content || !this.root) {
      return;
    }
    const title = asString(this.root.querySelector("#hc-content-title")?.value, "\u672A\u547D\u540D\u5185\u5BB9");
    const format = asString(this.root.querySelector("#hc-content-format")?.value, "article");
    const stage = asString(this.root.querySelector("#hc-content-stage")?.value, "idea");
    const objective = asString(this.root.querySelector("#hc-content-objective")?.value, "growth");
    const pillar = asString(this.root.querySelector("#hc-content-pillar")?.value);
    const audience = asString(this.root.querySelector("#hc-content-audience")?.value);
    const angle = asString(this.root.querySelector("#hc-content-angle")?.value);
    const hook = asString(this.root.querySelector("#hc-content-hook")?.value);
    const cta = asString(this.root.querySelector("#hc-content-cta")?.value);
    const dueDate = asString(this.root.querySelector("#hc-content-due-date")?.value);
    const scheduledAt = asString(this.root.querySelector("#hc-content-scheduled-at")?.value);
    const keywords = uniqueStrings(
      asString(this.root.querySelector("#hc-content-keywords")?.value).split(",").map((item) => item.trim())
    );
    const targetPlatforms = uniqueStrings(
      Array.from(this.root.querySelectorAll("input[data-platform-checkbox]:checked")).map((input) => input.value)
    );
    const outline = asString(this.root.querySelector("#hc-content-outline")?.value);
    const body = asString(this.root.querySelector("#hc-content-body")?.value);
    const notes = asString(this.root.querySelector("#hc-content-notes")?.value);
    const publishTasks = this.syncPublishTasks(content.publishTasks, targetPlatforms, scheduledAt).map((task) => ({
      ...task,
      caption: task.caption || buildDefaultCaption(content, task.platform),
      status: stage === "ready" && task.status === "draft" ? "ready" : task.status
    }));
    const nextContent = {
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
      updatedAt: nowTimestamp()
    };
    await this.persistContent(nextContent);
    await this.reloadAllData();
    this.state.selectedContentId = nextContent.id;
    this.updateSidebarBadge();
    this.render();
    this.helloclaw.ui.showNotice("\u5185\u5BB9\u5361\u5DF2\u4FDD\u5B58", "success");
  }
  async deleteContent(contentId) {
    if (!contentId) {
      return;
    }
    if (typeof window !== "undefined" && !window.confirm("\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u5185\u5BB9\u5361\u5417\uFF1F\u76F8\u5173\u53D1\u5E03\u8BA1\u5212\u4E0D\u4F1A\u81EA\u52A8\u6062\u590D\u3002")) {
      return;
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.contents}/${contentId}.json`);
    await this.reloadAllData();
    this.updateSidebarBadge();
    this.render();
    this.helloclaw.ui.showNotice("\u5185\u5BB9\u5361\u5DF2\u5220\u9664", "success");
  }
  async updatePublishStatus(contentId, platform, status) {
    const content = this.state.contents.find((item) => item.id === contentId);
    if (!content) {
      return;
    }
    const nextTasks = content.publishTasks.map((task) => {
      if (task.platform !== platform) {
        return task;
      }
      return {
        ...task,
        status: ["draft", "ready", "queued", "published", "failed"].includes(status) ? status : task.status,
        publishedAt: status === "published" ? (/* @__PURE__ */ new Date()).toISOString() : task.publishedAt,
        lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    const publishedAll = nextTasks.length > 0 && nextTasks.every((task) => task.status === "published");
    const nextStage = publishedAll ? "published" : status === "queued" ? "scheduled" : content.stage;
    const nextContent = {
      ...content,
      stage: nextStage,
      publishTasks: nextTasks,
      updatedAt: nowTimestamp()
    };
    await this.persistContent(nextContent);
    await this.reloadAllData();
    this.updateSidebarBadge();
    this.render();
    this.helloclaw.ui.showNotice(`\u5DF2\u66F4\u65B0 ${platformLabel(platform)} \u53D1\u5E03\u72B6\u6001`, "success");
  }
  async editPublishMeta(contentId, platform) {
    const content = this.state.contents.find((item) => item.id === contentId);
    const task = content?.publishTasks.find((item) => item.platform === platform);
    if (!content || !task) {
      return;
    }
    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      this.helloclaw.ui.showNotice("\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u7F16\u8F91\u53D1\u5E03\u6587\u6848", "warning");
      return;
    }
    const nextCaption = window.prompt("\u7F16\u8F91\u8BE5\u5E73\u53F0\u7684\u53D1\u5E03\u6587\u6848", task.caption || buildDefaultCaption(content, platform));
    if (nextCaption === null) {
      return;
    }
    const nextUrl = window.prompt("\u5982\u5DF2\u53D1\u5E03\uFF0C\u53EF\u586B\u5199\u53D1\u5E03\u94FE\u63A5\u3002\u7559\u7A7A\u8868\u793A\u6682\u4E0D\u8BBE\u7F6E\u3002", task.url || "") ?? task.url;
    const nextTasks = content.publishTasks.map((item) => {
      if (item.platform !== platform) {
        return item;
      }
      return {
        ...item,
        caption: nextCaption.trim(),
        url: nextUrl.trim()
      };
    });
    const nextContent = {
      ...content,
      publishTasks: nextTasks,
      updatedAt: nowTimestamp()
    };
    await this.persistContent(nextContent);
    await this.reloadAllData();
    this.render();
    this.helloclaw.ui.showNotice(`${platformLabel(platform)} \u53D1\u5E03\u6587\u6848\u5DF2\u66F4\u65B0`, "success");
  }
  async saveAnalyticsSnapshotFromForm() {
    if (!this.root) {
      return;
    }
    const snapshot = this.hydrateAnalytics({
      id: uid("snapshot"),
      date: asString(this.root.querySelector("#hc-analytics-date")?.value, todayIsoDate()),
      platform: asString(this.root.querySelector("#hc-analytics-platform")?.value, "wechat"),
      contentId: asString(this.root.querySelector("#hc-analytics-content")?.value),
      impressions: asNumber(this.root.querySelector("#hc-analytics-impressions")?.value),
      reads: asNumber(this.root.querySelector("#hc-analytics-reads")?.value),
      interactions: asNumber(this.root.querySelector("#hc-analytics-interactions")?.value),
      saves: asNumber(this.root.querySelector("#hc-analytics-saves")?.value),
      shares: asNumber(this.root.querySelector("#hc-analytics-shares")?.value),
      leads: asNumber(this.root.querySelector("#hc-analytics-leads")?.value),
      conversions: asNumber(this.root.querySelector("#hc-analytics-conversions")?.value),
      revenue: asNumber(this.root.querySelector("#hc-analytics-revenue")?.value),
      followersGained: asNumber(this.root.querySelector("#hc-analytics-followers")?.value),
      notes: asString(this.root.querySelector("#hc-analytics-notes")?.value),
      createdAt: nowTimestamp()
    });
    await this.persistSnapshot(snapshot);
    await this.reloadAllData();
    this.render();
    this.helloclaw.ui.showNotice("\u8FD0\u8425\u6570\u636E\u5FEB\u7167\u5DF2\u8BB0\u5F55", "success");
  }
  async deleteSnapshot(snapshotId) {
    if (!snapshotId) {
      return;
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.analytics}/${snapshotId}.json`);
    await this.reloadAllData();
    this.render();
    this.helloclaw.ui.showNotice("\u5DF2\u5220\u9664\u6570\u636E\u5FEB\u7167", "success");
  }
  async saveManualReportFromForm() {
    if (!this.root) {
      return;
    }
    const title = asString(this.root.querySelector("#hc-report-title")?.value, "\u8FD0\u8425\u7B14\u8BB0");
    const content = asString(this.root.querySelector("#hc-report-body")?.value);
    if (!content.trim()) {
      this.helloclaw.ui.showNotice("\u8FD0\u8425\u7B14\u8BB0\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A", "warning");
      return;
    }
    const report = this.hydrateReport({
      id: uid("report"),
      type: "manual-note",
      title,
      date: todayIsoDate(),
      source: "manual",
      relatedContentId: this.state.selectedContentId,
      createdAt: nowTimestamp(),
      content
    });
    await this.persistReport(report);
    await this.reloadAllData();
    this.state.selectedReportId = report.id;
    this.render();
    this.helloclaw.ui.showNotice("\u8FD0\u8425\u7B14\u8BB0\u5DF2\u4FDD\u5B58", "success");
  }
  async deleteReport(reportId) {
    if (!reportId) {
      return;
    }
    await this.helloclaw.storage.delete(`${STORAGE_PATHS.reports}/${reportId}.json`);
    await this.reloadAllData();
    this.render();
    this.helloclaw.ui.showNotice("\u62A5\u544A\u5DF2\u5220\u9664", "success");
  }
  registerCommands() {
    const commandSpecs = [
      {
        id: "open-dashboard",
        name: "\u6253\u5F00\u5185\u5BB9\u589E\u957F\u5DE5\u4F5C\u53F0",
        callback: async () => {
          this.state.activeTab = "overview";
          this.state.settings.lastOpenedTab = "overview";
          await this.persistSettings();
          this.helloclaw.workspace.openView(this.viewId());
          this.render();
        }
      },
      {
        id: "new-content-card",
        name: "\u65B0\u5EFA\u5185\u5BB9\u5361",
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId());
          await this.createContent();
        }
      },
      {
        id: "daily-brief",
        name: "\u751F\u6210\u8FD0\u8425\u65E5\u62A5",
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId());
          await this.runAiAction("daily-brief");
        }
      },
      {
        id: "weekly-review",
        name: "\u751F\u6210\u589E\u957F\u5468\u590D\u76D8",
        callback: async () => {
          this.helloclaw.workspace.openView(this.viewId());
          await this.runAiAction("weekly-review");
        }
      }
    ];
    commandSpecs.forEach((command) => {
      const dispose = this.helloclaw.workspace.registerCommand({
        id: `${this.helloclaw.appId}:${command.id}`,
        name: command.name,
        callback: command.callback
      });
      this.disposers.push(dispose);
    });
  }
  buildWorkspaceDigest() {
    const urgent = this.getUrgentPublishCount();
    const topPlatforms = this.getPlatformSummary().slice(0, 3);
    const recentContents = this.state.contents.slice(0, 5);
    return [
      `\u54C1\u724C/\u8D26\u53F7\uFF1A${this.state.settings.brandName}`,
      `\u4E3B\u8981\u76EE\u6807\uFF1A${this.state.settings.primaryGoal}`,
      `\u5185\u5BB9\u8D44\u4EA7\uFF1A${this.state.contents.length} \u6761\uFF0C\u7D27\u6025\u53D1\u5E03\u9879 ${urgent} \u6761\uFF0C\u62A5\u544A ${this.state.reports.length} \u4EFD`,
      topPlatforms.length > 0 ? `\u91CD\u70B9\u5E73\u53F0\uFF1A${topPlatforms.map((item) => `${platformLabel(item.platform)} \u66DD\u5149 ${metricValue(item.impressions)} / \u4E92\u52A8 ${metricValue(item.interactions)}`).join("\uFF1B")}` : "\u91CD\u70B9\u5E73\u53F0\uFF1A\u6682\u65E0\u6570\u636E\u5FEB\u7167",
      recentContents.length > 0 ? `\u6700\u8FD1\u5185\u5BB9\uFF1A
${recentContents.map((item) => `- ${item.title} | ${formatLabel(item.stage, CONTENT_STAGES)} | ${item.targetPlatforms.map(platformLabel).join("\u3001") || "\u672A\u5206\u53D1"} | \u66F4\u65B0\u4E8E ${formatShortDate(item.updatedAt)}`).join("\n")}` : "\u6700\u8FD1\u5185\u5BB9\uFF1A\u5F53\u524D\u8FD8\u6CA1\u6709\u5185\u5BB9\u5361"
    ].join("\n");
  }
  buildContentContext(content) {
    return [
      `\u6807\u9898\uFF1A${content.title}`,
      `\u683C\u5F0F\uFF1A${formatLabel(content.format, CONTENT_FORMATS)}`,
      `\u9636\u6BB5\uFF1A${formatLabel(content.stage, CONTENT_STAGES)}`,
      `\u76EE\u6807\uFF1A${formatLabel(content.objective, OBJECTIVES)}`,
      `\u5185\u5BB9\u652F\u67F1\uFF1A${content.pillar || "\u672A\u8BBE\u7F6E"}`,
      `\u76EE\u6807\u53D7\u4F17\uFF1A${content.audience || "\u672A\u8BBE\u7F6E"}`,
      `\u76EE\u6807\u5E73\u53F0\uFF1A${content.targetPlatforms.map(platformLabel).join("\u3001") || "\u672A\u8BBE\u7F6E"}`,
      `\u5F00\u5934\u94A9\u5B50\uFF1A${content.hook || "\u672A\u8BBE\u7F6E"}`,
      `\u6838\u5FC3\u89D2\u5EA6\uFF1A${content.angle || "\u672A\u8BBE\u7F6E"}`,
      `CTA\uFF1A${content.cta || "\u672A\u8BBE\u7F6E"}`,
      `\u5173\u952E\u8BCD\uFF1A${content.keywords.join("\u3001") || "\u672A\u8BBE\u7F6E"}`,
      `\u5927\u7EB2\uFF1A
${content.outline || "\u672A\u586B\u5199"}`,
      `\u6B63\u6587\uFF1A
${clipText(content.body, 3500) || "\u672A\u586B\u5199"}`,
      `\u5907\u6CE8\uFF1A${content.notes || "\u65E0"}`
    ].join("\n");
  }
  buildAnalyticsDigest() {
    const lastSeven = this.state.analytics.filter((item) => {
      const delta = nowTimestamp() - new Date(item.date).getTime();
      return delta <= 1e3 * 60 * 60 * 24 * 7;
    });
    if (lastSeven.length === 0) {
      return "\u6700\u8FD1 7 \u5929\u6682\u65E0\u8FD0\u8425\u5FEB\u7167\u3002";
    }
    return lastSeven.slice(0, 10).map((item) => {
      const contentTitle = this.state.contents.find((content) => content.id === item.contentId)?.title || "\u672A\u5173\u8054\u5185\u5BB9";
      return `- ${item.date} | ${platformLabel(item.platform)} | ${contentTitle} | \u66DD\u5149 ${item.impressions} | \u9605\u8BFB ${item.reads} | \u4E92\u52A8 ${item.interactions} | \u7EBF\u7D22 ${item.leads} | \u8F6C\u5316 ${item.conversions}`;
    }).join("\n");
  }
  async runAiAction(kind, contentId = "", platform = "") {
    const content = this.state.contents.find((item) => item.id === (contentId || this.state.selectedContentId)) || null;
    const marker = `[HC_SOCIAL_REPORT::${uid("capture")}]`;
    const digest = this.buildWorkspaceDigest();
    let title = "";
    let type = "";
    let prompt = "";
    let relatedContentId = content?.id || "";
    if (kind === "daily-brief") {
      title = `AI \u65E5\u62A5 \xB7 ${todayIsoDate()}`;
      type = "daily-brief";
      prompt = [
        marker,
        "\u4F60\u662F\u5185\u5BB9\u589E\u957F\u8FD0\u8425 Agent\u3002\u8BF7\u57FA\u4E8E\u4E0B\u9762\u7684\u5DE5\u4F5C\u53F0\u6458\u8981\uFF0C\u8F93\u51FA\u4ECA\u5929\u7684\u8FD0\u8425\u65E5\u62A5\u3002",
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u7528\u201C\u4ECA\u65E5\u91CD\u70B9 / \u98CE\u9669\u63D0\u9192 / \u5206\u53D1\u52A8\u4F5C / \u590D\u76D8\u95EE\u9898\u201D\u56DB\u6BB5\u7ED3\u6784\u8F93\u51FA\u3002",
        "3. \u7ED3\u8BBA\u5FC5\u987B\u53EF\u6267\u884C\uFF0C\u4E0D\u8981\u5199\u7A7A\u6CDB\u53E3\u53F7\u3002",
        "",
        digest,
        "",
        "\u6700\u8FD1 7 \u5929\u6570\u636E\uFF1A",
        this.buildAnalyticsDigest()
      ].join("\n");
    } else if (kind === "weekly-review") {
      title = `AI \u5468\u590D\u76D8 \xB7 ${todayIsoDate()}`;
      type = "weekly-review";
      prompt = [
        marker,
        "\u4F60\u662F\u5185\u5BB9\u589E\u957F\u8FD0\u8425 Agent\u3002\u8BF7\u5BF9\u6700\u8FD1\u4E00\u5468\u505A\u589E\u957F\u5468\u590D\u76D8\u3002",
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u7528\u201C\u672C\u5468\u7ED3\u679C / \u8868\u73B0\u6700\u597D\u5185\u5BB9 / \u5931\u901F\u5185\u5BB9\u8BCA\u65AD / \u4E0B\u5468\u5B9E\u9A8C\u201D\u56DB\u6BB5\u8F93\u51FA\u3002",
        "3. \u660E\u786E\u533A\u5206\u4E8B\u5B9E\u3001\u63A8\u65AD\u548C\u5EFA\u8BAE\u3002",
        "",
        digest,
        "",
        "\u6700\u8FD1 7 \u5929\u6570\u636E\uFF1A",
        this.buildAnalyticsDigest()
      ].join("\n");
    } else if (kind === "experiments") {
      title = `AI \u589E\u957F\u5B9E\u9A8C\u6E05\u5355 \xB7 ${todayIsoDate()}`;
      type = "experiment-plan";
      prompt = [
        marker,
        "\u8BF7\u57FA\u4E8E\u4EE5\u4E0B\u5185\u5BB9\u4E0E\u6570\u636E\uFF0C\u4E3A\u4E13\u4E1A\u81EA\u5A92\u4F53\u4EBA\u63D0\u51FA 3 \u4E2A\u6700\u503C\u5F97\u6267\u884C\u7684\u589E\u957F\u5B9E\u9A8C\u3002",
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u6BCF\u4E2A\u5B9E\u9A8C\u90FD\u5305\u542B\uFF1A\u5047\u8BBE\u3001\u6267\u884C\u52A8\u4F5C\u3001\u89C2\u5BDF\u6307\u6807\u3001\u505C\u6B62\u6761\u4EF6\u3002",
        "",
        digest,
        "",
        "\u6700\u8FD1 7 \u5929\u6570\u636E\uFF1A",
        this.buildAnalyticsDigest()
      ].join("\n");
    } else if (kind === "content-brief" && content) {
      title = `AI \u5185\u5BB9 Brief \xB7 ${content.title}`;
      type = "content-brief";
      prompt = [
        marker,
        "\u8BF7\u628A\u4E0B\u9762\u7684\u5185\u5BB9\u5361\u6574\u7406\u6210\u4E13\u4E1A\u521B\u4F5C\u8005\u53EF\u76F4\u63A5\u6267\u884C\u7684\u5185\u5BB9 Brief\u3002",
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u8F93\u51FA\u7ED3\u6784\u5305\u542B\uFF1A\u76EE\u6807\u3001\u53D7\u4F17\u3001\u6838\u5FC3\u8BBA\u70B9\u3001\u4E09\u6BB5\u5F0F\u7ED3\u6784\u3001\u8BC1\u636E\u3001CTA\u3001\u5E73\u53F0\u9002\u914D\u5EFA\u8BAE\u3002",
        "",
        this.buildContentContext(content)
      ].join("\n");
    } else if (kind === "repurpose" && content) {
      title = `AI \u591A\u5E73\u53F0\u6539\u5199\u5305 \xB7 ${content.title}`;
      type = "repurpose-pack";
      prompt = [
        marker,
        "\u8BF7\u628A\u4E0B\u9762\u7684\u5185\u5BB9\u6539\u5199\u4E3A\u591A\u5E73\u53F0\u53D1\u5E03\u5305\u3002",
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u81F3\u5C11\u8986\u76D6\u5F53\u524D\u5185\u5BB9\u5361\u91CC\u52FE\u9009\u7684\u5E73\u53F0\u3002",
        "3. \u6BCF\u4E2A\u5E73\u53F0\u90FD\u8F93\u51FA\u6210\u54C1\u6587\u6848\u3001\u5F00\u5934\u94A9\u5B50\u548C CTA\u3002",
        "",
        this.buildContentContext(content)
      ].join("\n");
    } else if (kind === "publish" && content) {
      const platformLabelText = platform ? platformLabel(platform) : "\u6240\u6709\u76EE\u6807\u5E73\u53F0";
      title = `AI \u53D1\u5E03\u5305 \xB7 ${content.title}`;
      type = "publish-package";
      prompt = [
        marker,
        `\u8BF7\u4E3A\u8FD9\u6761\u5185\u5BB9\u751F\u6210 ${platformLabelText} \u7684\u6700\u7EC8\u53D1\u5E03\u6267\u884C\u5305\u3002\u5982\u679C\u5DE5\u5177\u53EF\u7528\uFF0C\u8BF7\u6267\u884C\u53D1\u9001\uFF1B\u5982\u679C\u5DE5\u5177\u4E0D\u53EF\u7528\uFF0C\u8BF7\u8F93\u51FA\u53EF\u76F4\u63A5\u590D\u5236\u7684\u6700\u7EC8\u6587\u6848\u3002`,
        "\u8981\u6C42\uFF1A",
        "1. \u9996\u884C\u539F\u6837\u8F93\u51FA\u4E0A\u9762\u7684\u6807\u8BB0\u3002",
        "2. \u5148\u505A\u53D1\u5E03\u524D\u68C0\u67E5\uFF0C\u518D\u7ED9\u6700\u7EC8\u53D1\u5E03\u7248\u672C\u3002",
        "3. \u5982\u679C\u5B58\u5728\u98CE\u9669\u6216\u7F3A\u7D20\u6750\uFF0C\u5FC5\u987B\u660E\u786E\u6307\u51FA\u3002",
        "",
        this.buildContentContext(content),
        "",
        platform ? `\u76EE\u6807\u5E73\u53F0\uFF1A${platformLabel(platform)}` : `\u76EE\u6807\u5E73\u53F0\uFF1A${content.targetPlatforms.map(platformLabel).join("\u3001") || "\u672A\u8BBE\u7F6E"}`
      ].join("\n");
    } else {
      this.helloclaw.ui.showNotice("\u5F53\u524D\u52A8\u4F5C\u7F3A\u5C11\u5FC5\u8981\u4E0A\u4E0B\u6587\uFF0C\u8BF7\u5148\u9009\u4E2D\u5185\u5BB9\u6216\u8865\u5145\u6570\u636E", "warning");
      return;
    }
    this.pendingCaptures.push({
      marker,
      type,
      title,
      relatedContentId
    });
    try {
      await this.helloclaw.chat.send(prompt);
      this.helloclaw.ui.showNotice("\u5DF2\u5C06\u4EFB\u52A1\u53D1\u9001\u7ED9 OpenClaw\uFF0C\u5BF9\u8BDD\u8FD4\u56DE\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u5230\u62A5\u544A\u4E2D\u5FC3", "success");
    } catch {
      this.pendingCaptures = this.pendingCaptures.filter((item) => item.marker !== marker);
      this.helloclaw.ui.showNotice("\u53D1\u9001\u5230 OpenClaw \u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5\u72B6\u6001", "error");
    }
  }
  async handleChatMessage(message) {
    if (!message || message.role !== "assistant") {
      return;
    }
    const text = asString(message.content || message.text);
    if (!text) {
      return;
    }
    let pending = this.pendingCaptures.find((item) => text.includes(item.marker));
    if (!pending && this.pendingCaptures.length === 1) {
      pending = this.pendingCaptures[0];
    }
    if (!pending) {
      return;
    }
    const report = this.hydrateReport({
      id: uid("report"),
      type: pending.type,
      title: pending.title,
      date: todayIsoDate(),
      source: "ai",
      relatedContentId: pending.relatedContentId,
      createdAt: nowTimestamp(),
      content: text.replace(pending.marker, "").trim()
    });
    await this.persistReport(report);
    this.pendingCaptures = this.pendingCaptures.filter((item) => item.marker !== pending.marker);
    await this.reloadAllData();
    this.state.selectedReportId = report.id;
    this.render();
    this.helloclaw.ui.showNotice("\u5DF2\u5C06 OpenClaw \u8F93\u51FA\u4FDD\u5B58\u5230\u62A5\u544A\u4E2D\u5FC3", "success");
  }
  render() {
    if (!this.root) {
      return;
    }
    const selectedContent = this.getSelectedContent();
    const selectedReport = this.getSelectedReport();
    const filteredContents = this.getFilteredContents();
    const publishQueue = this.getPublishQueue();
    const overviewStats = this.getOverviewStats();
    const platformSummary = this.getPlatformSummary();
    this.root.className = "hc-sm-root";
    this.root.innerHTML = `
      <div class="hc-sm-app">
        <section class="hc-sm-hero">
          <div>
            <p class="hc-sm-eyebrow">Professional Creator OS</p>
            <h1>${escapeHtml(this.state.settings.brandName)}</h1>
            <p class="hc-sm-subtitle">${escapeHtml(this.state.settings.primaryGoal)}</p>
          </div>
          <div class="hc-sm-hero__actions">
            <button class="hc-btn hc-btn--ghost" data-action="refresh-data">\u5237\u65B0\u6570\u636E</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">\u751F\u6210\u65E5\u62A5</button>
            <button class="hc-btn hc-btn--primary" data-action="new-content">\u65B0\u5EFA\u5185\u5BB9\u5361</button>
          </div>
        </section>

        <nav class="hc-sm-tabs">
          ${this.renderTabButton("overview", "\u603B\u89C8")}
          ${this.renderTabButton("pipeline", "\u5185\u5BB9\u7BA1\u7EBF")}
          ${this.renderTabButton("publish", "\u53D1\u5E03\u4E2D\u5FC3")}
          ${this.renderTabButton("analytics", "\u8FD0\u8425\u5206\u6790")}
          ${this.renderTabButton("reports", "AI \u590D\u76D8")}
        </nav>

        <section class="hc-sm-body">
          ${this.state.activeTab === "overview" ? this.renderOverviewTab(overviewStats, platformSummary, publishQueue) : ""}
          ${this.state.activeTab === "pipeline" ? this.renderPipelineTab(filteredContents, selectedContent) : ""}
          ${this.state.activeTab === "publish" ? this.renderPublishTab(publishQueue) : ""}
          ${this.state.activeTab === "analytics" ? this.renderAnalyticsTab(platformSummary) : ""}
          ${this.state.activeTab === "reports" ? this.renderReportsTab(selectedReport) : ""}
        </section>
      </div>
    `;
  }
  renderTabButton(tab, label) {
    const activeClass = this.state.activeTab === tab ? "is-active" : "";
    return `
      <button class="hc-sm-tab ${activeClass}" data-action="switch-tab" data-tab="${tab}">
        ${label}
      </button>
    `;
  }
  renderOverviewTab(overviewStats, platformSummary, publishQueue) {
    const urgentQueue = publishQueue.filter((item) => item.status !== "published").slice(0, 5);
    return `
      <div class="hc-sm-stack">
        <div class="hc-sm-grid hc-sm-grid--stats">
          ${overviewStats.map((item) => `
            <article class="hc-card hc-stat-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <small>${escapeHtml(item.note)}</small>
            </article>
          `).join("")}
        </div>

        <div class="hc-sm-grid hc-sm-grid--main">
          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Today Queue</p>
                <h3>\u5F85\u63A8\u8FDB\u4E8B\u9879</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">\u53D1\u7ED9 OpenClaw \u6668\u68C0</button>
            </div>
            <div class="hc-sm-list">
              ${urgentQueue.length > 0 ? urgentQueue.map((item) => `
                <button class="hc-sm-list__item" data-action="select-content" data-content-id="${item.contentId}">
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${platformLabel(item.platform)} \xB7 ${formatDateTime(item.scheduledAt || item.dueDate)} \xB7 ${formatLabel(item.stage, CONTENT_STAGES)}</small>
                  </div>
                  <span class="hc-chip ${toneClassForPublishStatus(item.status)}">${escapeHtml(item.status)}</span>
                </button>
              `).join("") : '<p class="hc-empty">\u5F53\u524D\u6CA1\u6709\u7D27\u6025\u53D1\u5E03\u9879\uFF0C\u9002\u5408\u8865\u5145\u9009\u9898\u6216\u590D\u76D8\u3002</p>'}
            </div>
          </article>

          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Channel Pulse</p>
                <h3>\u5E73\u53F0\u8868\u73B0</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="weekly-review">\u751F\u6210\u5468\u590D\u76D8</button>
            </div>
            <div class="hc-sm-platform-grid">
              ${platformSummary.length > 0 ? platformSummary.slice(0, 6).map((item) => `
                <article class="hc-sm-mini-card">
                  <strong>${platformLabel(item.platform)}</strong>
                  <span>\u66DD\u5149 ${metricValue(item.impressions)}</span>
                  <span>\u4E92\u52A8 ${metricValue(item.interactions)}</span>
                  <span>\u7EBF\u7D22 ${metricValue(item.leads)}</span>
                </article>
              `).join("") : '<p class="hc-empty">\u5148\u5728\u201C\u8FD0\u8425\u5206\u6790\u201D\u91CC\u8BB0\u5F55\u6570\u636E\u5FEB\u7167\uFF0C\u5E73\u53F0\u8868\u73B0\u4F1A\u81EA\u52A8\u6C47\u603B\u3002</p>'}
            </div>
          </article>
        </div>

        <article class="hc-card">
          <div class="hc-card__header">
            <div>
              <p class="hc-sm-eyebrow">Recent Content</p>
              <h3>\u8FD1\u671F\u5185\u5BB9\u4E0E\u590D\u7528\u673A\u4F1A</h3>
            </div>
            <button class="hc-btn hc-btn--ghost" data-action="switch-tab" data-tab="pipeline">\u6253\u5F00\u5185\u5BB9\u7BA1\u7EBF</button>
          </div>
          <div class="hc-sm-grid hc-sm-grid--cards">
            ${this.state.contents.slice(0, 6).map((item) => `
              <article class="hc-sm-content-card">
                <div class="hc-sm-content-card__head">
                  <span class="hc-chip ${toneClassForStage(item.stage)}">${formatLabel(item.stage, CONTENT_STAGES)}</span>
                  <small>${formatLabel(item.format, CONTENT_FORMATS)}</small>
                </div>
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(clipText(item.hook || item.angle || item.body, 120) || "\u8865\u4E00\u6761\u94A9\u5B50\u6216\u5185\u5BB9\u6458\u8981\uFF0C\u4FBF\u4E8E\u56E2\u961F\u5FEB\u901F\u5224\u65AD\u4F18\u5148\u7EA7\u3002")}</p>
                <div class="hc-sm-tag-row">
                  ${item.targetPlatforms.map((platform) => `<span class="hc-chip tone-muted">${platformLabel(platform)}</span>`).join("")}
                </div>
                <div class="hc-sm-content-card__footer">
                  <small>${formatShortDate(item.updatedAt)} \u66F4\u65B0</small>
                  <button class="hc-btn hc-btn--ghost" data-action="select-content" data-content-id="${item.id}">\u67E5\u770B</button>
                </div>
              </article>
            `).join("") || '<p class="hc-empty">\u8FD8\u6CA1\u6709\u5185\u5BB9\u5361\u3002\u5148\u521B\u5EFA\u4E00\u6761\u9009\u9898\uFF0C\u5DE5\u4F5C\u53F0\u4F1A\u81EA\u52A8\u5F62\u6210\u53D1\u5E03\u548C\u590D\u76D8\u94FE\u8DEF\u3002</p>'}
          </div>
        </article>
      </div>
    `;
  }
  renderPipelineTab(contents, selectedContent) {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__filters">
            <label>
              <span>\u9636\u6BB5</span>
              <select data-filter="content-stage">
                <option value="all">\u5168\u90E8\u9636\u6BB5</option>
                ${CONTENT_STAGES.map((item) => `<option value="${item.value}" ${this.state.contentStageFilter === item.value ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>\u5E73\u53F0</span>
              <select data-filter="content-platform">
                <option value="all">\u5168\u90E8\u5E73\u53F0</option>
                ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}" ${this.state.contentPlatformFilter === item.id ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">\u751F\u6210\u589E\u957F\u5B9E\u9A8C</button>
            <button class="hc-btn hc-btn--primary" data-action="new-content">\u65B0\u589E\u5185\u5BB9\u5361</button>
          </div>
        </div>

        <div class="hc-sm-split">
          <article class="hc-card hc-sm-list-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Pipeline</p>
                <h3>\u5185\u5BB9\u5217\u8868</h3>
              </div>
              <span class="hc-chip tone-muted">${contents.length} \u6761</span>
            </div>
            <div class="hc-sm-list">
              ${contents.length > 0 ? contents.map((item) => `
                <button
                  class="hc-sm-list__item ${this.state.selectedContentId === item.id ? "is-selected" : ""}"
                  data-action="select-content"
                  data-content-id="${item.id}"
                >
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${formatLabel(item.stage, CONTENT_STAGES)} \xB7 ${item.targetPlatforms.map(platformLabel).join("\u3001") || "\u672A\u8BBE\u7F6E\u5E73\u53F0"}</small>
                  </div>
                  <small>${formatShortDate(item.updatedAt)}</small>
                </button>
              `).join("") : '<p class="hc-empty">\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5185\u5BB9\u3002\u4F60\u53EF\u4EE5\u65B0\u5EFA\u4E00\u6761\u5185\u5BB9\u5361\uFF0C\u6216\u5207\u6362\u7B5B\u9009\u3002</p>'}
            </div>
          </article>

          <article class="hc-card hc-sm-editor-panel">
            ${selectedContent ? this.renderContentEditor(selectedContent) : `
              <div class="hc-empty hc-empty--large">
                \u9009\u62E9\u5DE6\u4FA7\u5185\u5BB9\u5361\u540E\uFF0C\u53EF\u4EE5\u7F16\u8F91\u9009\u9898\u3001\u5E73\u53F0\u3001\u6392\u671F\u3001\u6B63\u6587\uFF0C\u5E76\u628A\u4EFB\u52A1\u53D1\u9001\u7ED9 OpenClaw\u3002
              </div>
            `}
          </article>
        </div>
      </div>
    `;
  }
  renderContentEditor(content) {
    return `
      <div class="hc-card__header">
        <div>
          <p class="hc-sm-eyebrow">Editor</p>
          <h3>${escapeHtml(content.title)}</h3>
        </div>
        <div class="hc-sm-toolbar__actions">
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="content-brief" data-content-id="${content.id}">\u751F\u6210 Brief</button>
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="repurpose" data-content-id="${content.id}">\u591A\u5E73\u53F0\u6539\u5199</button>
          <button class="hc-btn hc-btn--primary" data-action="save-content">\u4FDD\u5B58</button>
        </div>
      </div>

      <div class="hc-sm-form-grid">
        <label>
          <span>\u6807\u9898</span>
          <input id="hc-content-title" value="${escapeHtml(content.title)}" placeholder="\u4F8B\u5982\uFF1A\u6211\u5982\u4F55\u628A\u4E00\u7BC7\u957F\u6587\u62C6\u6210 5 \u4E2A\u5E73\u53F0\u7248\u672C" />
        </label>
        <label>
          <span>\u5185\u5BB9\u683C\u5F0F</span>
          <select id="hc-content-format">
            ${CONTENT_FORMATS.map((item) => `<option value="${item.value}" ${content.format === item.value ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>\u9636\u6BB5</span>
          <select id="hc-content-stage">
            ${CONTENT_STAGES.map((item) => `<option value="${item.value}" ${content.stage === item.value ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>\u76EE\u6807</span>
          <select id="hc-content-objective">
            ${OBJECTIVES.map((item) => `<option value="${item.value}" ${content.objective === item.value ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>\u5185\u5BB9\u652F\u67F1</span>
          <input id="hc-content-pillar" value="${escapeHtml(content.pillar)}" placeholder="\u4F8B\u5982\uFF1A\u589E\u957F\u65B9\u6CD5\u8BBA / \u6848\u4F8B\u62C6\u89E3" />
        </label>
        <label>
          <span>\u76EE\u6807\u53D7\u4F17</span>
          <input id="hc-content-audience" value="${escapeHtml(content.audience)}" placeholder="\u4F8B\u5982\uFF1ASaaS \u521B\u59CB\u4EBA / \u8FD0\u8425\u8D1F\u8D23\u4EBA" />
        </label>
        <label>
          <span>\u622A\u6B62\u65E5\u671F</span>
          <input id="hc-content-due-date" type="date" value="${escapeHtml(content.dueDate)}" />
        </label>
        <label>
          <span>\u8BA1\u5212\u53D1\u5E03\u65F6\u95F4</span>
          <input id="hc-content-scheduled-at" type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(content.scheduledAt))}" />
        </label>
      </div>

      <div class="hc-sm-form-grid">
        <label class="is-wide">
          <span>\u5F00\u5934\u94A9\u5B50</span>
          <textarea id="hc-content-hook" rows="3" placeholder="\u524D\u4E09\u79D2\u6216\u524D\u4E09\u53E5\uFF0C\u8981\u8BA9\u76EE\u6807\u7528\u6237\u7ACB\u523B\u505C\u4E0B\u6765">${escapeHtml(content.hook)}</textarea>
        </label>
        <label class="is-wide">
          <span>\u6838\u5FC3\u89D2\u5EA6 / \u8BBA\u70B9</span>
          <textarea id="hc-content-angle" rows="3" placeholder="\u8FD9\u6761\u5185\u5BB9\u771F\u6B63\u60F3\u4F20\u9012\u4EC0\u4E48\uFF0C\u4E0D\u8981\u53EA\u5199\u4E3B\u9898">${escapeHtml(content.angle)}</textarea>
        </label>
      </div>

      <div class="hc-sm-form-grid">
        <label>
          <span>CTA</span>
          <input id="hc-content-cta" value="${escapeHtml(content.cta)}" placeholder="\u4F8B\u5982\uFF1A\u5F15\u5BFC\u79C1\u4FE1\u3001\u9884\u7EA6 Demo\u3001\u52A0\u5165\u793E\u7FA4" />
        </label>
        <label class="is-wide">
          <span>\u5173\u952E\u8BCD</span>
          <input id="hc-content-keywords" value="${escapeHtml(content.keywords.join(", "))}" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF1A\u589E\u957F, \u5206\u53D1, \u7EBF\u7D22" />
        </label>
      </div>

      <div class="hc-card hc-card--subtle">
        <div class="hc-card__header">
          <div>
            <p class="hc-sm-eyebrow">Distribution</p>
            <h4>\u76EE\u6807\u5E73\u53F0</h4>
          </div>
        </div>
        <div class="hc-sm-platform-grid">
          ${PLATFORM_OPTIONS.map((platform) => `
            <label class="hc-sm-check">
              <input
                type="checkbox"
                data-platform-checkbox
                value="${platform.id}"
                ${content.targetPlatforms.includes(platform.id) ? "checked" : ""}
              />
              <strong>${platform.label}</strong>
              <small>${platform.hint}</small>
            </label>
          `).join("")}
        </div>
      </div>

      <div class="hc-sm-form-grid">
        <label class="is-wide">
          <span>\u5185\u5BB9\u5927\u7EB2</span>
          <textarea id="hc-content-outline" rows="6" placeholder="\u5EFA\u8BAE\u6BCF\u884C\u4E00\u4E2A\u6BB5\u843D\u6216\u5C0F\u6807\u9898">${escapeHtml(content.outline)}</textarea>
        </label>
        <label class="is-wide">
          <span>\u6B63\u6587 / \u811A\u672C</span>
          <textarea id="hc-content-body" rows="14" placeholder="\u8FD9\u91CC\u653E\u6838\u5FC3\u957F\u6587\u3001\u811A\u672C\u6216\u8349\u7A3F\u5168\u6587">${escapeHtml(content.body)}</textarea>
        </label>
      </div>

      <label class="is-wide">
        <span>\u8FD0\u8425\u5907\u6CE8</span>
        <textarea id="hc-content-notes" rows="4" placeholder="\u8BB0\u5F55\u98CE\u9669\u3001\u7D20\u6750\u3001\u534F\u4F5C\u4F9D\u8D56\u6216\u590D\u76D8\u63D0\u9192">${escapeHtml(content.notes)}</textarea>
      </label>

      <div class="hc-sm-meta-row">
        <div class="hc-sm-tag-row">
          ${content.publishTasks.map((task) => `<span class="hc-chip ${toneClassForPublishStatus(task.status)}">${platformLabel(task.platform)} \xB7 ${task.status}</span>`).join("")}
        </div>
        <div class="hc-sm-toolbar__actions">
          <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="publish" data-content-id="${content.id}">\u751F\u6210\u53D1\u5E03\u5305</button>
          <button class="hc-btn hc-btn--danger" data-action="delete-content" data-content-id="${content.id}">\u5220\u9664</button>
        </div>
      </div>
    `;
  }
  renderPublishTab(queue) {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__filters">
            <label>
              <span>\u53D1\u5E03\u72B6\u6001</span>
              <select data-filter="publish-status">
                <option value="all">\u5168\u90E8\u72B6\u6001</option>
                <option value="draft" ${this.state.publishStatusFilter === "draft" ? "selected" : ""}>\u8349\u7A3F</option>
                <option value="ready" ${this.state.publishStatusFilter === "ready" ? "selected" : ""}>\u5F85\u53D1</option>
                <option value="queued" ${this.state.publishStatusFilter === "queued" ? "selected" : ""}>\u5DF2\u6392\u961F</option>
                <option value="published" ${this.state.publishStatusFilter === "published" ? "selected" : ""}>\u5DF2\u53D1\u5E03</option>
                <option value="failed" ${this.state.publishStatusFilter === "failed" ? "selected" : ""}>\u5931\u8D25</option>
              </select>
            </label>
            <label>
              <span>\u5E73\u53F0</span>
              <select data-filter="publish-platform">
                <option value="all">\u5168\u90E8\u5E73\u53F0</option>
                ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}" ${this.state.publishPlatformFilter === item.id ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">\u8BA9 OpenClaw \u5904\u7406\u4ECA\u65E5\u961F\u5217</button>
          </div>
        </div>

        <div class="hc-sm-grid hc-sm-grid--cards">
          ${queue.length > 0 ? queue.map((item) => `
            <article class="hc-card hc-sm-publish-card">
              <div class="hc-card__header">
                <div>
                  <p class="hc-sm-eyebrow">${platformLabel(item.platform)}</p>
                  <h3>${escapeHtml(item.title)}</h3>
                  <small>${formatDateTime(item.scheduledAt || item.dueDate)} \xB7 ${formatLabel(item.stage, CONTENT_STAGES)}</small>
                </div>
                <span class="hc-chip ${toneClassForPublishStatus(item.status)}">${escapeHtml(item.status)}</span>
              </div>
              <p>${escapeHtml(clipText(item.caption || item.hook || item.body, 160) || "\u5F53\u524D\u8FD8\u6CA1\u6709\u5355\u72EC\u53D1\u5E03\u6587\u6848\uFF0C\u5EFA\u8BAE\u5148\u5728\u5185\u5BB9\u5361\u91CC\u5B8C\u5584\u94A9\u5B50\u6216\u6B63\u6587\u3002")}</p>
              <div class="hc-sm-tag-row">
                <span class="hc-chip tone-muted">${formatLabel(item.format, CONTENT_FORMATS)}</span>
                <span class="hc-chip tone-muted">${formatLabel(item.objective, OBJECTIVES)}</span>
                ${item.url ? `<a class="hc-chip tone-success" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\u5DF2\u8BB0\u5F55\u94FE\u63A5</a>` : ""}
              </div>
              <div class="hc-sm-publish-actions">
                <button class="hc-btn hc-btn--ghost" data-action="edit-publish-meta" data-content-id="${item.contentId}" data-platform="${item.platform}">\u7F16\u8F91\u6587\u6848/\u94FE\u63A5</button>
                <button class="hc-btn hc-btn--ghost" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="queued">\u6392\u961F</button>
                <button class="hc-btn hc-btn--ghost" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="published">\u5DF2\u53D1\u5E03</button>
                <button class="hc-btn hc-btn--danger" data-action="set-publish-status" data-content-id="${item.contentId}" data-platform="${item.platform}" data-status="failed">\u5931\u8D25</button>
                <button class="hc-btn hc-btn--primary" data-action="run-ai" data-ai="publish" data-content-id="${item.contentId}" data-platform="${item.platform}">\u53D1\u9001\u7ED9 OpenClaw</button>
              </div>
            </article>
          `).join("") : '<p class="hc-empty">\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53D1\u5E03\u4EFB\u52A1\u3002\u5185\u5BB9\u5361\u52FE\u9009\u76EE\u6807\u5E73\u53F0\u540E\uFF0C\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</p>'}
        </div>
      </div>
    `;
  }
  renderAnalyticsTab(platformSummary) {
    const topSnapshots = this.state.analytics.slice(0, 8);
    return `
      <div class="hc-sm-stack">
        <div class="hc-sm-grid hc-sm-grid--main">
          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Performance Overview</p>
                <h3>\u5E73\u53F0\u6C47\u603B</h3>
              </div>
              <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">\u7528 OpenClaw \u627E\u5B9E\u9A8C\u673A\u4F1A</button>
            </div>
            <div class="hc-sm-platform-grid">
              ${platformSummary.length > 0 ? platformSummary.map((item) => `
                <article class="hc-sm-mini-card">
                  <strong>${platformLabel(item.platform)}</strong>
                  <span>\u66DD\u5149 ${metricValue(item.impressions)}</span>
                  <span>\u4E92\u52A8 ${metricValue(item.interactions)}</span>
                  <span>\u7EBF\u7D22 ${metricValue(item.leads)}</span>
                </article>
              `).join("") : '<p class="hc-empty">\u8FD8\u6CA1\u6709\u6570\u636E\u5FEB\u7167\u3002\u5148\u5F55\u5165\u5E73\u53F0\u6570\u636E\uFF0C\u518D\u505A\u5206\u6790\u4E0E\u590D\u76D8\u3002</p>'}
            </div>
          </article>

          <article class="hc-card">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Snapshot Input</p>
                <h3>\u8BB0\u5F55\u8FD0\u8425\u6570\u636E</h3>
              </div>
            </div>
            <div class="hc-sm-form-grid">
              <label>
                <span>\u65E5\u671F</span>
                <input id="hc-analytics-date" type="date" value="${todayIsoDate()}" />
              </label>
              <label>
                <span>\u5E73\u53F0</span>
                <select id="hc-analytics-platform">
                  ${PLATFORM_OPTIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join("")}
                </select>
              </label>
              <label class="is-wide">
                <span>\u5173\u8054\u5185\u5BB9</span>
                <select id="hc-analytics-content">
                  <option value="">\u4E0D\u5173\u8054\u5177\u4F53\u5185\u5BB9</option>
                  ${this.state.contents.map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join("")}
                </select>
              </label>
            </div>
            <div class="hc-sm-form-grid">
              <label><span>\u66DD\u5149</span><input id="hc-analytics-impressions" type="number" min="0" placeholder="0" /></label>
              <label><span>\u9605\u8BFB/\u64AD\u653E</span><input id="hc-analytics-reads" type="number" min="0" placeholder="0" /></label>
              <label><span>\u4E92\u52A8</span><input id="hc-analytics-interactions" type="number" min="0" placeholder="0" /></label>
              <label><span>\u6536\u85CF</span><input id="hc-analytics-saves" type="number" min="0" placeholder="0" /></label>
              <label><span>\u5206\u4EAB</span><input id="hc-analytics-shares" type="number" min="0" placeholder="0" /></label>
              <label><span>\u7EBF\u7D22</span><input id="hc-analytics-leads" type="number" min="0" placeholder="0" /></label>
              <label><span>\u8F6C\u5316</span><input id="hc-analytics-conversions" type="number" min="0" placeholder="0" /></label>
              <label><span>\u6536\u5165</span><input id="hc-analytics-revenue" type="number" min="0" placeholder="0" /></label>
              <label><span>\u65B0\u589E\u5173\u6CE8</span><input id="hc-analytics-followers" type="number" min="0" placeholder="0" /></label>
            </div>
            <label class="is-wide">
              <span>\u5907\u6CE8</span>
              <textarea id="hc-analytics-notes" rows="3" placeholder="\u8BB0\u5F55\u5F02\u5E38\u3001\u6295\u6D41\u3001\u7D20\u6750\u3001\u70ED\u70B9\u6216\u8F6C\u5316\u94FE\u8DEF\u53D8\u5316"></textarea>
            </label>
            <div class="hc-sm-toolbar__actions">
              <button class="hc-btn hc-btn--primary" data-action="save-snapshot">\u4FDD\u5B58\u6570\u636E\u5FEB\u7167</button>
            </div>
          </article>
        </div>

        <article class="hc-card">
          <div class="hc-card__header">
            <div>
              <p class="hc-sm-eyebrow">Recent Snapshots</p>
              <h3>\u6700\u8FD1\u6570\u636E\u8BB0\u5F55</h3>
            </div>
          </div>
          <div class="hc-sm-list">
            ${topSnapshots.length > 0 ? topSnapshots.map((item) => `
              <div class="hc-sm-list__item hc-sm-list__item--static">
                <div>
                  <strong>${platformLabel(item.platform)} \xB7 ${escapeHtml(item.date)}</strong>
                  <small>
                    ${this.state.contents.find((content) => content.id === item.contentId)?.title || "\u672A\u5173\u8054\u5185\u5BB9"}
                    \xB7 \u66DD\u5149 ${item.impressions}
                    \xB7 \u9605\u8BFB ${item.reads}
                    \xB7 \u4E92\u52A8 ${item.interactions}
                    \xB7 \u7EBF\u7D22 ${item.leads}
                  </small>
                </div>
                <button class="hc-btn hc-btn--danger" data-action="delete-snapshot" data-snapshot-id="${item.id}">\u5220\u9664</button>
              </div>
            `).join("") : '<p class="hc-empty">\u4FDD\u5B58\u7B2C\u4E00\u6761\u6570\u636E\u5FEB\u7167\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6309\u65F6\u95F4\u5012\u5E8F\u5C55\u793A\u3002</p>'}
          </div>
        </article>
      </div>
    `;
  }
  renderReportsTab(selectedReport) {
    return `
      <div class="hc-sm-stack">
        <div class="hc-card hc-sm-toolbar">
          <div class="hc-sm-toolbar__actions">
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="daily-brief">\u751F\u6210\u65E5\u62A5</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="weekly-review">\u751F\u6210\u5468\u590D\u76D8</button>
            <button class="hc-btn hc-btn--ghost" data-action="run-ai" data-ai="experiments">\u751F\u6210\u5B9E\u9A8C\u8BA1\u5212</button>
          </div>
        </div>

        <div class="hc-sm-split">
          <article class="hc-card hc-sm-list-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Reports</p>
                <h3>\u62A5\u544A\u4E2D\u5FC3</h3>
              </div>
              <span class="hc-chip tone-muted">${this.state.reports.length} \u4EFD</span>
            </div>
            <div class="hc-sm-list">
              ${this.state.reports.length > 0 ? this.state.reports.map((item) => `
                <button
                  class="hc-sm-list__item ${this.state.selectedReportId === item.id ? "is-selected" : ""}"
                  data-action="select-report"
                  data-report-id="${item.id}"
                >
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${REPORT_TYPES[item.type] || item.type} \xB7 ${item.source === "ai" ? "OpenClaw" : "\u624B\u52A8"} \xB7 ${escapeHtml(item.date)}</small>
                  </div>
                  <small>${formatShortDate(item.createdAt)}</small>
                </button>
              `).join("") : '<p class="hc-empty">\u8FD8\u6CA1\u6709\u62A5\u544A\u3002\u53EF\u4EE5\u624B\u52A8\u8BB0\u5F55\u8FD0\u8425\u7B14\u8BB0\uFF0C\u6216\u628A\u4EFB\u52A1\u53D1\u9001\u7ED9 OpenClaw \u81EA\u52A8\u751F\u6210\u3002</p>'}
            </div>
          </article>

          <article class="hc-card hc-sm-editor-panel">
            <div class="hc-card__header">
              <div>
                <p class="hc-sm-eyebrow">Manual Note</p>
                <h3>\u8BB0\u5F55\u8FD0\u8425\u7B14\u8BB0</h3>
              </div>
              <button class="hc-btn hc-btn--primary" data-action="save-manual-report">\u4FDD\u5B58\u7B14\u8BB0</button>
            </div>
            <div class="hc-sm-form-grid">
              <label class="is-wide">
                <span>\u6807\u9898</span>
                <input id="hc-report-title" value="" placeholder="\u4F8B\u5982\uFF1A\u672C\u5468\u9009\u9898\u4F1A\u7ED3\u8BBA / \u53D1\u5E03\u5F02\u5E38\u8BB0\u5F55" />
              </label>
              <label class="is-wide">
                <span>\u5185\u5BB9</span>
                <textarea id="hc-report-body" rows="8" placeholder="\u8BB0\u5F55\u4F1A\u8BAE\u7ED3\u8BBA\u3001\u7D20\u6750\u7F3A\u53E3\u3001\u589E\u957F\u5224\u65AD\u6216\u540E\u7EED\u52A8\u4F5C"></textarea>
              </label>
            </div>

            <div class="hc-card hc-card--subtle">
              <div class="hc-card__header">
                <div>
                  <p class="hc-sm-eyebrow">Selected Report</p>
                  <h3>${escapeHtml(selectedReport?.title || "\u6682\u65E0\u9009\u4E2D\u62A5\u544A")}</h3>
                </div>
                ${selectedReport ? `<button class="hc-btn hc-btn--danger" data-action="delete-report" data-report-id="${selectedReport.id}">\u5220\u9664</button>` : ""}
              </div>
              ${selectedReport ? `
                <div class="hc-sm-tag-row">
                  <span class="hc-chip tone-muted">${escapeHtml(REPORT_TYPES[selectedReport.type] || selectedReport.type)}</span>
                  <span class="hc-chip tone-muted">${selectedReport.source === "ai" ? "OpenClaw \u8F93\u51FA" : "\u624B\u52A8\u8BB0\u5F55"}</span>
                  <span class="hc-chip tone-muted">${escapeHtml(selectedReport.date)}</span>
                </div>
                <div class="hc-sm-report-body">${nl2br(selectedReport.content)}</div>
              ` : '<p class="hc-empty">\u5DE6\u4FA7\u9009\u62E9\u4E00\u4EFD\u62A5\u544A\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5C55\u793A\u5B8C\u6574\u5185\u5BB9\u3002</p>'}
            </div>
          </article>
        </div>
      </div>
    `;
  }
}
var main_default = SocialMediaOpsApp;
