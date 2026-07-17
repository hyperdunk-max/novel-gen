const MANIFEST_URL = "./novel-editor.json";
const SETTINGS_KEY = "novelEditor.settings.v1";
const APP_STATE_KEY = "novelEditor.appState.v1";
const DRAFT_PREFIX = "novelEditor.draft.";
const PROJECT_KEY = "novelEditor.localProject.v1";
const DIRECTORY_DB_NAME = "novelEditor.directory.v1";
const DIRECTORY_STORE_NAME = "handles";
const DIRECTORY_HANDLE_KEY = "lastRoot";
const TRASH_KEY = "novelEditor.trash.v1";
const TERM_LIBRARY_KEY = "novelEditor.termLibrary.v1";
const TERM_TREE_KEY = "novelEditor.termTreeExpanded.v1";
const AGENT_MODEL_KEY = "novelEditor.agentModel.v1";
const LAYOUT_KEY = "novelEditor.layout.v1";
const TERM_LIBRARY_FILE = ".novel-terms.json";
const TOAST_DURATION_MS = 2400;
const SAVE_DELAY_MS = 700;
const TERM_WRITE_DELAY_MS = 350;
const EDITOR_HISTORY_LIMIT = 80;
const EDITOR_HISTORY_IDLE_MS = 900;
const MAX_EXTRACTED_TERMS = 80;
const MAX_TERM_NAME_LENGTH = 12;
const MAX_GENERATION_CONTEXT_CHARS = 1800;
const GENERATION_OUTLINE_FILES = ["大纲.txt", "大纲.md", "outline.txt", "outline.md"];
const TERM_TYPE_FALLBACK = "其他";
const TERM_TYPES = new Set(["人物", "地点", "功法", "道具", "势力", "设定", TERM_TYPE_FALLBACK]);
const TERM_CONFIDENCES = new Set(["high", "medium", "low"]);
const TERM_TREE_KEY_SEPARATOR = "\u001f";
const COMMON_TERM_BLOCKLIST = new Set(["少年", "男人", "女人", "身体", "心里", "天地", "冬天", "木床", "木椅", "木桌", "长须"]);
const CULTIVATION_TERMS = ["炼气", "筑基", "金丹", "元婴", "化神", "合体", "大乘", "渡劫", "道祖", "道种"];
const SETTING_LIMITS = {
  fontSize: { min: 14, max: 28 },
  lineHeight: { min: 1.4, max: 2.4 },
  pageWidth: { min: 520, max: 1200 },
};

const LAYOUT_LIMITS = {
  sidebarWidth: { min: 0, max: 560 },
  termWidth: { min: 0, max: 560 },
  toolbarHeight: { min: 0, max: 240 },
  pageHeight: { min: 420, max: 1600 },
  pageTopOffset: { min: -28, max: 420 },
};

const SIDEBAR_RESTORE_WIDTH = 320;
const TERM_RESTORE_WIDTH = 320;
const TOOLBAR_RESTORE_HEIGHT = 96;
const MAX_INITIAL_EXPANDED_CHAPTERS = 240;

const $ = (selector) => document.querySelector(selector);

const elements = {
  appShell: $("#appShell"),
  toolbar: $("#toolbar"),
  toolbarResize: $("#toolbarResize"),
  showToolbar: $("#showToolbar"),
  tree: $("#tree"),
  bookTitle: $("#bookTitle"),
  editor: $("#editor"),
  chapterTitleRow: $("#chapterTitleRow"),
  chapterNumber: $("#chapterNumber"),
  chapterTitle: $("#chapterTitle"),
  titleUnit: $("#titleUnit"),
  saveState: $("#saveState"),
  wordStats: $("#wordStats"),
  toast: $("#toast"),
  editorContextMenu: $("#editorContextMenu"),
  beautifyPreview: $("#beautifyPreview"),
  beautifyOriginal: $("#beautifyOriginal"),
  beautifyResult: $("#beautifyResult"),
  applyBeautifyPreview: $("#applyBeautifyPreview"),
  rejectBeautifyPreview: $("#rejectBeautifyPreview"),
  cancelBeautifyPreview: $("#cancelBeautifyPreview"),
  findReplaceToggle: $("#findReplaceToggle"),
  findPanel: $("#findPanel"),
  findInput: $("#findInput"),
  replaceInput: $("#replaceInput"),
  findCount: $("#findCount"),
  findPrev: $("#findPrev"),
  findNext: $("#findNext"),
  replaceOne: $("#replaceOne"),
  replaceAll: $("#replaceAll"),
  closeFindPanel: $("#closeFindPanel"),
  trashToggle: $("#trashToggle"),
  trashList: $("#trashList"),
  trashCount: $("#trashCount"),
  autoTerms: $("#autoTerms"),
  summarizeTerms: $("#summarizeTerms"),
  focusMode: $("#focusMode"),
  exitFocusMode: $("#exitFocusMode"),
  addTerm: $("#addTerm"),
  deleteTerm: $("#deleteTerm"),
  termCount: $("#termCount"),
  termList: $("#termList"),
  termDetail: $("#termDetail"),
  termName: $("#termName"),
  termPath: $("#termPath"),
  termAliases: $("#termAliases"),
  termType: $("#termType"),
  termInfo: $("#termInfo"),
  termRelations: $("#termRelations"),
  termOccurrences: $("#termOccurrences"),
  agentModelSelect: $("#agentModelSelect"),
  openModelConfig: $("#openModelConfig"),
  modelConfigModal: $("#modelConfigModal"),
  closeModelConfig: $("#closeModelConfig"),
  cancelModelConfig: $("#cancelModelConfig"),
  saveModelConfig: $("#saveModelConfig"),
  configEnabled: $("#configEnabled"),
  configDefaultModel: $("#configDefaultModel"),
  configProviderList: $("#configProviderList"),
  generatePrompt: $("#generatePrompt"),
  generateChapter: $("#generateChapter"),
  expandChapter: $("#expandChapter"),
  openDirectory: $("#openDirectory"),
  newVolume: $("#newVolume"),
  newChapter: $("#newChapter"),
  saveNow: $("#saveNow"),
  undoEdit: $("#undoEdit"),
  redoEdit: $("#redoEdit"),
  collapseSidebar: $("#collapseSidebar"),
  showSidebar: $("#showSidebar"),
  fontFamily: $("#fontFamily"),
  fontSize: $("#fontSize"),
  lineHeight: $("#lineHeight"),
  pageWidth: $("#pageWidth"),
  fontSizeValue: $("#fontSizeValue"),
  lineHeightValue: $("#lineHeightValue"),
  pageWidthValue: $("#pageWidthValue"),
  nightMode: $("#nightMode"),
  pageShell: $("#pageShell"),
  sidebarResize: $("#sidebarResize"),
  termPanelResize: $("#termPanelResize"),
  pageResizeLeft: $("#pageResizeLeft"),
  pageResizeRight: $("#pageResizeRight"),
  pageResizeTop: $("#pageResizeTop"),
  pageResizeBottom: $("#pageResizeBottom"),
};

const defaultSettings = {
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  fontSize: 18,
  lineHeight: 1.8,
  pageWidth: 760,
  nightMode: false,
};

const defaultAgentConfig = {
  enabled: false,
  models: [],
  defaultModel: "",
};

const defaultLayout = {
  sidebarWidth: 320,
  termWidth: 320,
  toolbarHeight: TOOLBAR_RESTORE_HEIGHT,
  pageHeight: Math.max(420, window.innerHeight - 140),
  pageTopOffset: 0,
};

const sampleProject = {
  title: "夺天记",
  source: "sample",
  volumes: [
    {
      id: "sample:volume:1",
      title: "第一卷 初鸣",
      chapters: [
        {
          id: "sample:chapter:1",
          title: "第一章",
          content:
            "第一章\n\n大雪皑皑，万籁俱寂，落霞谷的冬天甚是难熬。在这一片白茫茫的天地正中，隐约能看到一个草庐。\n\n草庐十分简陋，顶是由稻草做的，若不是天天扫雪，恐怕早被这鹅毛压塌，庐内除了一张木床，一把木椅和一张木桌，别无长物。\n\n床上端坐着一名男人，束发长须，看起来很久没有打理。可透过浓密的毛发看来这男人，或许应该称呼为少年，脸上还残留着些许稚嫩，看起来只有约莫十七八岁的样子。",
        },
      ],
    },
  ],
};

const state = {
  project: null,
  rootHandle: null,
  activeChapterId: null,
  activeVolumeId: null,
  selectedNode: { type: "book", id: "book" },
  expanded: new Set(["book"]),
  trashExpanded: true,
  trash: [],
  terms: [],
  termMatchEntries: null,
  termExpanded: new Set(),
  hasSavedTermExpanded: false,
  selectedTermId: null,
  agentConfig: { ...defaultAgentConfig },
  selectedAgentModel: "",
  termWriteTimer: null,
  saveTimer: null,
  savePromise: Promise.resolve(),
  editorHistory: {
    chapterId: null,
    undo: [],
    redo: [],
    lastText: "",
    applying: false,
    pendingText: null,
    pendingTimer: null,
  },
  dirty: false,
  settings: { ...defaultSettings },
  layout: { ...defaultLayout },
  editorContextSelection: null,
  editorContextBusy: false,
  beautifyPreviewSelection: null,
  find: {
    query: "",
    replace: "",
    matches: [],
    activeIndex: -1,
  },
  editableAgentConfig: null,
  lastEditorInputType: "",
  focusMode: false,
};

const collator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

function naturalSort(a, b) {
  return collator.compare(a.title || a.name, b.title || b.name);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function openDirectoryHandleDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DIRECTORY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DIRECTORY_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withDirectoryHandleStore(mode, task) {
  const db = await openDirectoryHandleDB();
  if (!db) return null;
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(DIRECTORY_STORE_NAME, mode);
      const store = transaction.objectStore(DIRECTORY_STORE_NAME);
      const request = task(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function readCachedDirectoryHandle() {
  try {
    return await withDirectoryHandleStore("readonly", (store) => store.get(DIRECTORY_HANDLE_KEY));
  } catch {
    return null;
  }
}

async function writeCachedDirectoryHandle(handle) {
  try {
    await withDirectoryHandleStore("readwrite", (store) => store.put(handle, DIRECTORY_HANDLE_KEY));
  } catch {
    // The editor can still work without directory restore support.
  }
}

async function removeCachedDirectoryHandle() {
  try {
    await withDirectoryHandleStore("readwrite", (store) => store.delete(DIRECTORY_HANDLE_KEY));
  } catch {
    // Best-effort cleanup only.
  }
}

async function ensureDirectoryPermission(handle, request = false) {
  if (!handle) return false;
  const options = { mode: "readwrite" };
  if (typeof handle.queryPermission === "function") {
    const current = await handle.queryPermission(options);
    if (current === "granted") return true;
  }
  if (request && typeof handle.requestPermission === "function") {
    return (await handle.requestPermission(options)) === "granted";
  }
  return false;
}

function sanitizeAppState(value = {}) {
  const selectedType = ["book", "volume", "chapter", "term"].includes(value.selectedNode?.type)
    ? value.selectedNode.type
    : "book";
  return {
    activeChapterId: typeof value.activeChapterId === "string" ? value.activeChapterId : "",
    activeVolumeId: typeof value.activeVolumeId === "string" ? value.activeVolumeId : "",
    selectedNode: {
      type: selectedType,
      id: typeof value.selectedNode?.id === "string" ? value.selectedNode.id : "",
    },
    selectedTermId: typeof value.selectedTermId === "string" ? value.selectedTermId : "",
    expanded: Array.isArray(value.expanded) ? value.expanded.filter((id) => typeof id === "string") : [],
    focusMode: Boolean(value.focusMode),
    nightMode: typeof value.nightMode === "boolean" ? value.nightMode : null,
  };
}

function saveAppState() {
  writeJSON(APP_STATE_KEY, {
    activeChapterId: state.activeChapterId || "",
    activeVolumeId: state.activeVolumeId || "",
    selectedNode: state.selectedNode || { type: "book", id: "book" },
    selectedTermId: state.selectedTermId || "",
    expanded: [...(state.expanded || new Set())],
    focusMode: Boolean(state.focusMode),
    nightMode: Boolean(state.settings?.nightMode),
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, TOAST_DURATION_MS);
}

function timeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function normalizeColor(value) {
  if (!value) return value;
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = value;
  return ctx.fillStyle;
}

function clampNumber(value, limits, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(limits.max, Math.max(limits.min, number));
}

function normalizeTermType(type) {
  const value = String(type || "").trim();
  return TERM_TYPES.has(value) ? value : TERM_TYPE_FALLBACK;
}

function inferTermPathRoot(term = {}) {
  const type = normalizeTermType(term.type);
  const name = normalizeTermName(term.name);
  if (type === "人物") return ["人物"];
  if (type === "地点") return ["地点"];
  if (type === "势力") return ["势力"];
  if (/(?:炼气|筑基|金丹|元婴|化神|合体|大乘|渡劫|境|期|阶|重)$/.test(name)) {
    return ["世界设定", "修炼体系", "境界"];
  }
  if (/(?:丹|丸|散|膏|药)$/.test(name)) return ["世界设定", "丹药"];
  if (/(?:符|剑|刀|炉|鼎|印|镜|钟|幡|阵盘|法器|灵器|道种|碎片|测灵石|海图|账本)$/.test(name)) {
    return ["世界设定", "法器道具"];
  }
  if (/(?:灵根|血脉|规则|天道|道祖|体质)$/.test(name)) return ["世界设定", "修炼体系"];
  if (type === "功法") return ["世界设定", "功法"];
  if (type === "道具") return ["世界设定", "法器道具"];
  if (type === "设定") return ["世界设定", "设定"];
  return ["其他"];
}

function normalizeTermPath(path, term = {}) {
  const name = normalizeTermName(term.name);
  let segments = Array.isArray(path) ? path.map(normalizeTermName).filter(Boolean) : [];
  if (!segments.length) segments = [...inferTermPathRoot(term), name].filter(Boolean);

  if (name) {
    segments = segments.filter((segment, index) => segment !== name || index === segments.length - 1);
    if (segments[segments.length - 1] !== name) segments.push(name);
  }

  return segments.filter((segment, index) => segment && segment !== segments[index - 1]);
}

function mergeTermPath(existingPath, incomingPath, term = {}) {
  const existing = normalizeTermPath(existingPath, term);
  const incoming = normalizeTermPath(incomingPath, term);
  if (existing.length > incoming.length && existing[existing.length - 1] === incoming[incoming.length - 1]) {
    return existing;
  }
  return incoming;
}

function normalizeRelations(relations) {
  const map = new Map();
  (Array.isArray(relations) ? relations : []).forEach((relation) => {
    const type = String(relation?.type || "相关").trim() || "相关";
    const target = normalizeTermName(relation?.target || relation?.name || relation);
    if (!target) return;
    const key = `${type}${TERM_TREE_KEY_SEPARATOR}${target}`;
    if (!map.has(key)) map.set(key, { type, target });
  });
  return [...map.values()];
}

function normalizeConfidence(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (TERM_CONFIDENCES.has(normalized)) return normalized;
  if (["高", "强", "确定"].includes(String(value || "").trim())) return "high";
  if (["低", "弱", "不确定"].includes(String(value || "").trim())) return "low";
  return "medium";
}

function sanitizeSettings(settings = {}) {
  const legacyNightMode =
    normalizeColor(settings.bgColor) === "#20221f" || normalizeColor(settings.textColor) === "#ece6d8";
  const nightMode = typeof settings.nightMode === "boolean" ? settings.nightMode : legacyNightMode;

  return {
    ...defaultSettings,
    fontFamily:
      typeof settings.fontFamily === "string" && settings.fontFamily.trim()
        ? settings.fontFamily
        : defaultSettings.fontFamily,
    fontSize: clampNumber(settings.fontSize, SETTING_LIMITS.fontSize, defaultSettings.fontSize),
    lineHeight: clampNumber(settings.lineHeight, SETTING_LIMITS.lineHeight, defaultSettings.lineHeight),
    pageWidth: clampNumber(settings.pageWidth, SETTING_LIMITS.pageWidth, defaultSettings.pageWidth),
    nightMode,
  };
}

function sanitizeLayout(layout = {}) {
  return {
    ...defaultLayout,
    sidebarWidth: Math.round(clampNumber(layout.sidebarWidth, LAYOUT_LIMITS.sidebarWidth, defaultLayout.sidebarWidth)),
    termWidth: Math.round(clampNumber(layout.termWidth, LAYOUT_LIMITS.termWidth, defaultLayout.termWidth)),
    toolbarHeight: Math.round(clampNumber(layout.toolbarHeight, LAYOUT_LIMITS.toolbarHeight, defaultLayout.toolbarHeight)),
    pageHeight: Math.round(clampNumber(layout.pageHeight, LAYOUT_LIMITS.pageHeight, defaultLayout.pageHeight)),
    pageTopOffset: Math.round(clampNumber(layout.pageTopOffset, LAYOUT_LIMITS.pageTopOffset, defaultLayout.pageTopOffset)),
  };
}

function normalizeAgentModel(model) {
  if (typeof model === "string") {
    const id = model.trim();
    return id ? { id, model: id, label: id, available: true } : null;
  }

  const id = String(model?.id || "").trim();
  if (!id) return null;
  return {
    id,
    model: String(model.model || id).trim(),
    providerId: String(model.providerId || "").trim(),
    label: String(model.label || model.name || id).trim(),
    available: model.available !== false,
  };
}

function sanitizeAgentConfig(config = {}) {
  const models = Array.isArray(config.models) ? config.models.map(normalizeAgentModel).filter(Boolean) : [];
  const defaultModel = String(config.defaultModel || models[0]?.id || "").trim();
  return {
    enabled: Boolean(config.enabled && models.length),
    models,
    defaultModel,
  };
}

async function loadAgentConfig() {
  try {
    const response = await fetch("./api/agent-config", { cache: "no-store" });
    if (!response.ok) throw new Error("agent config unavailable");
    return sanitizeAgentConfig(await readAPIJSON(response));
  } catch {
    return { ...defaultAgentConfig };
  }
}

async function readAPIJSON(response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    const isHTML = /^\s*<!doctype|\s*<html[\s>]/i.test(text);
    const message = isHTML
      ? "后台 API 返回了页面而不是 JSON，请确认正在使用 server.js 启动的地址"
      : "后台 API 返回内容不是 JSON";
    throw new Error(message);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("后台 API 返回了无效 JSON");
  }
}

function getSavedAgentModel() {
  return localStorage.getItem(AGENT_MODEL_KEY);
}

function chooseAgentModel(config) {
  const models = config.enabled ? config.models : [];
  const availableModels = models.filter((model) => model.available);
  const saved = getSavedAgentModel();
  if (saved) {
    const savedModel = models.find((model) => model.id === saved || model.model === saved);
    if (savedModel?.available) return savedModel.id;
  }
  const defaultModel = models.find(
    (model) => model.available && (model.id === config.defaultModel || model.model === config.defaultModel),
  );
  if (defaultModel) return defaultModel.id;
  return availableModels[0]?.id || models[0]?.id || "";
}

function renderAgentConfig() {
  elements.agentModelSelect.replaceChildren();

  const localOption = document.createElement("option");
  localOption.value = "";
  localOption.textContent = state.agentConfig.enabled ? "本地规则" : "本地规则（无后台模型）";
  elements.agentModelSelect.append(localOption);

  const models = state.agentConfig.enabled ? state.agentConfig.models : [];
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label || model.name || model.id;
    if (!model.available) option.textContent += "（未配置 Key）";
    option.title = model.model || model.id;
    elements.agentModelSelect.append(option);
  });

  elements.agentModelSelect.value = state.selectedAgentModel;
  elements.agentModelSelect.disabled = false;
}

let agentConfigRefreshId = 0;

async function refreshAgentConfig(configPromise = loadAgentConfig()) {
  const refreshId = ++agentConfigRefreshId;
  const config = await configPromise.catch(() => ({ ...defaultAgentConfig }));
  if (refreshId !== agentConfigRefreshId) return;

  state.agentConfig = config;
  state.selectedAgentModel = chooseAgentModel(state.agentConfig);
  renderAgentConfig();
  updateTermActionState();
}

async function loadEditableAgentConfig() {
  const response = await fetch("./api/agent-config/edit", { cache: "no-store" });
  const data = await readAPIJSON(response);
  if (!response.ok) throw new Error(data?.message || "读取模型配置失败");
  return data;
}

function modelConfigOptions(config) {
  return (config.providers || []).flatMap((provider) => {
    return (provider.models || [])
      .filter((model) => model.id)
      .map((model) => ({
        id: `${provider.id}:${model.id}`,
        label: `${provider.label || provider.id} / ${model.label || model.id}`,
      }));
  });
}

function refreshConfigDefaultModel(config, preferred = elements.configDefaultModel.value) {
  const options = modelConfigOptions(config);
  elements.configDefaultModel.replaceChildren();

  options.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label;
    elements.configDefaultModel.append(option);
  });

  elements.configDefaultModel.disabled = !options.length;
  elements.configDefaultModel.value = options.some((model) => model.id === preferred) ? preferred : options[0]?.id || "";
}

function renderModelConfigModal(config) {
  state.editableAgentConfig = config;
  elements.configEnabled.checked = Boolean(config.enabled);
  refreshConfigDefaultModel(config, config.defaultModel);

  elements.configProviderList.replaceChildren();
  (config.providers || []).forEach((provider) => {
    const section = document.createElement("section");
    section.className = "config-provider";
    section.dataset.providerId = provider.id;
    section.innerHTML = `
      <header>
        <div>
          <strong></strong>
          <small></small>
        </div>
        <button class="secondary-button compact-button config-add-model" type="button">新增模型</button>
      </header>
      <label class="config-field">
        <span>API Key</span>
        <input class="config-api-key" type="password" autocomplete="off" placeholder="填入 ${provider.label || provider.id} API Key" />
      </label>
      <label class="config-field">
        <span>Base URL</span>
        <input class="config-base-url" type="text" autocomplete="off" />
      </label>
      <div class="config-model-list"></div>
    `;
    section.querySelector("strong").textContent = provider.label || provider.id;
    section.querySelector("small").textContent = provider.id;
    section.querySelector(".config-api-key").value = provider.apiKey || "";
    section.querySelector(".config-base-url").value = provider.baseUrl || "";
    const modelList = section.querySelector(".config-model-list");
    (provider.models || []).forEach((model, index) => {
      const row = document.createElement("div");
      row.className = "config-model-row";
      row.dataset.modelIndex = String(index);
      row.innerHTML = `
        <label class="config-field">
          <span>Model</span>
          <input class="config-model-id" type="text" autocomplete="off" placeholder="deepseek-chat" />
        </label>
        <label class="config-field">
          <span>显示名</span>
          <input class="config-model-label" type="text" autocomplete="off" placeholder="DeepSeek Chat" />
        </label>
        <button class="icon-button compact-button config-delete-model" type="button" title="删除模型" aria-label="删除模型">
          <span class="icon icon-close" aria-hidden="true"></span>
        </button>
      `;
      row.querySelector(".config-model-id").value = model.id || "";
      row.querySelector(".config-model-label").value = model.label || model.id || "";
      modelList.append(row);
    });
    elements.configProviderList.append(section);
  });
}

async function openModelConfigModal() {
  try {
    const config = await loadEditableAgentConfig();
    renderModelConfigModal(config);
    elements.modelConfigModal.hidden = false;
  } catch (error) {
    showToast(error.message || "读取模型配置失败");
  }
}

function closeModelConfigModal() {
  elements.modelConfigModal.hidden = true;
  state.editableAgentConfig = null;
}

function collectModelConfigModal() {
  const config = state.editableAgentConfig || {};
  const providers = (config.providers || []).map((provider) => {
    const section = elements.configProviderList.querySelector(`[data-provider-id="${CSS.escape(provider.id)}"]`);
    const models = [...(section?.querySelectorAll(".config-model-row") || [])]
      .map((row) => ({
        id: row.querySelector(".config-model-id")?.value.trim() || "",
        label: row.querySelector(".config-model-label")?.value.trim() || "",
      }))
      .filter((model) => model.id);
    return {
      ...provider,
      apiKey: section?.querySelector(".config-api-key")?.value.trim() || "",
      baseUrl: section?.querySelector(".config-base-url")?.value.trim() || provider.baseUrl || "",
      models,
    };
  });
  return {
    ...config,
    enabled: elements.configEnabled.checked,
    defaultModel: elements.configDefaultModel.value,
    providers,
  };
}

function refreshModelConfigFromForm() {
  const selected = elements.configDefaultModel.value;
  const config = collectModelConfigModal();
  state.editableAgentConfig = config;
  refreshConfigDefaultModel(config, selected);
}

function addModelConfigRow(providerId) {
  const config = collectModelConfigModal();
  const provider = (config.providers || []).find((item) => item.id === providerId);
  if (!provider) return;
  provider.models = [...(provider.models || []), { id: "", label: "" }];
  renderModelConfigModal(config);
  const section = elements.configProviderList.querySelector(`[data-provider-id="${CSS.escape(providerId)}"]`);
  section?.querySelector(".config-model-row:last-child .config-model-id")?.focus();
}

function deleteModelConfigRow(providerId, row) {
  const config = collectModelConfigModal();
  const totalModels = (config.providers || []).reduce((sum, provider) => sum + (provider.models || []).length, 0);
  if (totalModels <= 1) {
    showToast("至少保留一个模型配置");
    return;
  }

  const provider = (config.providers || []).find((item) => item.id === providerId);
  const index = Number(row?.dataset.modelIndex);
  if (!provider || !Number.isInteger(index)) return;
  provider.models = (provider.models || []).filter((_, itemIndex) => itemIndex !== index);
  renderModelConfigModal(config);
}

async function saveModelConfigModal() {
  const payload = collectModelConfigModal();
  elements.saveModelConfig.disabled = true;
  try {
    const response = await fetch("./api/agent-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readAPIJSON(response);
    if (!response.ok) throw new Error(data?.message || "保存模型配置失败");

    agentConfigRefreshId += 1;
    state.agentConfig = sanitizeAgentConfig(data.config);
    state.selectedAgentModel = chooseAgentModel(state.agentConfig);
    localStorage.setItem(AGENT_MODEL_KEY, state.selectedAgentModel);
    renderAgentConfig();
    updateTermActionState();
    closeModelConfigModal();
    showToast("模型配置已保存");
  } catch (error) {
    showToast(error.message || "保存模型配置失败");
  } finally {
    elements.saveModelConfig.disabled = false;
  }
}

function saveSettings() {
  writeJSON(SETTINGS_KEY, state.settings);
  saveAppState();
}

function applySettings() {
  const root = document.documentElement;
  root.style.setProperty("--novel-font", state.settings.fontFamily);
  root.style.setProperty("--novel-size", `${state.settings.fontSize}px`);
  root.style.setProperty("--novel-line", state.settings.lineHeight);
  root.style.setProperty("--page-width", `${state.settings.pageWidth}px`);
  root.style.removeProperty("--reader-bg");
  root.style.removeProperty("--reader-ink");
  root.classList.toggle("is-night", Boolean(state.settings.nightMode));

  elements.fontFamily.value = state.settings.fontFamily;
  elements.fontSize.value = state.settings.fontSize;
  elements.lineHeight.value = state.settings.lineHeight;
  elements.pageWidth.value = state.settings.pageWidth;
  elements.nightMode.checked = Boolean(state.settings.nightMode);
  elements.fontSizeValue.value = state.settings.fontSize;
  elements.lineHeightValue.value = state.settings.lineHeight;
  elements.pageWidthValue.value = state.settings.pageWidth;
}

function saveLayout() {
  writeJSON(LAYOUT_KEY, state.layout);
}

function applyLayout() {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-width", `${SIDEBAR_RESTORE_WIDTH}px`);
  root.style.setProperty("--term-width", `${TERM_RESTORE_WIDTH}px`);
  root.style.setProperty("--toolbar-height", `${TOOLBAR_RESTORE_HEIGHT}px`);
  root.style.setProperty("--page-height", `${state.layout.pageHeight}px`);
  root.style.setProperty("--page-top-offset", `${state.layout.pageTopOffset}px`);
  elements.appShell.classList.remove("is-sidebar-zero", "is-term-zero", "is-toolbar-zero");
  requestAnimationFrame(syncEditorHeight);
}

function setFocusMode(enabled) {
  state.focusMode = Boolean(enabled);
  elements.appShell.classList.toggle("is-focus-mode", state.focusMode);
  elements.focusMode?.setAttribute("aria-pressed", state.focusMode ? "true" : "false");
  if (elements.exitFocusMode) elements.exitFocusMode.hidden = !state.focusMode;
  hideEditorContextMenu();
  saveAppState();
  requestAnimationFrame(() => {
    syncEditorHeight();
    if (state.focusMode) elements.editor?.focus();
  });
}

function getSelectedAgentModelConfig() {
  return state.agentConfig.models.find((model) => model.id === state.selectedAgentModel || model.model === state.selectedAgentModel);
}

function isSelectedAgentModelAvailable() {
  return Boolean(state.selectedAgentModel && getSelectedAgentModelConfig()?.available);
}

function updateTermActionState() {
  const hasChapter = Boolean(state.activeChapterId);
  elements.autoTerms.disabled = !hasChapter;
  elements.summarizeTerms.disabled = !hasChapter || !state.terms.length || !isSelectedAgentModelAvailable();
  elements.generateChapter.disabled = !state.project || !isSelectedAgentModelAvailable();
  elements.expandChapter.disabled = !hasChapter || !isSelectedAgentModelAvailable();
  elements.deleteTerm.disabled = state.selectedNode.type !== "term" || !state.selectedTermId;
}

function setSelection(type, id = "") {
  state.selectedNode = { type, id };
  state.selectedTermId = type === "term" ? id : null;
}

function canDeleteSelected() {
  return ["volume", "chapter", "term"].includes(state.selectedNode.type) && Boolean(state.selectedNode.id);
}

function updateStats(text) {
  const chars = text.replace(/\s/g, "").length;
  const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim()).length;
  elements.wordStats.textContent = `${chars} 字 · ${paragraphs} 段`;
}

function syncEditorHeight() {
  const editor = elements.editor;
  const pageStyles = elements.pageShell ? getComputedStyle(elements.pageShell) : null;
  const pageHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--page-height")) || 0;
  const verticalPadding = pageStyles ? Number.parseFloat(pageStyles.paddingTop) + Number.parseFloat(pageStyles.paddingBottom) : 0;
  const chapterHeadHeight = elements.pageShell?.querySelector(".chapter-head")?.offsetHeight || 0;
  const minPageEditorHeight = Math.max(180, pageHeight - verticalPadding - chapterHeadHeight - 28);
  editor.style.height = "auto";
  editor.style.height = `${Math.max(editor.scrollHeight + 2, minPageEditorHeight)}px`;
}

function isEditorBlockNode(node) {
  return (
    node?.nodeType === Node.ELEMENT_NODE &&
    (node.classList?.contains("editor-paragraph") || ["DIV", "P", "LI"].includes(node.tagName))
  );
}

function serializeEditorNode(node) {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return "";
  if (isEditorBlockNode(node)) {
    const children = [...node.childNodes];
    if (children.length === 1 && children[0].nodeType === Node.ELEMENT_NODE && children[0].tagName === "BR") return "";
    return serializeEditorNodes(node.childNodes);
  }
  if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") return "\n";
  return serializeEditorNodes(node.childNodes);
}

function serializeEditorNodes(nodes) {
  let text = "";
  let hasRenderedNode = false;
  let previousNodeWasBlock = false;
  let previousBlockWasEmpty = false;

  [...nodes].forEach((node) => {
    const isBlock = isEditorBlockNode(node);
    if (isBlock && hasRenderedNode && previousNodeWasBlock && (!text.endsWith("\n") || previousBlockWasEmpty)) {
      text += "\n";
    }

    const value = serializeEditorNode(node);
    text += value;

    if (isBlock) {
      hasRenderedNode = true;
      previousNodeWasBlock = true;
      previousBlockWasEmpty = value.length === 0;
      return;
    }

    if (value.length > 0) {
      hasRenderedNode = true;
      previousNodeWasBlock = false;
      previousBlockWasEmpty = false;
    }
  });

  return text;
}

function normalizeEditorPlainText(text) {
  return String(text || "").replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function getEditorText() {
  return normalizeEditorPlainText(serializeEditorNode(elements.editor));
}

function setEditorPlaceholder(text) {
  elements.editor.dataset.placeholder = text;
}

function setEditorEnabled(enabled) {
  elements.editor.setAttribute("contenteditable", enabled ? "true" : "false");
}

function setEditorText(text, highlight = true) {
  renderEditorText(text, highlight);
  requestAnimationFrame(syncEditorHeight);
}

function getEditorSelectionInfo() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  if (!elements.editor.contains(range.commonAncestorContainer)) return null;

  const selectedText = normalizeEditorPlainText(serializeEditorNode(range.cloneContents()));
  if (!selectedText.trim()) return null;

  const before = range.cloneRange();
  before.selectNodeContents(elements.editor);
  before.setEnd(range.startContainer, range.startOffset);

  const start = normalizeEditorPlainText(serializeEditorNode(before.cloneContents())).length;
  const end = start + selectedText.length;
  return { start, end, text: selectedText };
}

function hideEditorContextMenu() {
  if (!elements.editorContextMenu) return;
  elements.editorContextMenu.hidden = true;
}

function closeBeautifyPreview() {
  if (!elements.beautifyPreview) return;
  elements.beautifyPreview.hidden = true;
  state.beautifyPreviewSelection = null;
}

function openBeautifyPreview(selectionInfo, content) {
  state.beautifyPreviewSelection = selectionInfo;
  elements.beautifyOriginal.value = selectionInfo.text;
  elements.beautifyResult.value = content;
  elements.beautifyPreview.hidden = false;
  requestAnimationFrame(() => {
    elements.beautifyResult.focus();
    elements.beautifyResult.setSelectionRange(0, 0);
  });
}

function setEditorContextMenuBusy(busy) {
  state.editorContextBusy = Boolean(busy);
  if (!elements.editorContextMenu) return;
  elements.editorContextMenu.querySelectorAll("button").forEach((button) => {
    button.disabled = state.editorContextBusy;
  });
}

function showEditorContextMenu(event, selectionInfo) {
  if (!elements.editorContextMenu) return;
  if (state.editorContextBusy) return;
  state.editorContextSelection = selectionInfo;
  elements.editorContextMenu.hidden = false;

  const rect = elements.editorContextMenu.getBoundingClientRect();
  const x = Math.min(event.clientX, window.innerWidth - rect.width - 8);
  const y = Math.min(event.clientY, window.innerHeight - rect.height - 8);
  elements.editorContextMenu.style.left = `${Math.max(8, x)}px`;
  elements.editorContextMenu.style.top = `${Math.max(8, y)}px`;
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function replaceEditorSelectionText(selectionInfo, replacement) {
  if (!selectionInfo) throw new Error("没有可替换的选区");
  const current = getEditorText();
  if (current.slice(selectionInfo.start, selectionInfo.end) !== selectionInfo.text) {
    throw new Error("选区内容已变化，请重新选择后再操作");
  }

  const next = `${current.slice(0, selectionInfo.start)}${replacement}${current.slice(selectionInfo.end)}`;
  await replaceEditorTextWithHistory(next, { saveNow: false });
}

function normalizeBeautifiedText(text) {
  return String(text || "").trim();
}

async function beautifySelectionWithLLM(text) {
  if (!state.agentConfig.enabled || !state.selectedAgentModel) {
    throw new Error("请先在后台配置可用模型");
  }
  if (!isSelectedAgentModelAvailable()) {
    throw new Error("当前模型未配置 API Key，请在后台配置后再使用");
  }

  const chapter = findChapter();
  const response = await fetch("./api/beautify-selection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.selectedAgentModel,
      chapterTitle: chapter ? chapterDisplayTitle(chapter) : "当前章节",
      text,
      currentContent: getEditorText(),
    }),
  });
  const data = await readAPIJSON(response);
  if (!response.ok) {
    throw new Error(data?.message || `Agent 请求失败：${response.status}`);
  }
  return normalizeBeautifiedText(data?.content || data?.text || "");
}

async function handleEditorContextCommand(command) {
  if (state.editorContextBusy) return;
  const selectionInfo = state.editorContextSelection;
  hideEditorContextMenu();
  if (!selectionInfo) return;

  try {
    if (command === "copy") {
      await writeClipboardText(selectionInfo.text);
      showToast("已复制选中文本");
      return;
    }

    if (command === "cut") {
      await writeClipboardText(selectionInfo.text);
      await replaceEditorSelectionText(selectionInfo, "");
      showToast("已剪切选中文本");
      return;
    }

    if (command === "beautify") {
      setEditorContextMenuBusy(true);
      showToast("正在自动美化...");
      const content = await beautifySelectionWithLLM(selectionInfo.text);
      if (!content) throw new Error("模型没有返回美化文本");
      openBeautifyPreview(selectionInfo, content);
      showToast("美化结果已生成，请确认");
    }
  } catch (error) {
    showToast(error.message || "操作失败");
  } finally {
    setEditorContextMenuBusy(false);
    state.editorContextSelection = null;
  }
}

async function applyBeautifyPreview() {
  const selectionInfo = state.beautifyPreviewSelection;
  if (!selectionInfo) return;
  const content = normalizeBeautifiedText(elements.beautifyResult.value);
  if (!content) {
    showToast("美化后内容不能为空");
    elements.beautifyResult.focus();
    return;
  }

  try {
    await replaceEditorSelectionText(selectionInfo, content);
    closeBeautifyPreview();
    showToast("选中文本已美化");
  } catch (error) {
    showToast(error.message || "应用失败，请重新选择后再试");
  }
}

function findLiteralMatches(text, query) {
  const source = String(text || "");
  const needle = String(query || "");
  if (!needle) return [];

  const lowerSource = source.toLocaleLowerCase();
  const lowerNeedle = needle.toLocaleLowerCase();
  const matches = [];
  let index = 0;
  while (index <= lowerSource.length - lowerNeedle.length) {
    const found = lowerSource.indexOf(lowerNeedle, index);
    if (found === -1) break;
    matches.push({ start: found, end: found + needle.length });
    index = found + Math.max(needle.length, 1);
  }
  return matches;
}

function updateFindControls() {
  const total = state.find.matches.length;
  const current = total && state.find.activeIndex >= 0 ? state.find.activeIndex + 1 : 0;
  elements.findCount.textContent = `${current}/${total}`;
  const disabled = !total;
  elements.findPrev.disabled = disabled;
  elements.findNext.disabled = disabled;
  elements.replaceOne.disabled = disabled;
  elements.replaceAll.disabled = disabled;
}

function refreshFindMatches({ render = true, keepIndex = true } = {}) {
  const previousMatch = state.find.matches[state.find.activeIndex];
  state.find.query = elements.findInput.value;
  state.find.replace = elements.replaceInput.value;
  state.find.matches = findLiteralMatches(getEditorText(), state.find.query);

  if (!state.find.matches.length) {
    state.find.activeIndex = -1;
  } else if (keepIndex && previousMatch) {
    const same = state.find.matches.findIndex((match) => match.start >= previousMatch.start);
    state.find.activeIndex = same === -1 ? state.find.matches.length - 1 : same;
  } else if (state.find.activeIndex < 0) {
    state.find.activeIndex = 0;
  } else {
    state.find.activeIndex = Math.min(state.find.activeIndex, state.find.matches.length - 1);
  }

  updateFindControls();
  if (render) renderEditorText(getEditorText(), true);
}

function openFindPanel({ replaceFocus = false } = {}) {
  elements.findPanel.hidden = false;
  const selectionInfo = getEditorSelectionInfo();
  if (selectionInfo && !selectionInfo.text.includes("\n")) {
    elements.findInput.value = selectionInfo.text;
  }
  refreshFindMatches({ render: true, keepIndex: false });
  requestAnimationFrame(() => {
    const target = replaceFocus ? elements.replaceInput : elements.findInput;
    target.focus();
    target.select?.();
  });
}

function closeFindPanel() {
  elements.findPanel.hidden = true;
  state.find.query = "";
  state.find.replace = "";
  state.find.matches = [];
  state.find.activeIndex = -1;
  updateFindControls();
  renderEditorText(getEditorText(), true);
}

function getTextPositionInEditor(offset) {
  const target = Math.max(0, Number(offset) || 0);
  const walker = document.createTreeWalker(elements.editor, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let lastNode = null;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.nodeValue.length;
    lastNode = node;
    if (target <= currentOffset + length) {
      return { node, offset: Math.max(0, Math.min(length, target - currentOffset)) };
    }
    currentOffset += length;
  }

  if (lastNode) return { node: lastNode, offset: lastNode.nodeValue.length };
  return { node: elements.editor, offset: 0 };
}

function selectEditorTextRange(start, end) {
  const startPosition = getTextPositionInEditor(start);
  const endPosition = getTextPositionInEditor(end);
  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  const active = elements.editor.querySelector(".find-mark.is-active");
  active?.scrollIntoView({ block: "center", inline: "nearest" });
}

function goToFindMatch(delta = 1) {
  if (!state.find.matches.length) return;
  state.find.activeIndex = (state.find.activeIndex + delta + state.find.matches.length) % state.find.matches.length;
  updateFindControls();
  renderEditorText(getEditorText(), true);
  const match = state.find.matches[state.find.activeIndex];
  requestAnimationFrame(() => selectEditorTextRange(match.start, match.end));
}

async function replaceCurrentFindMatch() {
  if (!state.find.matches.length || state.find.activeIndex < 0) return;
  const match = state.find.matches[state.find.activeIndex];
  const text = getEditorText();
  const next = `${text.slice(0, match.start)}${elements.replaceInput.value}${text.slice(match.end)}`;
  await replaceEditorTextWithHistory(next, { saveNow: false });
  refreshFindMatches({ render: true, keepIndex: true });
  if (state.find.matches.length) {
    const active = state.find.matches[state.find.activeIndex];
    requestAnimationFrame(() => selectEditorTextRange(active.start, active.end));
  }
}

async function replaceAllFindMatches() {
  const query = elements.findInput.value;
  if (!query) return;
  const text = getEditorText();
  const matches = findLiteralMatches(text, query);
  if (!matches.length) return;

  let cursor = 0;
  let next = "";
  matches.forEach((match) => {
    next += text.slice(cursor, match.start);
    next += elements.replaceInput.value;
    cursor = match.end;
  });
  next += text.slice(cursor);

  await replaceEditorTextWithHistory(next, { saveNow: false });
  refreshFindMatches({ render: true, keepIndex: false });
  showToast(`已替换 ${matches.length} 处`);
}

function resetEditorHistory(chapterId = state.activeChapterId, text = "") {
  window.clearTimeout(state.editorHistory.pendingTimer);
  state.editorHistory = {
    chapterId,
    undo: chapterId ? [String(text || "")] : [],
    redo: [],
    lastText: String(text || ""),
    applying: false,
    pendingText: null,
    pendingTimer: null,
  };
  updateEditorHistoryControls();
}

function ensureEditorHistory(text = getEditorText()) {
  if (!state.activeChapterId) return null;
  if (state.editorHistory.chapterId !== state.activeChapterId) {
    resetEditorHistory(state.activeChapterId, text);
  }
  return state.editorHistory;
}

function recordEditorSnapshot(text = getEditorText(), { clearRedo = true } = {}) {
  const history = ensureEditorHistory(text);
  if (!history || history.applying) return;
  window.clearTimeout(history.pendingTimer);
  history.pendingTimer = null;
  history.pendingText = null;

  const value = String(text || "");
  if (value === history.lastText) return;
  history.undo.push(value);
  if (history.undo.length > EDITOR_HISTORY_LIMIT) history.undo.splice(0, history.undo.length - EDITOR_HISTORY_LIMIT);
  if (clearRedo) history.redo = [];
  history.lastText = value;
  updateEditorHistoryControls();
}

function updateEditorHistoryControls() {
  const history = state.editorHistory;
  const hasChapter = Boolean(state.activeChapterId);
  const currentText = hasChapter ? getEditorText() : "";
  const hasPendingChange = hasChapter && currentText !== history.lastText;
  if (elements.undoEdit) elements.undoEdit.disabled = !hasChapter || (!hasPendingChange && history.undo.length <= 1);
  if (elements.redoEdit) elements.redoEdit.disabled = !hasChapter || !history.redo.length;
}

function scheduleEditorHistorySnapshot(text = getEditorText()) {
  const history = ensureEditorHistory(text);
  if (!history || history.applying) return;

  const value = String(text || "");
  if (value === history.lastText) {
    updateEditorHistoryControls();
    return;
  }

  history.redo = [];
  history.pendingText = value;
  window.clearTimeout(history.pendingTimer);

  const inputType = state.lastEditorInputType;
  const immediate = /insertParagraph|insertLineBreak|insertFromPaste|deleteByCut/i.test(inputType);
  if (immediate) {
    recordEditorSnapshot(value);
    return;
  }

  history.pendingTimer = window.setTimeout(() => {
    if (history.pendingText !== null) recordEditorSnapshot(history.pendingText);
  }, EDITOR_HISTORY_IDLE_MS);
  updateEditorHistoryControls();
}

function placeEditorCaretAtEnd() {
  const range = document.createRange();
  range.selectNodeContents(elements.editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function applyEditorHistoryText(text) {
  const history = ensureEditorHistory(text);
  if (!history) return;

  history.applying = true;
  setEditorText(text, true);
  history.applying = false;
  if (!elements.findPanel.hidden) refreshFindMatches({ render: true, keepIndex: true });

  const chapter = findChapter();
  if (chapter) chapter.content = text;
  updateStats(text);
  queueSave();
  requestAnimationFrame(placeEditorCaretAtEnd);
}

function undoEditorChange() {
  const history = ensureEditorHistory();
  if (!history) return false;

  const current = getEditorText();
  if (current !== history.lastText) recordEditorSnapshot(current);
  if (history.undo.length <= 1) {
    showToast("没有可撤销的正文修改");
    return true;
  }

  const currentSnapshot = history.undo.pop();
  history.redo.push(currentSnapshot);
  const previous = history.undo[history.undo.length - 1];
  history.lastText = previous;
  applyEditorHistoryText(previous);
  updateEditorHistoryControls();
  return true;
}

function redoEditorChange() {
  const history = ensureEditorHistory();
  if (!history) return false;
  window.clearTimeout(history.pendingTimer);
  history.pendingTimer = null;
  history.pendingText = null;

  if (!history.redo.length) {
    showToast("没有可重做的正文修改");
    return true;
  }

  const next = history.redo.pop();
  history.undo.push(next);
  if (history.undo.length > EDITOR_HISTORY_LIMIT) history.undo.splice(0, history.undo.length - EDITOR_HISTORY_LIMIT);
  history.lastText = next;
  applyEditorHistoryText(next);
  updateEditorHistoryControls();
  return true;
}

async function replaceEditorTextWithHistory(text, { saveNow = false } = {}) {
  const history = ensureEditorHistory();
  if (history) {
    const current = getEditorText();
    if (current !== history.lastText) recordEditorSnapshot(current);
    recordEditorSnapshot(text);
  }

  const chapter = findChapter();
  if (chapter) chapter.content = text;
  setEditorText(text, true);
  if (!elements.findPanel.hidden) refreshFindMatches({ render: true, keepIndex: true });
  updateStats(text);
  state.dirty = true;
  if (saveNow) await saveActiveChapter();
  else queueSave();
  updateEditorHistoryControls();
}

function getEditorRenderMarks(value, highlight) {
  const marks = [];
  if (highlight) {
    getTermMatches(value).forEach((match) => {
      marks.push({
        start: match.start,
        end: match.end,
        priority: 1,
        className: "term-mark",
        term: match.term,
      });
    });
  }

  if (!elements.findPanel?.hidden && state.find.query) {
    state.find.matches.forEach((match, index) => {
      marks.push({
        start: match.start,
        end: match.end,
        priority: 2,
        className: index === state.find.activeIndex ? "find-mark is-active" : "find-mark",
      });
    });
  }

  const normalized = [];
  const used = new Uint8Array(value.length);
  marks
    .filter((mark) => mark.end > mark.start)
    .sort((a, b) => a.start - b.start || b.priority - a.priority || a.end - b.end)
    .forEach((mark) => {
      let overlaps = false;
      for (let index = mark.start; index < mark.end; index += 1) {
        if (used[index]) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) return;
      normalized.push(mark);
      for (let index = mark.start; index < mark.end; index += 1) used[index] = 1;
    });
  return normalized.sort((a, b) => a.start - b.start || a.end - b.end);
}

function renderEditorText(text, highlight = true) {
  elements.editor.replaceChildren();
  const value = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!value) return;

  const fragment = document.createDocumentFragment();
  const matches = getEditorRenderMarks(value, highlight);
  const lines = value.split("\n");
  let lineStart = 0;
  let matchIndex = 0;

  lines.forEach((line, index) => {
    const paragraph = document.createElement("div");
    paragraph.className = "editor-paragraph";
    const lineEnd = lineStart + line.length;
    let cursor = lineStart;

    while (matchIndex < matches.length && matches[matchIndex].end <= lineStart) {
      matchIndex += 1;
    }

    for (let markIndex = matchIndex; markIndex < matches.length && matches[markIndex].start < lineEnd; markIndex += 1) {
      const match = matches[markIndex];
      const start = Math.max(match.start, lineStart);
      const end = Math.min(match.end, lineEnd);
      if (end <= start) continue;

      if (start > cursor) {
        paragraph.append(document.createTextNode(value.slice(cursor, start)));
      }

      const span = document.createElement("span");
      span.className = match.className;
      if (match.term) {
        span.dataset.termId = match.term.id;
        span.dataset.termStart = String(match.start);
        span.setAttribute("role", "link");
      }
      span.textContent = value.slice(start, end);
      paragraph.append(span);
      cursor = end;
    }

    if (cursor < lineEnd) {
      paragraph.append(document.createTextNode(value.slice(cursor, lineEnd)));
    }
    if (!paragraph.childNodes.length) {
      paragraph.append(document.createElement("br"));
    }

    fragment.append(paragraph);
    if (index < lines.length - 1) fragment.append(document.createTextNode("\n"));
    lineStart = lineEnd + 1;
  });

  elements.editor.append(fragment);
}

function draftKey(chapterId) {
  return `${DRAFT_PREFIX}${chapterId}`;
}

function getDraft(chapterId) {
  return localStorage.getItem(draftKey(chapterId));
}

function setDraft(chapterId, content) {
  localStorage.setItem(draftKey(chapterId), content);
}

function removeDraft(chapterId) {
  localStorage.removeItem(draftKey(chapterId));
}

function uniqueId(prefix) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function splitFileName(fileName) {
  const index = fileName.lastIndexOf(".");
  if (index <= 0) return { base: fileName, ext: "" };
  return {
    base: fileName.slice(0, index),
    ext: fileName.slice(index),
  };
}

function copyName(fileName, index) {
  const { base, ext } = splitFileName(fileName);
  return `${base} (${index})${ext}`;
}

function persistTrash(nextTrash = state.trash) {
  try {
    writeJSON(TRASH_KEY, nextTrash);
    state.trash = nextTrash;
    renderTrash();
    return true;
  } catch {
    showToast("回收站空间不足，删除已取消。");
    return false;
  }
}

function getAvailableLocalFileName(volume, preferredName) {
  const names = new Set(volume.chapters.map((chapter) => chapter.fileName).filter(Boolean));
  let candidate = preferredName;
  let index = 2;
  while (names.has(candidate)) {
    candidate = copyName(preferredName, index);
    index += 1;
  }
  return candidate;
}

async function fileExists(parentHandle, fileName) {
  try {
    await parentHandle.getFileHandle(fileName);
    return true;
  } catch (error) {
    if (error?.name === "NotFoundError") return false;
    throw error;
  }
}

async function getAvailableFileName(parentHandle, preferredName) {
  let candidate = preferredName;
  let index = 2;
  while (await fileExists(parentHandle, candidate)) {
    candidate = copyName(preferredName, index);
    index += 1;
  }
  return candidate;
}

async function getAvailableFileNameExcept(parentHandle, preferredName, currentName = "") {
  if (preferredName === currentName) return preferredName;
  let candidate = preferredName;
  let index = 2;
  while (candidate !== currentName && (await fileExists(parentHandle, candidate))) {
    candidate = copyName(preferredName, index);
    index += 1;
  }
  return candidate;
}

async function directoryExists(parentHandle, dirName) {
  try {
    await parentHandle.getDirectoryHandle(dirName);
    return true;
  } catch (error) {
    if (error?.name === "NotFoundError") return false;
    if (error?.name === "TypeMismatchError") return true;
    throw error;
  }
}

async function getAvailableDirectoryName(parentHandle, preferredName, currentName = "") {
  if (preferredName === currentName) return preferredName;
  let candidate = preferredName;
  let index = 2;
  while (candidate !== currentName && (await directoryExists(parentHandle, candidate))) {
    candidate = copyName(preferredName, index);
    index += 1;
  }
  return candidate;
}

function normalizeTermName(name) {
  return String(name || "")
    .replace(/[《》“”"'`【】[\]()（）]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeTermMatchName(name) {
  return normalizeTermName(name).replace(/练气/g, "炼气");
}

function cultivationBaseName(name) {
  const value = normalizeTermMatchName(name);
  const base = value.replace(/(?:境界|阶段|时期|期|境)$/u, "");
  return CULTIVATION_TERMS.includes(base) && base !== "道种" && base !== "道祖" ? base : "";
}

function getTermNameKeys(name) {
  const normalized = normalizeTermName(name);
  const matched = normalizeTermMatchName(name);
  const keys = new Set([normalized, matched].filter(Boolean));
  [normalized, matched].forEach((value) => {
    const base = cultivationBaseName(value);
    if (!base) return;
    keys.add(base);
    keys.add(`${base}期`);
  });
  return [...keys];
}

function primaryTermNameKey(name) {
  return cultivationBaseName(name) || normalizeTermMatchName(name);
}

function getTermIdentityKeys(term) {
  return [...new Set([term?.name, ...(term?.aliases || [])].flatMap(getTermNameKeys).filter(Boolean))];
}

function confidenceRank(value) {
  return { low: 1, medium: 2, high: 3 }[normalizeConfidence(value)] || 2;
}

function strongerConfidence(a, b) {
  return confidenceRank(b) > confidenceRank(a) ? normalizeConfidence(b) : normalizeConfidence(a);
}

function mergeTermRecord(base, incoming) {
  const incomingName = normalizeTermName(incoming?.name);
  if (!base || !incomingName) return base;
  const baseManual = Boolean(base.manual);

  const aliases = [...(base.aliases || []), ...(incoming.aliases || [])];
  if (incomingName !== base.name) aliases.push(incomingName);
  base.aliases = mergeNames(aliases, base.name);

  const incomingType = normalizeTermType(incoming.type);
  if ((!baseManual && incomingType !== TERM_TYPE_FALLBACK) || !base.type || base.type === TERM_TYPE_FALLBACK) base.type = incomingType;
  if (incoming.info && (!baseManual || !base.info) && (!base.info || String(incoming.info).length >= String(base.info).length)) {
    base.info = String(incoming.info).trim();
  }
  base.path = baseManual ? normalizeTermPath(base.path, base) : mergeTermPath(base.path, incoming.path, base);
  base.relations = normalizeRelations([...(base.relations || []), ...(incoming.relations || [])]);
  base.confidence = strongerConfidence(base.confidence, incoming.confidence);
  base.occurrences = mergeOccurrences(base.occurrences || [], incoming.occurrences || []);
  base.manual = Boolean(base.manual || incoming.manual);
  return base;
}

function dedupeTermLibrary(terms) {
  const result = [];
  const byKey = new Map();
  const register = (term) => {
    getTermIdentityKeys(term).forEach((key) => byKey.set(key, term));
  };

  terms.forEach((term) => {
    const existing = getTermIdentityKeys(term)
      .map((key) => byKey.get(key))
      .find(Boolean);
    if (existing) {
      mergeTermRecord(existing, term);
      register(existing);
      return;
    }
    result.push(term);
    register(term);
  });

  return result;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termOccurrenceCount(term) {
  return term.occurrences?.length || 0;
}

function getTermById(termId) {
  return state.terms.find((term) => term.id === termId);
}

function findTermByName(name) {
  const normalized = normalizeTermName(name);
  return state.terms.find((term) => term.name === normalized);
}

function normalizeTermLibrary(value) {
  const terms = Array.isArray(value) ? value : value?.terms;
  if (!Array.isArray(terms)) return [];
  const normalizedTerms = terms
    .map((term) => {
      const normalized = {
        id: term.id || uniqueId("term"),
        name: normalizeTermName(term.name),
        type: normalizeTermType(term.type),
        info: term.info || "",
        aliases: Array.isArray(term.aliases) ? term.aliases.map(normalizeTermName).filter(Boolean) : [],
        occurrences: Array.isArray(term.occurrences) ? term.occurrences : [],
        relations: normalizeRelations(term.relations),
        confidence: normalizeConfidence(term.confidence),
        manual: Boolean(term.manual),
      };
      normalized.path = normalizeTermPath(term.path, normalized);
      return normalized;
    })
    .filter((term) => term.name);
  return dedupeTermLibrary(normalizedTerms);
}

function setTerms(terms) {
  state.terms = Array.isArray(terms) ? terms : [];
  state.termMatchEntries = null;
}

function invalidateTermMatchCache() {
  state.termMatchEntries = null;
}

function persistTerms(render = true) {
  invalidateTermMatchCache();
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    terms: state.terms,
  };
  writeJSON(TERM_LIBRARY_KEY, payload);
  if (render) renderTermPanel();

  if (!state.rootHandle) return;
  window.clearTimeout(state.termWriteTimer);
  state.termWriteTimer = window.setTimeout(() => {
    void writeTermsToDisk(payload);
  }, TERM_WRITE_DELAY_MS);
}

async function writeTermsToDisk(payload) {
  try {
    const handle = await state.rootHandle.getFileHandle(TERM_LIBRARY_FILE, { create: true });
    await writeFile(handle, JSON.stringify(payload, null, 2));
  } catch (error) {
    showToast(error.message || "名词库保存失败");
  }
}

async function loadTermsFromDisk(rootHandle) {
  try {
    const handle = await rootHandle.getFileHandle(TERM_LIBRARY_FILE);
    const file = await handle.getFile();
    return normalizeTermLibrary(JSON.parse(await file.text()));
  } catch (error) {
    if (error?.name === "NotFoundError") return [];
    showToast(error.message || "名词库读取失败");
    return [];
  }
}

function getTermMatchEntries() {
  if (state.termMatchEntries) return state.termMatchEntries;

  const names = [];
  const seen = new Set();

  state.terms.forEach((term) => {
    [term.name, ...(term.aliases || [])].forEach((name) => {
      const normalized = normalizeTermName(name);
      const key = `${term.id}\u001f${normalized}`;
      if (normalized.length < 2 || seen.has(key)) return;
      seen.add(key);
      names.push({ name: normalized, term });
    });
  });

  names.sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name, "zh-Hans-CN"));
  state.termMatchEntries = names;
  return names;
}

function getTermMatches(text) {
  if (!text || !state.terms.length) return [];
  const candidates = [];
  const used = new Uint8Array(text.length);

  getTermMatchEntries().forEach(({ name, term }) => {
    let start = text.indexOf(name);
    while (start !== -1) {
      const end = start + name.length;
      let overlaps = false;
      for (let index = start; index < end; index += 1) {
        if (used[index]) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        candidates.push({ start, end, term });
        for (let index = start; index < end; index += 1) used[index] = 1;
      }
      start = text.indexOf(name, start + name.length);
    }
  });

  return candidates.sort((a, b) => a.start - b.start || b.end - a.end);
}

function buildExcerpt(text, index, length) {
  const start = Math.max(0, index - 18);
  const end = Math.min(text.length, index + length + 24);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).replace(/\s+/g, " ")}${suffix}`;
}

function collectOccurrences(name, text, chapter) {
  const occurrences = [];
  const normalized = normalizeTermName(name);
  if (!normalized) return occurrences;

  let index = text.indexOf(normalized);
  while (index !== -1) {
    occurrences.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      index,
      length: normalized.length,
      excerpt: buildExcerpt(text, index, normalized.length),
    });
    index = text.indexOf(normalized, index + normalized.length);
  }

  return occurrences;
}

function termPath(term) {
  return normalizeTermPath(term?.path, term || {});
}

function termDirectoryKey(path) {
  return path.join(TERM_TREE_KEY_SEPARATOR);
}

function createTermTreeNode(label = "", path = []) {
  return {
    label,
    path,
    key: termDirectoryKey(path),
    children: new Map(),
    terms: [],
    count: 0,
  };
}

function buildTermTree(terms) {
  const root = createTermTreeNode();
  terms.forEach((term) => {
    const path = termPath(term);
    const directories = path.slice(0, -1);
    let node = root;
    directories.forEach((segment, index) => {
      if (!node.children.has(segment)) {
        const childPath = directories.slice(0, index + 1);
        node.children.set(segment, createTermTreeNode(segment, childPath));
      }
      node = node.children.get(segment);
    });
    node.terms.push(term);
  });

  const finalize = (node) => {
    node.terms.sort((a, b) => termOccurrenceCount(b) - termOccurrenceCount(a) || collator.compare(a.name, b.name));
    node.count =
      node.terms.length +
      [...node.children.values()]
        .sort((a, b) => collator.compare(a.label, b.label))
        .reduce((total, child) => total + finalize(child), 0);
    return node.count;
  };

  finalize(root);
  return root;
}

function collectTermDirectoryKeys(node, result = []) {
  [...node.children.values()].forEach((child) => {
    result.push(child.key);
    collectTermDirectoryKeys(child, result);
  });
  return result;
}

function isTermDirectoryExpanded(key) {
  return !state.hasSavedTermExpanded || state.termExpanded.has(key);
}

function saveTermExpandedState() {
  state.hasSavedTermExpanded = true;
  writeJSON(TERM_TREE_KEY, [...state.termExpanded]);
}

function toggleTermDirectory(key) {
  if (!state.hasSavedTermExpanded) {
    state.termExpanded = new Set(collectTermDirectoryKeys(buildTermTree(state.terms)));
  }
  if (state.termExpanded.has(key)) state.termExpanded.delete(key);
  else state.termExpanded.add(key);
  saveTermExpandedState();
  renderTermList();
}

function ensureTermVisible(term) {
  if (!term || !state.hasSavedTermExpanded) return;
  let changed = false;
  const directories = termPath(term).slice(0, -1);
  directories.forEach((_, index) => {
    const key = termDirectoryKey(directories.slice(0, index + 1));
    if (state.termExpanded.has(key)) return;
    state.termExpanded.add(key);
    changed = true;
  });
  if (changed) saveTermExpandedState();
}

function renderTermPanel() {
  elements.termCount.textContent = String(state.terms.length);
  renderTermList();
  renderTermDetail();
  updateTermActionState();
}

function setTermTreeLevelStyle(element, level, leaf = false) {
  const fontSize = Math.max(11, 13.4 - level * 0.7 - (leaf ? 0.4 : 0));
  const metaSize = Math.max(10, fontSize - 1);
  const rowHeight = Math.max(28, 32 - level - (leaf ? 1 : 0));
  element.style.setProperty("--term-indent", `${level * 14}px`);
  element.style.setProperty("--term-font-size", `${fontSize.toFixed(1)}px`);
  element.style.setProperty("--term-meta-font-size", `${metaSize.toFixed(1)}px`);
  element.style.setProperty("--term-row-height", `${rowHeight}px`);
}

function renderTermList() {
  elements.termList.replaceChildren();
  if (!state.terms.length) {
    const empty = document.createElement("div");
    empty.className = "term-list-empty";
    empty.textContent = "空";
    elements.termList.append(empty);
    return;
  }

  const tree = buildTermTree(state.terms);
  const renderNode = (node, level) => {
    [...node.children.values()]
      .sort((a, b) => collator.compare(a.label, b.label))
      .forEach((child) => {
        const expanded = isTermDirectoryExpanded(child.key);
        const row = document.createElement("button");
        row.className = "term-tree-row";
        row.type = "button";
        setTermTreeLevelStyle(row, level);
        row.setAttribute("aria-expanded", String(expanded));

        const toggle = document.createElement("span");
        toggle.className = "term-tree-toggle";
        toggle.textContent = expanded ? "▾" : "▸";

        const label = document.createElement("span");
        label.className = "term-tree-label";
        label.textContent = child.label;

        const meta = document.createElement("span");
        meta.className = "term-tree-meta";
        meta.textContent = String(child.count);

        row.append(toggle, label, meta);
        row.addEventListener("click", () => toggleTermDirectory(child.key));
        elements.termList.append(row);

        if (expanded) renderNode(child, level + 1);
      });

    node.terms.forEach((term) => {
      const button = document.createElement("button");
      button.className = "term-list-item term-tree-term";
      button.classList.toggle("is-active", state.selectedNode.type === "term" && term.id === state.selectedTermId);
      button.type = "button";
      setTermTreeLevelStyle(button, level, true);

      const name = document.createElement("span");
      name.className = "term-list-name";
      name.textContent = term.name;

      const meta = document.createElement("span");
      meta.className = "term-list-meta";
      meta.textContent = `${term.type} · ${termOccurrenceCount(term)}`;

      button.append(name, meta);
      button.addEventListener("click", () => selectTerm(term.id));
      elements.termList.append(button);
    });
  };

  renderNode(tree, 0);
}

function renderTermDetail() {
  const term = state.selectedNode.type === "term" ? getTermById(state.selectedTermId) : null;
  elements.termDetail.hidden = !term;
  elements.deleteTerm.disabled = !term;
  if (!term) {
    elements.termName.value = "";
    elements.termPath.value = "";
    elements.termAliases.value = "";
    elements.termInfo.value = "";
    elements.termRelations.replaceChildren();
    elements.termRelations.hidden = true;
    elements.termOccurrences.replaceChildren();
    return;
  }

  elements.termName.value = term.name;
  elements.termPath.value = termPath(term).join(" / ");
  elements.termAliases.value = (term.aliases || []).join("、");
  elements.termType.value = term.type;
  elements.termInfo.value = term.info || "";
  renderTermRelations(term);
  renderTermOccurrences(term);
}

function renderTermRelations(term) {
  elements.termRelations.replaceChildren();
  const relations = normalizeRelations(term.relations);
  elements.termRelations.hidden = !relations.length;
  if (!relations.length) return;

  relations.forEach((relation) => {
    const item = document.createElement("span");
    item.className = "term-relation";
    item.textContent = `${relation.type}：${relation.target}`;
    elements.termRelations.append(item);
  });
}

function renderTermOccurrences(term) {
  elements.termOccurrences.replaceChildren();
  if (!term.occurrences?.length) {
    const empty = document.createElement("div");
    empty.className = "occurrence-empty";
    empty.textContent = "空";
    elements.termOccurrences.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "occurrence-list";
  term.occurrences.forEach((occurrence) => {
    const button = document.createElement("button");
    button.className = "occurrence-item";
    button.type = "button";

    const place = document.createElement("div");
    place.className = "occurrence-place";
    place.textContent = occurrence.chapterTitle || "未命名章节";

    const excerpt = document.createElement("div");
    excerpt.className = "occurrence-excerpt";
    excerpt.textContent = occurrence.excerpt || term.name;

    button.append(place, excerpt);
    button.addEventListener("click", () => void jumpToOccurrence(term.id, occurrence));
    list.append(button);
  });

  elements.termOccurrences.append(list);
}

function selectTerm(termId) {
  state.selectedTermId = termId;
  setSelection("term", termId);
  ensureTermVisible(getTermById(termId));
  renderTree();
  renderTermPanel();
}

function parseTermPathInput(value, term) {
  const segments = String(value || "")
    .split(/[\/／>＞｜|\\]+/)
    .map((segment) => normalizeTermName(segment))
    .filter(Boolean);
  return normalizeTermPath(segments, term);
}

function parseAliasesInput(value, name) {
  return normalizeAliases(
    String(value || "")
      .split(/[、,，;；\s]+/)
      .filter(Boolean),
    name,
  );
}

function commitTermName() {
  const term = getTermById(state.selectedTermId);
  if (!term) return;

  const nextName = normalizeTermName(elements.termName.value);
  if (!nextName) {
    elements.termName.value = term.name;
    showToast("词条名称不能为空");
    return;
  }
  if (nextName === term.name) return;

  const existing = findTermByAnyName(nextName);
  if (existing && existing.id !== term.id) {
    elements.termName.value = term.name;
    showToast("已有同名或等价词条");
    return;
  }

  const previousName = term.name;
  term.name = nextName;
  term.manual = true;
  term.aliases = mergeNames([...(term.aliases || []), previousName], nextName);
  term.path = normalizeTermPath(term.path, term);
  state.terms = dedupeTermLibrary(state.terms);
  state.selectedTermId = term.id;
  persistTerms();
  setEditorText(getEditorText(), true);
}

function commitTermPath() {
  const term = getTermById(state.selectedTermId);
  if (!term) return;
  term.manual = true;
  term.path = parseTermPathInput(elements.termPath.value, term);
  persistTerms();
}

function commitTermAliases() {
  const term = getTermById(state.selectedTermId);
  if (!term) return;
  const previousId = term.id;
  term.manual = true;
  term.aliases = parseAliasesInput(elements.termAliases.value, term.name);
  state.terms = dedupeTermLibrary(state.terms);
  if (!getTermById(previousId)) {
    const merged = findTermByAnyName(term.name, term.aliases);
    state.selectedTermId = merged?.id || state.terms[0]?.id || null;
  }
  persistTerms();
  setEditorText(getEditorText(), true);
}


function addManualTerm() {
  const input = window.prompt("词条名称", "")?.trim();
  if (input === undefined || input === null) return;

  const name = normalizeTermName(input);
  if (!name) {
    showToast("词条名称不能为空");
    return;
  }

  const existing = findTermByAnyName(name);
  if (existing) {
    selectTerm(existing.id);
    showToast("已选中现有词条");
    return;
  }

  const chapter = findChapter();
  const text = getEditorText();
  const term = {
    id: uniqueId("term"),
    name,
    type: TERM_TYPE_FALLBACK,
    info: "",
    aliases: [],
    occurrences: chapter ? collectOccurrences(name, text, chapter) : [],
    relations: [],
    confidence: "high",
    manual: true,
  };
  term.path = normalizeTermPath([], term);
  state.terms.push(term);
  persistTerms();
  selectTerm(term.id);
  setEditorText(text, true);
  showToast("词条已新增");
}

function snapshotTerm(term) {
  return {
    id: uniqueId("trash"),
    type: "term",
    title: term.name,
    deletedAt: new Date().toISOString(),
    term: JSON.parse(JSON.stringify(term)),
    original: {
      termId: term.id,
      termIndex: state.terms.indexOf(term),
    },
  };
}

function moveTermToTrash(termId) {
  const term = getTermById(termId);
  if (!term) return;

  const trashItem = snapshotTerm(term);
  if (!persistTrash([trashItem, ...state.trash])) return;

  const index = state.terms.findIndex((item) => item.id === term.id);
  state.terms = state.terms.filter((item) => item.id !== term.id);
  const nextTerm = state.terms[Math.min(index, state.terms.length - 1)] || null;
  if (nextTerm) setSelection("term", nextTerm.id);
  else if (state.activeChapterId) setSelection("chapter", state.activeChapterId);
  else if (state.activeVolumeId) setSelection("volume", state.activeVolumeId);
  else setSelection("book", "book");
  persistTerms();
  setEditorText(getEditorText(), true);
  renderTree();
  showToast(`${term.name} 已移入回收站`);
}

function deleteSelectedTerm() {
  const term = getTermById(state.selectedTermId);
  if (!term) return;
  if (!window.confirm(`删除词条「${term.name}」？`)) return;
  moveTermToTrash(term.id);
}

async function jumpToOccurrence(termId, occurrence) {
  if (occurrence.chapterId && occurrence.chapterId !== state.activeChapterId) {
    await selectChapter(occurrence.chapterId);
  }

  requestAnimationFrame(() => {
    const selector = `.term-mark[data-term-id="${CSS.escape(termId)}"][data-term-start="${occurrence.index}"]`;
    const mark = elements.editor.querySelector(selector) || elements.editor.querySelector(`.term-mark[data-term-id="${CSS.escape(termId)}"]`);
    if (!mark) return;
    mark.scrollIntoView({ block: "center", behavior: "smooth" });
    mark.classList.add("is-jump");
    window.setTimeout(() => mark.classList.remove("is-jump"), 1400);
  });
}

function normalizeAgentTermsPayload(payload) {
  const source = Array.isArray(payload) ? payload : payload?.terms;
  if (!Array.isArray(source)) return [];
  return source
    .map((term) => {
      const name = normalizeTermName(term.name);
      const normalized = {
        name,
        type: normalizeTermType(term.type),
        info: String(term.info || "").trim(),
        aliases: Array.isArray(term.aliases)
          ? [...new Set(term.aliases.map(normalizeTermName).filter((alias) => alias && alias !== name))]
          : [],
        relations: normalizeRelations(term.relations),
        confidence: normalizeConfidence(term.confidence),
      };
      normalized.path = normalizeTermPath(term.path, normalized);
      return normalized;
    })
    .filter((term) => term.name);
}

function serializeTermForAgent(term) {
  return {
    name: term.name,
    type: normalizeTermType(term.type),
    path: termPath(term),
    info: term.info || "",
    aliases: normalizeAliases(term.aliases, term.name),
    relations: normalizeRelations(term.relations),
    confidence: normalizeConfidence(term.confidence),
  };
}

async function extractTermsWithLLM(text) {
  if (!state.agentConfig.enabled || !state.selectedAgentModel || !isSelectedAgentModelAvailable()) return null;

  const response = await fetch("./api/extract-terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.selectedAgentModel,
      text,
    }),
  });
  const data = await readAPIJSON(response);
  if (!response.ok) {
    throw new Error(data?.message || `Agent 请求失败：${response.status}`);
  }

  return normalizeAgentTermsPayload(data);
}

async function summarizeTermsWithLLM(text, terms) {
  if (!state.agentConfig.enabled || !state.selectedAgentModel) {
    throw new Error("请先在后台配置可用模型");
  }
  if (!isSelectedAgentModelAvailable()) {
    throw new Error("当前模型未配置 API Key，请在后台配置后再使用");
  }

  const response = await fetch("./api/summarize-terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.selectedAgentModel,
      text,
      terms,
      existingTerms: state.terms.map(serializeTermForAgent),
    }),
  });
  const data = await readAPIJSON(response);
  if (!response.ok) {
    throw new Error(data?.message || `Agent 请求失败：${response.status}`);
  }

  return normalizeAgentTermsPayload(data);
}

function normalizeAliases(aliases, excludeName = "") {
  const excluded = new Set([normalizeTermName(excludeName)]);
  return [
    ...new Set(
      (Array.isArray(aliases) ? aliases : [])
        .map(normalizeTermName)
        .filter((alias) => alias && !excluded.has(alias)),
    ),
  ];
}

function mergeNames(names, excludeName = "") {
  return normalizeAliases(names, excludeName);
}

function findTermByAnyName(name, aliases = []) {
  const candidates = new Set([name, ...normalizeAliases(aliases)].flatMap(getTermNameKeys).filter(Boolean));
  return state.terms.find((term) => {
    return getTermIdentityKeys(term).some((key) => candidates.has(key));
  });
}

function mergeOccurrences(existing = [], additions = []) {
  const map = new Map();
  [...existing, ...additions].forEach((occurrence) => {
    const key = `${occurrence.chapterId}:${occurrence.index}:${occurrence.length}`;
    if (!map.has(key)) map.set(key, occurrence);
  });
  return [...map.values()].sort((a, b) => {
    if (a.chapterId !== b.chapterId) return String(a.chapterId).localeCompare(String(b.chapterId), "zh-Hans-CN");
    return a.index - b.index;
  });
}

function collectOccurrencesForNames(names, text, chapter) {
  return mergeOccurrences(
    [],
    names.flatMap((name) => collectOccurrences(name, text, chapter)),
  );
}

function getCurrentChapterTerms(text, chapter) {
  return state.terms
    .filter((term) => {
      const names = [term.name, ...(term.aliases || [])].map(normalizeTermName).filter(Boolean);
      return term.occurrences?.some((occurrence) => occurrence.chapterId === chapter.id) || names.some((name) => text.includes(name));
    })
    .slice(0, MAX_EXTRACTED_TERMS)
    .map(serializeTermForAgent);
}

function mergeTermSummaries(summaries, text, chapter) {
  let touched = 0;

  summaries.forEach((item) => {
    const name = normalizeTermName(item.name);
    if (!name) return;

    const aliases = normalizeAliases(item.aliases, name);
    let term = findTermByAnyName(name, aliases);
    if (!term) {
      term = {
        id: uniqueId("term"),
        name,
        type: normalizeTermType(item.type),
        info: "",
        aliases: [],
        occurrences: [],
        relations: [],
        confidence: "medium",
      };
      state.terms.push(term);
    }

    const type = normalizeTermType(item.type);
    if ((!term.manual && type !== TERM_TYPE_FALLBACK) || !term.type || term.type === TERM_TYPE_FALLBACK) term.type = type;
    if (item.info && (!term.manual || !term.info)) term.info = String(item.info).trim();

    if (term.name !== name) aliases.push(name);
    term.aliases = mergeNames([...(term.aliases || []), ...aliases], term.name);
    term.path = term.manual ? normalizeTermPath(term.path, term) : mergeTermPath(term.path, item.path, term);
    term.relations = normalizeRelations([...(term.relations || []), ...(item.relations || [])]);
    term.confidence = normalizeConfidence(item.confidence || term.confidence);
    term.occurrences = mergeOccurrences(
      term.occurrences || [],
      collectOccurrencesForNames([term.name, ...(term.aliases || [])], text, chapter),
    );
    touched += 1;
  });

  state.terms = dedupeTermLibrary(state.terms).filter((term) => term.name && (term.occurrences?.length || term.info || term.manual));
  if (state.selectedNode.type === "term") {
    if (!getTermById(state.selectedTermId)) {
      const nextTerm = state.terms[0] || null;
      state.selectedTermId = nextTerm?.id || null;
      if (nextTerm) setSelection("term", nextTerm.id);
      else if (state.activeChapterId) setSelection("chapter", state.activeChapterId);
      else if (state.activeVolumeId) setSelection("volume", state.activeVolumeId);
      else setSelection("book", "book");
    }
  } else {
    state.selectedTermId = null;
  }
  return touched;
}

function addExtractedTerm(result, name, type) {
  const normalized = normalizeTermName(name);
  const normalizedType = normalizeTermType(type);
  if (!normalized || normalized.length < 2 || normalized.length > MAX_TERM_NAME_LENGTH) return;
  if (/^第[一二三四五六七八九十百千万\d]+[章节卷]?$/.test(normalized)) return;
  if (/[，。！？、；：,.!?;:]/.test(normalized)) return;
  if (/[的了着过和与在从到把被将是有无不很就也都而或及]/.test(normalized)) return;
  if (COMMON_TERM_BLOCKLIST.has(normalized)) return;

  const key = primaryTermNameKey(normalized);
  const current = result.get(key);
  if (!current || current.type === TERM_TYPE_FALLBACK) {
    result.set(key, { name: normalized, type: normalizedType, info: "", aliases: [] });
  } else if (key === normalized && current.name !== normalized) {
    current.aliases = mergeNames([...(current.aliases || []), current.name], normalized);
    current.name = normalized;
  } else if (current.name !== normalized) {
    current.aliases = mergeNames([...(current.aliases || []), normalized], current.name);
  }
}

function extractTermsByRules(text) {
  const result = new Map();

  state.terms.forEach((term) => {
    if (text.includes(term.name)) {
      result.set(primaryTermNameKey(term.name), {
        name: term.name,
        type: term.type,
        info: term.info || "",
        aliases: term.aliases || [],
      });
    }
  });

  const suffixRules = [
    { type: "地点", pattern: /[\u4e00-\u9fa5]{1,8}(?:谷|镇|观|阁|宗|州|海|庭|城|山|村|台|客栈|遗迹|禁区)/g },
    { type: "功法", pattern: /[\u4e00-\u9fa5]{1,8}(?:诀|功|法|术|剑法|循环法)/g },
    { type: "道具", pattern: /[\u4e00-\u9fa5]{1,8}(?:道种|碎片|测灵石|海图|丹药|账本)/g },
    { type: "设定", pattern: /[\u4e00-\u9fa5]{1,8}(?:灵根|境|期|天道|道祖)/g },
  ];

  suffixRules.forEach((rule) => {
    for (const match of text.matchAll(rule.pattern)) {
      addExtractedTerm(result, match[0], rule.type);
    }
  });

  CULTIVATION_TERMS.forEach((name) => {
    if (text.includes(name)) addExtractedTerm(result, name, name === "道种" ? "道具" : "设定");
  });

  for (const match of text.matchAll(/^([\u4e00-\u9fa5]{2,6})\s*[—-]{2,}/gm)) {
    addExtractedTerm(result, match[1], "人物");
  }

  for (const match of text.matchAll(/([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|笑|沉默|点头|摇头|出手|转身|站起|坐下|走来|看着)/g)) {
    addExtractedTerm(result, match[1], "人物");
  }

  return [...result.values()].slice(0, MAX_EXTRACTED_TERMS);
}

async function extractSpecialTerms(text) {
  let llmTerms = null;
  try {
    llmTerms = await extractTermsWithLLM(text);
  } catch (error) {
    showToast(error.message || "Agent 识别失败，已使用本地规则");
    llmTerms = null;
  }

  if (Array.isArray(llmTerms) && llmTerms.length) {
    return llmTerms;
  }
  return extractTermsByRules(text);
}

async function autoExtractTerms() {
  const chapter = findChapter();
  if (!chapter) return;

  const text = getEditorText();
  if (!text.trim()) {
    showToast("当前章节没有内容");
    return;
  }

  elements.autoTerms.disabled = true;
  elements.summarizeTerms.disabled = true;
  elements.autoTerms.querySelector("span:last-child").textContent = "识别中";

  try {
    const extracted = await extractSpecialTerms(text);
    state.terms.forEach((term) => {
      term.occurrences = (term.occurrences || []).filter((occurrence) => occurrence.chapterId !== chapter.id);
    });

    extracted.forEach((item) => {
      const name = normalizeTermName(item.name);
      if (!name) return;
      const type = normalizeTermType(item.type);
      const term =
        findTermByAnyName(name, item.aliases) ||
        {
          id: uniqueId("term"),
          name,
          type,
          info: "",
          aliases: [],
          occurrences: [],
          relations: [],
          confidence: "medium",
        };

      if (!term.manual && (!term.type || term.type === TERM_TYPE_FALLBACK)) term.type = type;
      if (!term.info && item.info) term.info = item.info;
      const aliases = [...(item.aliases || [])];
      if (term.name !== name) aliases.push(name);
      term.aliases = mergeNames([...(term.aliases || []), ...aliases], term.name);
      term.path = term.manual ? normalizeTermPath(term.path, term) : mergeTermPath(term.path, item.path, term);
      term.relations = normalizeRelations([...(term.relations || []), ...(item.relations || [])]);
      term.confidence = normalizeConfidence(item.confidence || term.confidence);
      term.occurrences = mergeOccurrences(
        term.occurrences || [],
        collectOccurrencesForNames([name, ...(term.aliases || [])], text, chapter),
      );
      if (!getTermById(term.id)) state.terms.push(term);
    });

    state.terms = dedupeTermLibrary(state.terms).filter((term) => term.occurrences?.length || term.info || term.manual);
    if (state.selectedNode.type === "term") {
      if (!getTermById(state.selectedTermId)) {
        const nextTerm = state.terms[0] || null;
        state.selectedTermId = nextTerm?.id || null;
        if (nextTerm) setSelection("term", nextTerm.id);
        else if (state.activeChapterId) setSelection("chapter", state.activeChapterId);
        else if (state.activeVolumeId) setSelection("volume", state.activeVolumeId);
        else setSelection("book", "book");
      }
    } else {
      state.selectedTermId = null;
    }
    persistTerms();
    setEditorText(text, true);
    showToast(`已识别 ${extracted.length} 个名词`);
  } catch (error) {
    showToast(error.message || "名词识别失败");
  } finally {
    updateTermActionState();
    elements.autoTerms.querySelector("span:last-child").textContent = "识别名词";
  }
}

async function summarizeTermLibrary() {
  const chapter = findChapter();
  if (!chapter) return;

  const text = getEditorText();
  const terms = getCurrentChapterTerms(text, chapter);
  if (!terms.length) {
    showToast("先识别名词，再智能总结");
    return;
  }

  elements.autoTerms.disabled = true;
  elements.summarizeTerms.disabled = true;
  elements.summarizeTerms.querySelector("span:last-child").textContent = "总结中";

  try {
    const summaries = await summarizeTermsWithLLM(text, terms);
    const touched = mergeTermSummaries(summaries, text, chapter);
    persistTerms();
    setEditorText(text, true);
    showToast(touched ? `已总结 ${touched} 个词条` : "没有可更新的词条");
  } catch (error) {
    showToast(error.message || "智能总结失败");
  } finally {
    updateTermActionState();
    elements.summarizeTerms.querySelector("span:last-child").textContent = "智能总结";
  }
}

function trimForGenerationContext(text, limit = MAX_GENERATION_CONTEXT_CHARS) {
  const value = String(text || "").trim();
  if (value.length <= limit) return value;
  return `...${value.slice(-limit)}`;
}

async function loadOutlineText() {
  if (!state.rootHandle) return "";
  for (const fileName of GENERATION_OUTLINE_FILES) {
    try {
      const handle = await state.rootHandle.getFileHandle(fileName);
      const file = await handle.getFile();
      const text = await file.text();
      if (text.trim()) return text;
    } catch (error) {
      if (error?.name !== "NotFoundError") throw error;
    }
  }
  return "";
}

async function getRecentChapterContexts(targetVolume) {
  const chapters = getFlatChapters();
  if (!chapters.length) return [];

  let endIndex = state.activeChapterId ? chapters.findIndex((chapter) => chapter.id === state.activeChapterId) : -1;
  if (endIndex === -1 && targetVolume) {
    for (let index = chapters.length - 1; index >= 0; index -= 1) {
      if (chapters[index].volume?.id === targetVolume.id) {
        endIndex = index;
        break;
      }
    }
  }
  if (endIndex === -1) endIndex = chapters.length - 1;

  const recent = chapters.slice(Math.max(0, endIndex - 2), endIndex + 1);
  const contexts = [];
  for (const chapter of recent) {
    const content = chapter.id === state.activeChapterId ? getEditorText() : await loadChapterContent(chapter);
    contexts.push({
      title: chapterDisplayTitle(chapter),
      content: trimForGenerationContext(content),
    });
  }
  return contexts;
}

async function ensureGenerationVolume() {
  if (!state.project) throw new Error("请先打开或创建书稿");
  const activeChapter = findChapter();
  if (activeChapter?.volume) return activeChapter.volume;
  const activeVolume = findVolume();
  if (activeVolume) return activeVolume;
  if (state.project.volumes[0]) return state.project.volumes[0];

  const volumeNumber = String(nextVolumeNumber());
  const title = formatVolumeTitle(volumeNumber, "");
  let handle = null;
  const dirName = safeFileName(title);
  if (state.rootHandle) {
    handle = await state.rootHandle.getDirectoryHandle(dirName, { create: true });
  }
  const volume = {
    id: state.rootHandle ? `fs:${dirName}` : uniqueId("local:volume"),
    title,
    volumeNumber,
    volumeName: "",
    dirName: state.rootHandle ? dirName : undefined,
    handle,
    chapters: [],
  };
  state.project.volumes.push(volume);
  state.expanded.add("book");
  state.expanded.add(volume.id);
  return volume;
}

async function generateChapterWithLLM(prompt, targetVolume, nextChapterTitle) {
  if (!state.agentConfig.enabled || !state.selectedAgentModel) {
    throw new Error("请先在后台配置可用模型");
  }
  if (!isSelectedAgentModelAvailable()) {
    throw new Error("当前模型未配置 API Key，请在后台配置后再使用");
  }

  const [outline, recentChapters] = await Promise.all([loadOutlineText(), getRecentChapterContexts(targetVolume)]);
  const response = await fetch("./api/generate-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.selectedAgentModel,
      prompt,
      nextChapterTitle,
      outline,
      terms: state.terms.map(serializeTermForAgent),
      recentChapters,
    }),
  });
  const data = await readAPIJSON(response);
  if (!response.ok) {
    throw new Error(data?.message || `Agent 请求失败：${response.status}`);
  }
  return {
    title: String(data?.title || "").trim(),
    content: String(data?.content || "").trim(),
  };
}

async function expandChapterWithLLM(chapter, currentContent) {
  if (!state.agentConfig.enabled || !state.selectedAgentModel) {
    throw new Error("请先在后台配置可用模型");
  }
  if (!isSelectedAgentModelAvailable()) {
    throw new Error("当前模型未配置 API Key，请在后台配置后再使用");
  }

  const [outline, recentChapters] = await Promise.all([loadOutlineText(), getRecentChapterContexts(chapter.volume)]);
  const response = await fetch("./api/expand-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.selectedAgentModel,
      chapterTitle: chapterDisplayTitle(chapter),
      currentContent,
      outline,
      terms: state.terms.map(serializeTermForAgent),
      recentChapters,
    }),
  });
  const data = await readAPIJSON(response);
  if (!response.ok) {
    throw new Error(data?.message || `Agent 请求失败：${response.status}`);
  }
  return {
    title: String(data?.title || "").trim(),
    content: String(data?.content || "").trim(),
  };
}

function stripGeneratedChapterHeading(content, finalTitle) {
  const value = String(content || "").trim();
  const lines = value.split(/\r?\n/);
  const first = lines[0]?.trim() || "";
  if (!first) return value;
  if (first === finalTitle || parseChapterTitle(first).number) return lines.slice(1).join("\n").trim();
  return value;
}

async function replaceActiveChapterWithExpanded(expanded) {
  const chapter = findChapter();
  if (!chapter) throw new Error("请先选择要扩写的章节");

  const title = chapterDisplayTitle(chapter);
  const body = stripGeneratedChapterHeading(expanded.content, title);
  if (!body.trim()) throw new Error("模型没有返回扩写正文");

  const content = `${title}\n\n${body.trim()}\n`;
  await replaceEditorTextWithHistory(content, { saveNow: true });
  setEditorText(content, true);
}

async function createGeneratedChapter(generated, prompt) {
  const volume = await ensureGenerationVolume();
  const chapterNumber = String(nextChapterNumber(volume));
  const parsedTitle = parseChapterTitle(generated.title);
  const rawName = parsedTitle.name || (!parsedTitle.number ? generated.title : "");
  const chapterName = rawName.trim() || prompt.slice(0, 18);
  const title = formatChapterTitle(chapterNumber, chapterName);
  const body = stripGeneratedChapterHeading(generated.content, title);
  if (!body.trim()) throw new Error("模型没有返回章节正文");

  const content = `${title}\n\n${body.trim()}\n`;
  let handle = null;
  let fileName = `${safeFileName(title)}.txt`;
  if (state.rootHandle) {
    const parentHandle = volume.dirName
      ? volume.handle || (await state.rootHandle.getDirectoryHandle(volume.dirName, { create: true }))
      : state.rootHandle;
    volume.handle = parentHandle;
    fileName = await getAvailableFileName(parentHandle, fileName);
    handle = await parentHandle.getFileHandle(fileName, { create: true });
    await writeFile(handle, content);
  }

  const chapter = {
    id: state.rootHandle ? `fs:${volume.dirName || "root"}/${fileName}` : uniqueId("local:chapter"),
    title,
    chapterNumber,
    chapterName,
    fileName,
    handle,
    content,
  };
  volume.chapters.push(chapter);
  volume.chapters.sort(naturalSort);
  state.activeVolumeId = volume.id;
  state.expanded.add("book");
  state.expanded.add(volume.id);
  persistLocalProject();
  renderTree();
  await selectChapter(chapter.id);
  resetEditorHistory(chapter.id, `${title}\n\n`);
  recordEditorSnapshot(content);
}

async function generateNextChapter() {
  const prompt = elements.generatePrompt.value.trim();
  elements.generateChapter.disabled = true;
  elements.generateChapter.querySelector("span:last-child").textContent = "生成中";

  try {
    await flushSave();
    const volume = await ensureGenerationVolume();
    const nextChapterTitle = formatChapterTitle(String(nextChapterNumber(volume)), "");
    const generated = await generateChapterWithLLM(prompt, volume, nextChapterTitle);
    await createGeneratedChapter(generated, prompt);
    showToast("下一章已生成");
  } catch (error) {
    showToast(error.message || "章节生成失败");
  } finally {
    elements.generateChapter.querySelector("span:last-child").textContent = "生成章节";
    updateTermActionState();
  }
}

async function expandCurrentChapter() {
  const chapter = findChapter();
  if (!chapter) {
    showToast("请先选择要扩写的章节");
    return;
  }

  const currentContent = getEditorText().trim();
  if (!currentContent) {
    showToast("当前章节没有内容");
    return;
  }

  elements.expandChapter.disabled = true;
  elements.expandChapter.querySelector("span:last-child").textContent = "扩写中";

  try {
    await flushSave();
    const expanded = await expandChapterWithLLM(chapter, currentContent);
    await replaceActiveChapterWithExpanded(expanded);
    showToast("当前章节已扩写");
  } catch (error) {
    showToast(error.message || "章节扩写失败");
  } finally {
    elements.expandChapter.querySelector("span:last-child").textContent = "一键扩写";
    updateTermActionState();
  }
}

function getFlatChapters() {
  if (!state.project) return [];
  return state.project.volumes.flatMap((volume) => {
    return volume.chapters.map((chapter) => {
      chapter.volume = volume;
      return chapter;
    });
  });
}

function findChapter(chapterId = state.activeChapterId) {
  return getFlatChapters().find((item) => item.id === chapterId);
}

function findVolume(volumeId = state.activeVolumeId) {
  return state.project?.volumes.find((volume) => volume.id === volumeId);
}

function chineseNumberToArabic(value) {
  const text = String(value || "").trim();
  if (!text || /^\d+$/.test(text)) return text;

  const digits = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  const units = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
  if (!/^[零〇一二两三四五六七八九十百千万]+$/.test(text)) return text;

  let total = 0;
  let section = 0;
  let number = 0;
  for (const char of text) {
    if (char in digits) {
      number = digits[char];
      continue;
    }
    const unit = units[char];
    if (!unit) return text;
    if (unit === 10000) {
      section = (section + number) * unit;
      total += section;
      section = 0;
    } else {
      section += (number || 1) * unit;
    }
    number = 0;
  }

  const result = total + section + number;
  return result > 0 ? String(result) : text;
}

function normalizeChapterNumberToken(value) {
  return chineseNumberToArabic(String(value || "").trim()).replace(/[^\d]/g, "").replace(/^0+/, "");
}

function parseNumberedTitle(title = "", unit = "章") {
  const value = String(title || "").trim();
  const escapedUnit = escapeRegExp(unit);
  const match = value.match(new RegExp(`^第\\s*([^\\s第${escapedUnit}]+)\\s*${escapedUnit}(?:[\\s,，、:：-]*(.*))?$`));
  if (!match) return { number: "", name: value };
  return {
    number: normalizeChapterNumberToken(match[1]),
    name: String(match[2] || "").trim(),
  };
}

function parseChapterTitle(title = "") {
  return parseNumberedTitle(title, "章");
}

function parseVolumeTitle(title = "") {
  return parseNumberedTitle(title, "卷");
}

function formatNumberedTitle(unit, fallback, number, name) {
  const titleNumber = String(number || "").trim();
  const titleName = String(name || "").trim();
  if (!titleNumber) return titleName || fallback;
  return titleName ? `第${titleNumber}${unit} ${titleName}` : `第${titleNumber}${unit}`;
}

function formatChapterTitle(number, name) {
  return formatNumberedTitle("章", "未命名章节", number, name);
}

function formatVolumeTitle(number, name) {
  return formatNumberedTitle("卷", "未命名卷", number, name);
}

function getChapterTitleParts(chapter) {
  const parsed = parseChapterTitle(chapter?.title || "");
  const fileTitle = chapter?.fileName ? parseChapterTitle(inferChapterTitle(chapter.fileName)) : { number: "", name: "" };
  const firstLine = String(chapter?.content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  const contentTitle = firstLine ? parseChapterTitle(firstLine) : { number: "", name: "" };
  return {
    number: String(chapter?.chapterNumber || parsed.number || fileTitle.number || contentTitle.number || "").trim(),
    name: String(chapter?.chapterName || parsed.name || fileTitle.name || contentTitle.name || "").trim(),
  };
}

function chapterDisplayTitle(chapter) {
  const parts = getChapterTitleParts(chapter);
  return formatChapterTitle(parts.number, parts.name);
}

function getVolumeTitleParts(volume) {
  const parsed = parseVolumeTitle(volume?.title || "");
  return {
    number: String(volume?.volumeNumber || parsed.number || "").trim(),
    name: String(volume?.volumeName ?? parsed.name ?? "").trim(),
  };
}

function volumeDisplayTitle(volume) {
  const parts = getVolumeTitleParts(volume);
  return formatVolumeTitle(parts.number, parts.name);
}

function parseChapterNumberValue(value) {
  const number = Number.parseInt(normalizeChapterNumberToken(value), 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function sanitizeChapterNumber(value) {
  return normalizeChapterNumberToken(value);
}

function nextChapterNumber(volume) {
  const used = (volume?.chapters || [])
    .map((chapter) => parseChapterNumberValue(getChapterTitleParts(chapter).number))
    .filter((number) => Number.isInteger(number));
  if (!used.length) return (volume?.chapters || []).length + 1;
  return Math.max(...used) + 1;
}

function nextVolumeNumber() {
  const used = (state.project?.volumes || [])
    .map((volume) => parseChapterNumberValue(getVolumeTitleParts(volume).number))
    .filter((number) => Number.isInteger(number));
  if (!used.length) return (state.project?.volumes || []).length + 1;
  return Math.max(...used) + 1;
}

function setChapterNumberValue(value) {
  const number = String(value || "").trim();
  elements.chapterNumber.value = number;
  elements.chapterNumber.style.setProperty("--chapter-number-width", `${Math.max(2, number.length)}ch`);
}

function setChapterHeaderMode(active, title = "", unit = "章") {
  elements.titleUnit.textContent = unit;
  elements.chapterTitleRow.classList.toggle("is-chapter-active", active);
  elements.chapterNumber.readOnly = !active;
  elements.chapterTitle.readOnly = !active;
  elements.chapterNumber.disabled = !active;
  elements.chapterTitle.disabled = !active;
  if (!active) {
    setChapterNumberValue("");
    elements.chapterTitle.value = title;
  }
}

function setChapterHeader(chapter) {
  const parts = getChapterTitleParts(chapter);
  elements.titleUnit.textContent = "章";
  setChapterNumberValue(parts.number || String(nextChapterNumber(chapter.volume)));
  elements.chapterTitle.value = parts.name;
  setChapterHeaderMode(true, "", "章");
}

function setVolumeHeader(volume) {
  const parts = getVolumeTitleParts(volume);
  elements.titleUnit.textContent = "卷";
  setChapterNumberValue(parts.number || String(nextVolumeNumber()));
  elements.chapterTitle.value = parts.name;
  setChapterHeaderMode(true, "", "卷");
}

function applyInferredChapterTitle(chapter) {
  if (!chapter) return false;
  const parts = getChapterTitleParts(chapter);
  if (!parts.number && !parts.name) return false;

  const previousTitle = chapter.title;
  const previousNumber = chapter.chapterNumber;
  const previousName = chapter.chapterName;
  chapter.chapterNumber = parts.number;
  chapter.chapterName = parts.name;
  chapter.title = formatChapterTitle(parts.number, parts.name);
  return previousTitle !== chapter.title || previousNumber !== chapter.chapterNumber || previousName !== chapter.chapterName;
}

function refreshTermOccurrenceChapterTitles(chapter) {
  let changed = false;
  state.terms.forEach((term) => {
    (term.occurrences || []).forEach((occurrence) => {
      if (occurrence.chapterId !== chapter.id || occurrence.chapterTitle === chapter.title) return;
      occurrence.chapterTitle = chapter.title;
      changed = true;
    });
  });
  if (changed) persistTerms(false);
}

async function commitChapterTitle({ enforceNumber = true } = {}) {
  let number = sanitizeChapterNumber(elements.chapterNumber.value);
  setChapterNumberValue(number);
  let name = elements.chapterTitle.value.trim();

  if (state.selectedNode.type === "volume") {
    const volume = findVolume(state.selectedNode.id);
    if (!volume) return;
    const typed = parseVolumeTitle(name);
    if (typed.number) {
      number = typed.number;
      name = typed.name;
      setChapterNumberValue(number);
    }
    if (!number && enforceNumber) {
      number = String(nextVolumeNumber());
      setChapterNumberValue(number);
    }
    if (!number && !name) return;

    volume.volumeNumber = number;
    volume.volumeName = name;
    volume.title = formatVolumeTitle(number, name);
    elements.chapterTitle.value = name;
    let renamed = false;
    if (enforceNumber) {
      try {
        renamed = await runTitleFileSync(() => syncVolumeDirectoryName(volume));
      } catch (error) {
        showToast(error.message || "卷目录重命名失败");
      }
    }
    persistLocalProject();
    renderTree();
    saveAppState();
    if (!state.dirty) setSaveState(renamed ? "卷名和目录名已更新" : "卷名已更新");
    return;
  }

  const chapter = findChapter();
  if (!chapter) return;

  const typed = parseChapterTitle(name);
  if (typed.number) {
    number = typed.number;
    name = typed.name;
    setChapterNumberValue(number);
  }
  if (!number && enforceNumber) {
    number = String(nextChapterNumber(chapter.volume));
    setChapterNumberValue(number);
  }
  if (!number && !name) return;

  chapter.chapterNumber = number;
  chapter.chapterName = name;
  chapter.title = formatChapterTitle(number, name);
  elements.chapterTitle.value = name;
  refreshTermOccurrenceChapterTitles(chapter);
  let renamed = false;
  if (enforceNumber) {
    try {
      renamed = await runTitleFileSync(() => syncChapterFileName(chapter));
    } catch (error) {
      showToast(error.message || "章节文件重命名失败");
    }
  }
  persistLocalProject();
  renderTree();
  saveAppState();
  if (!state.dirty) setSaveState(renamed ? "标题和文件名已更新" : "标题已更新");
}

function inferChapterTitle(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "");
  if (/^\d+$/.test(base)) return `第${base}章`;
  return base;
}

function isTextFile(name) {
  return /\.(txt|md|markdown)$/i.test(name);
}

function isIgnoredName(name) {
  return name.startsWith(".") || ["node_modules", "__pycache__"].includes(name);
}

function safeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "未命名";
}

async function writeFile(handle, content) {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

let titleFileSyncPromise = Promise.resolve();

async function runTitleFileSync(task) {
  const next = titleFileSyncPromise.catch(() => {}).then(task);
  titleFileSyncPromise = next;
  return await next;
}

async function settlePendingContentSave() {
  window.clearTimeout(state.saveTimer);
  await state.savePromise.catch(() => {});
}

function chapterFileExtension(chapter) {
  const { ext } = splitFileName(chapter?.fileName || chapter?.path || "");
  return /^\.(txt|md|markdown)$/i.test(ext) ? ext : ".txt";
}

function updateChapterReferenceId(chapter, nextId) {
  const previousId = chapter.id;
  if (!previousId || previousId === nextId) return false;

  chapter.id = nextId;
  if (state.activeChapterId === previousId) state.activeChapterId = nextId;
  if (state.selectedNode.type === "chapter" && state.selectedNode.id === previousId) {
    state.selectedNode = { type: "chapter", id: nextId };
  }
  if (state.editorHistory.chapterId === previousId) state.editorHistory.chapterId = nextId;

  const draft = getDraft(previousId);
  if (draft !== null) {
    setDraft(nextId, draft);
    removeDraft(previousId);
  }

  let termChanged = false;
  state.terms.forEach((term) => {
    (term.occurrences || []).forEach((occurrence) => {
      if (occurrence.chapterId !== previousId) return;
      occurrence.chapterId = nextId;
      termChanged = true;
    });
  });
  return termChanged;
}

function updateVolumeReferenceId(volume, nextId) {
  const previousId = volume.id;
  if (!previousId || previousId === nextId) return;

  volume.id = nextId;
  if (state.activeVolumeId === previousId) state.activeVolumeId = nextId;
  if (state.selectedNode.type === "volume" && state.selectedNode.id === previousId) {
    state.selectedNode = { type: "volume", id: nextId };
  }
  if (state.expanded.has(previousId)) {
    state.expanded.delete(previousId);
    state.expanded.add(nextId);
  }
}

async function syncChapterFileName(chapter) {
  if (!state.rootHandle || !chapter?.handle || !chapter.fileName) return false;
  const volume = chapter.volume || findVolume(state.activeVolumeId);
  const parentHandle = volume?.dirName
    ? volume.handle || (await state.rootHandle.getDirectoryHandle(volume.dirName, { create: true }))
    : state.rootHandle;
  if (!parentHandle) return false;

  const preferredName = `${safeFileName(chapterDisplayTitle(chapter))}${chapterFileExtension(chapter)}`;
  const nextFileName = await getAvailableFileNameExcept(parentHandle, preferredName, chapter.fileName);
  if (nextFileName === chapter.fileName) return false;

  await settlePendingContentSave();
  const wasActive = state.activeChapterId === chapter.id;
  const content = wasActive ? getEditorText() : await loadChapterContent(chapter);
  const nextHandle = await parentHandle.getFileHandle(nextFileName, { create: true });
  await writeFile(nextHandle, content);

  try {
    await parentHandle.removeEntry(chapter.fileName);
  } catch (error) {
    if (error?.name !== "NotFoundError") throw error;
  }

  chapter.fileName = nextFileName;
  chapter.handle = nextHandle;
  chapter.content = content;
  chapter.path = `${volume?.dirName ? `${volume.dirName}/` : ""}${nextFileName}`;
  const termChanged = updateChapterReferenceId(chapter, `fs:${volume?.dirName || "root"}/${nextFileName}`);
  if (termChanged) persistTerms(false);
  if (wasActive) state.dirty = false;
  return true;
}

async function syncVolumeDirectoryName(volume) {
  if (!state.rootHandle || !volume?.dirName || !volume.handle) return false;

  const nextDirName = await getAvailableDirectoryName(state.rootHandle, safeFileName(volumeDisplayTitle(volume)), volume.dirName);
  if (nextDirName === volume.dirName) return false;

  await settlePendingContentSave();
  const previousDirName = volume.dirName;
  const nextHandle = await state.rootHandle.getDirectoryHandle(nextDirName, { create: true });
  let termChanged = false;
  let touchedActiveChapter = false;

  for (const chapter of volume.chapters) {
    const wasActive = state.activeChapterId === chapter.id;
    touchedActiveChapter = touchedActiveChapter || wasActive;
    const content = wasActive ? getEditorText() : await loadChapterContent(chapter);
    const preferredFileName = chapter.fileName || chapterFileName(chapter);
    const nextFileName = await getAvailableFileName(nextHandle, preferredFileName);
    const nextFileHandle = await nextHandle.getFileHandle(nextFileName, { create: true });
    await writeFile(nextFileHandle, content);

    chapter.fileName = nextFileName;
    chapter.handle = nextFileHandle;
    chapter.content = content;
    chapter.path = `${nextDirName}/${nextFileName}`;
    termChanged = updateChapterReferenceId(chapter, `fs:${nextDirName}/${nextFileName}`) || termChanged;
  }

  volume.dirName = nextDirName;
  volume.handle = nextHandle;
  updateVolumeReferenceId(volume, `fs:${nextDirName}`);

  try {
    await state.rootHandle.removeEntry(previousDirName, { recursive: true });
  } catch (error) {
    if (error?.name !== "NotFoundError") console.warn(error);
  }

  if (termChanged) persistTerms(false);
  if (touchedActiveChapter) state.dirty = false;
  return true;
}

function setSaveState(text) {
  elements.saveState.textContent = text;
}

async function getFileHandleByRelativePath(rootHandle, relativePath) {
  const parts = String(relativePath || "")
    .split(/[\\/]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  let parent = rootHandle;
  for (const dirName of parts.slice(0, -1)) {
    parent = await parent.getDirectoryHandle(dirName);
  }
  return await parent.getFileHandle(parts[parts.length - 1]);
}

async function resolveChapterFileHandle(chapter) {
  if (chapter?.handle) return chapter.handle;
  const relativePath =
    chapter?.path ||
    (chapter?.fileName
      ? `${chapter.volume?.dirName ? `${chapter.volume.dirName}/` : ""}${chapter.fileName}`
      : "");
  if (!relativePath) return null;

  let rootHandle = state.rootHandle;
  if (!rootHandle) {
    rootHandle = await readCachedDirectoryHandle();
    if (!rootHandle || !(await ensureDirectoryPermission(rootHandle, true))) return null;
    state.rootHandle = rootHandle;
  }

  try {
    const handle = await getFileHandleByRelativePath(rootHandle, relativePath);
    chapter.handle = handle;
    return handle;
  } catch {
    return null;
  }
}

async function loadChapterContent(chapter) {
  const draft = getDraft(chapter.id);
  if (draft !== null && !chapter.handle) return draft;
  if (typeof chapter.content === "string") return chapter.content;
  const handle = await resolveChapterFileHandle(chapter);
  if (handle) {
    const file = await handle.getFile();
    return await file.text();
  }
  if (chapter.path) {
    const response = await fetch(encodeURI(chapter.path), { cache: "no-store" });
    if (!response.ok) throw new Error(`无法读取 ${chapter.path}`);
    return await response.text();
  }
  return "";
}

async function selectBook() {
  await flushSave();
  const chapterCount = getFlatChapters().length;
  state.activeChapterId = null;
  state.activeVolumeId = null;
  setSelection("book", "book");
  resetEditorHistory(null, "");
  setChapterHeaderMode(false, state.project?.title || "小说编辑器");
  setEditorText("", false);
  setEditorPlaceholder("选择左侧章节，或打开一个本地书稿目录。");
  setEditorEnabled(false);
  elements.saveNow.disabled = true;
  updateTermActionState();
  setSaveState(`${state.project?.volumes.length || 0} 卷 · ${chapterCount} 章`);
  updateStats("");
  syncEditorHeight();
  renderTree();
  renderTermPanel();
  saveAppState();
}

async function selectVolume(volumeId) {
  await flushSave();
  const volume = findVolume(volumeId);
  if (!volume) return;
  state.activeChapterId = null;
  state.activeVolumeId = volume.id;
  setSelection("volume", volume.id);
  resetEditorHistory(null, "");
  setVolumeHeader(volume);
  setEditorText("", false);
  setEditorPlaceholder("选择章节开始编辑。");
  setEditorEnabled(false);
  elements.saveNow.disabled = true;
  updateTermActionState();
  setSaveState(`${volume.chapters.length} 章`);
  updateStats("");
  syncEditorHeight();
  renderTree();
  renderTermPanel();
  saveAppState();
}

async function selectChapter(chapterId) {
  await flushSave();
  const item = findChapter(chapterId);
  if (!item) return;

  state.activeChapterId = chapterId;
  state.activeVolumeId = item.volume.id;
  setSelection("chapter", chapterId);
  state.expanded.add("book");
  state.expanded.add(item.volume.id);
  renderTree();
  renderTermPanel();

  try {
    const content = await loadChapterContent(item);
    item.content = content;
    const titleChanged = applyInferredChapterTitle(item);
    setEditorEnabled(true);
    setEditorText(content, true);
    resetEditorHistory(chapterId, content);
    setEditorPlaceholder("");
    setChapterHeader(item);
    elements.saveNow.disabled = false;
    updateTermActionState();
    state.dirty = false;
    setSaveState(item.handle ? "已连接本地文件" : "已载入浏览器副本");
    updateStats(content);
    if (titleChanged) {
      persistLocalProject();
      renderTree();
    }
    saveAppState();
  } catch (error) {
    showToast(error.message || "章节读取失败");
  }
}

function queueSave() {
  state.dirty = true;
  setSaveState("未保存");
  elements.saveNow.disabled = false;
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    void saveActiveChapter();
  }, SAVE_DELAY_MS);
}

async function flushSave() {
  window.clearTimeout(state.saveTimer);
  if (state.dirty) await saveActiveChapter();
  await state.savePromise;
}

async function saveActiveChapter() {
  const item = findChapter();
  if (!item) return;

  const content = getEditorText();
  setSaveState("正在保存...");
  state.savePromise = state.savePromise
    .catch(() => {})
    .then(async () => {
      if (item.handle) {
        await writeFile(item.handle, content);
        item.content = content;
        setSaveState(`已保存到文件 ${timeLabel()}`);
      } else {
        item.content = content;
        setDraft(item.id, content);
        persistLocalProject();
        setSaveState(`已保存到浏览器 ${timeLabel()}`);
      }
      state.dirty = getEditorText() !== content;
      updateStats(content);
    })
    .catch((error) => {
      state.dirty = true;
      setSaveState("保存失败");
      showToast(error.message || "保存失败");
    });

  return state.savePromise;
}

function persistLocalProject() {
  if (!state.project) return;
  const project = {
    title: state.project.title,
    source: "local",
    volumes: state.project.volumes.map((volume) => ({
      id: volume.id,
      title: volumeDisplayTitle(volume),
      volumeNumber: getVolumeTitleParts(volume).number,
      volumeName: getVolumeTitleParts(volume).name,
      dirName: volume.dirName,
      chapters: volume.chapters.map((chapter) => {
        const path = chapter.path || (chapter.fileName ? `${volume.dirName ? `${volume.dirName}/` : ""}${chapter.fileName}` : undefined);
        const saved = {
          id: chapter.id,
          title: chapter.title,
          chapterNumber: getChapterTitleParts(chapter).number,
          chapterName: getChapterTitleParts(chapter).name,
          fileName: chapter.fileName,
          path,
        };

        if (!state.rootHandle) {
          const draft = getDraft(chapter.id);
          if (typeof chapter.content === "string") saved.content = chapter.content;
          else if (draft !== null) saved.content = draft;
        }

        return saved;
      }),
    })),
  };
  writeJSON(PROJECT_KEY, project);
}

function makeRow({ id, title, level, count, leaf = false, active = false, onLabel }) {
  const row = document.createElement("div");
  row.className = `tree-row level-${level}`;
  row.classList.toggle("is-active", active);

  const toggle = document.createElement("button");
  toggle.className = "tree-toggle";
  toggle.type = "button";
  toggle.textContent = state.expanded.has(id) ? "−" : "+";
  toggle.setAttribute("aria-label", state.expanded.has(id) ? "折叠" : "展开");
  if (leaf) {
    toggle.classList.add("is-empty");
    toggle.tabIndex = -1;
  } else {
    toggle.addEventListener("click", () => {
      if (state.expanded.has(id)) state.expanded.delete(id);
      else state.expanded.add(id);
      renderTree();
      saveAppState();
    });
  }

  const label = document.createElement("button");
  label.className = "tree-label";
  label.type = "button";
  label.title = title;
  label.textContent = title;
  label.addEventListener("click", onLabel || (() => {
    if (!leaf) {
      if (state.expanded.has(id)) state.expanded.delete(id);
      else state.expanded.add(id);
      renderTree();
    }
  }));

  const meta = document.createElement("span");
  meta.className = "tree-count";
  meta.textContent = count ?? "";

  row.append(toggle, label, meta);
  return row;
}

function renderTree() {
  elements.tree.replaceChildren();
  if (!state.project) return;

  elements.bookTitle.textContent = state.project.title;
  const chapterCount = state.project.volumes.reduce((sum, volume) => sum + volume.chapters.length, 0);
  const fragment = document.createDocumentFragment();
  fragment.append(
    makeRow({
      id: "book",
      title: state.project.title,
      level: 0,
      count: chapterCount,
      leaf: false,
      active: state.selectedNode.type === "book",
      onLabel: () => void selectBook(),
    }),
  );

  if (!state.expanded.has("book")) {
    elements.tree.append(fragment);
    return;
  }

  state.project.volumes.forEach((volume) => {
    const volumeTitle = volumeDisplayTitle(volume);
    fragment.append(
      makeRow({
        id: volume.id,
        title: volumeTitle,
        level: 1,
        count: volume.chapters.length,
        leaf: false,
        active: state.selectedNode.type === "volume" && state.selectedNode.id === volume.id,
        onLabel: () => void selectVolume(volume.id),
      }),
    );

    if (!state.expanded.has(volume.id)) return;

    volume.chapters.forEach((chapter) => {
      const title = chapterDisplayTitle(chapter);
      fragment.append(
        makeRow({
          id: chapter.id,
          title,
          level: 2,
          leaf: true,
          active: state.selectedNode.type === "chapter" && state.selectedNode.id === chapter.id,
          onLabel: () => {
            void selectChapter(chapter.id);
            elements.appShell.classList.remove("sidebar-open");
          },
        }),
      );
    });
  });

  elements.tree.append(fragment);
}

function chapterFileName(chapter) {
  if (chapter.fileName) return chapter.fileName;
  if (chapter.path) return chapter.path.split(/[\\/]/).pop();
  return `${safeFileName(chapter.title)}.txt`;
}

function trashTimeLabel(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function renderTrash() {
  elements.trashCount.textContent = String(state.trash.length);
  elements.trashToggle.setAttribute("aria-expanded", String(state.trashExpanded));
  elements.trashList.hidden = !state.trashExpanded;
  elements.trashList.replaceChildren();

  if (!state.trashExpanded) return;

  if (!state.trash.length) {
    const empty = document.createElement("div");
    empty.className = "trash-empty";
    empty.textContent = "空";
    elements.trashList.append(empty);
    return;
  }

  state.trash.forEach((item) => {
    const row = document.createElement("div");
    row.className = "trash-item";

    const main = document.createElement("div");
    main.className = "trash-main";

    const title = document.createElement("div");
    title.className = "trash-title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "trash-meta";
    const type =
      item.type === "volume"
        ? `卷 · ${item.chapters.length} 章`
        : item.type === "term"
          ? "词条"
          : item.original?.volumeTitle || "章节";
    meta.textContent = `${type} · ${trashTimeLabel(item.deletedAt)}`;

    const restore = document.createElement("button");
    restore.className = "icon-button";
    restore.type = "button";
    restore.title = "恢复";
    restore.setAttribute("aria-label", `恢复 ${item.title}`);
    restore.innerHTML = '<span class="icon icon-restore" aria-hidden="true"></span>';
    restore.addEventListener("click", () => void restoreTrashItem(item.id));

    main.append(title, meta);
    row.append(main, restore);
    elements.trashList.append(row);
  });
}

async function snapshotChapter(chapter, volume) {
  const content = state.activeChapterId === chapter.id ? getEditorText() : await loadChapterContent(chapter);
  chapter.content = content;
  return {
    title: chapter.title,
    fileName: chapterFileName(chapter),
    content,
    original: {
      chapterId: chapter.id,
      chapterIndex: volume.chapters.indexOf(chapter),
      volumeId: volume.id,
      volumeTitle: volumeDisplayTitle(volume),
      volumeDirName: volume.dirName ?? safeFileName(volumeDisplayTitle(volume)),
      volumeIndex: state.project.volumes.indexOf(volume),
      source: state.project.source,
    },
  };
}

async function snapshotVolume(volume) {
  const chapters = [];
  for (const chapter of volume.chapters) {
    chapters.push(await snapshotChapter(chapter, volume));
  }

  return {
    id: uniqueId("trash"),
    type: "volume",
    title: volumeDisplayTitle(volume),
    deletedAt: new Date().toISOString(),
    original: {
      volumeId: volume.id,
      volumeTitle: volumeDisplayTitle(volume),
      volumeDirName: volume.dirName ?? safeFileName(volumeDisplayTitle(volume)),
      volumeIndex: state.project.volumes.indexOf(volume),
      source: state.project.source,
    },
    chapters,
  };
}

async function removeChapterFromDisk(chapter, volume) {
  if (!state.rootHandle || !chapter.fileName) return;
  const parentHandle = volume.dirName ? volume.handle : state.rootHandle;
  if (!parentHandle?.removeEntry) return;
  await parentHandle.removeEntry(chapter.fileName);
}

async function removeVolumeFromDisk(volume) {
  if (!state.rootHandle) return;
  if (volume.dirName) {
    await state.rootHandle.removeEntry(volume.dirName, { recursive: true });
    return;
  }

  for (const chapter of volume.chapters) {
    await removeChapterFromDisk(chapter, volume);
  }
}

function resetSelectionAfterDelete(message) {
  state.activeChapterId = null;
  state.activeVolumeId = null;
  setSelection("book", "book");
  setChapterHeaderMode(false, state.project?.title || "小说编辑器");
  setEditorText("", false);
  setEditorPlaceholder("选择左侧章节，或打开一个本地书稿目录。");
  setEditorEnabled(false);
  elements.saveNow.disabled = true;
  updateTermActionState();
  setSaveState(message);
  updateStats("");
  syncEditorHeight();
  renderTree();
  renderTermPanel();
}

async function moveChapterToTrash(chapterId) {
  const chapter = findChapter(chapterId);
  if (!chapter) return;
  const volume = chapter.volume;
  const snapshot = await snapshotChapter(chapter, volume);
  const trashItem = {
    id: uniqueId("trash"),
    type: "chapter",
    title: chapter.title,
    deletedAt: new Date().toISOString(),
    original: snapshot.original,
    chapters: [snapshot],
  };

  if (!persistTrash([trashItem, ...state.trash])) return;

  try {
    await removeChapterFromDisk(chapter, volume);
  } catch (error) {
    persistTrash(state.trash.filter((item) => item.id !== trashItem.id));
    throw error;
  }

  volume.chapters = volume.chapters.filter((item) => item.id !== chapter.id);
  removeDraft(chapter.id);
  persistLocalProject();
  resetSelectionAfterDelete(`${chapter.title} 已移入回收站`);
  showToast(`${chapter.title} 已移入回收站`);
}

async function moveVolumeToTrash(volumeId) {
  const volume = findVolume(volumeId);
  if (!volume) return;
  const trashItem = await snapshotVolume(volume);

  if (!persistTrash([trashItem, ...state.trash])) return;

  try {
    await removeVolumeFromDisk(volume);
  } catch (error) {
    persistTrash(state.trash.filter((item) => item.id !== trashItem.id));
    throw error;
  }

  state.project.volumes = state.project.volumes.filter((item) => item.id !== volume.id);
  trashItem.chapters.forEach((chapter) => removeDraft(chapter.original.chapterId));
  state.expanded.delete(volume.id);
  persistLocalProject();
  resetSelectionAfterDelete(`${trashItem.title} 已移入回收站`);
  showToast(`${trashItem.title} 已移入回收站`);
}

async function moveSelectedToTrash() {
  if (!canDeleteSelected()) return;

  try {
    if (state.selectedNode.type === "term") {
      moveTermToTrash(state.selectedNode.id);
      return;
    }
    if (!state.project) return;
    await flushSave();
    if (state.selectedNode.type === "volume") await moveVolumeToTrash(state.selectedNode.id);
    if (state.selectedNode.type === "chapter") await moveChapterToTrash(state.selectedNode.id);
  } catch (error) {
    showToast(error.message || "删除失败");
  }
}

async function ensureVolumeForRestore(original, fallbackTitle) {
  const dirName = original?.volumeDirName ?? safeFileName(fallbackTitle);
  const existing =
    findVolume(original?.volumeId) ||
    state.project.volumes.find((volume) => (volume.dirName ?? safeFileName(volume.title)) === dirName);

  if (existing) return existing;

  let handle = null;
  if (state.rootHandle) {
    handle = dirName ? await state.rootHandle.getDirectoryHandle(dirName, { create: true }) : state.rootHandle;
  }

  const volume = {
    id: state.rootHandle ? (dirName ? `fs:${dirName}` : "fs:root") : original?.volumeId || uniqueId("local:volume"),
    title: original?.volumeTitle || fallbackTitle,
    dirName,
    handle,
    chapters: [],
  };

  const index = Number.isInteger(original?.volumeIndex)
    ? Math.min(Math.max(original.volumeIndex, 0), state.project.volumes.length)
    : state.project.volumes.length;
  state.project.volumes.splice(index, 0, volume);
  return volume;
}

async function restoreChapterSnapshot(snapshot, volume) {
  let fileName = snapshot.fileName || `${safeFileName(snapshot.title)}.txt`;
  let handle = null;
  const content = snapshot.content || "";

  if (state.rootHandle) {
    const parentHandle = volume.dirName
      ? volume.handle || (await state.rootHandle.getDirectoryHandle(volume.dirName, { create: true }))
      : state.rootHandle;
    volume.handle = parentHandle;
    fileName = await getAvailableFileName(parentHandle, fileName);
    handle = await parentHandle.getFileHandle(fileName, { create: true });
    await writeFile(handle, content);
  } else {
    fileName = getAvailableLocalFileName(volume, fileName);
  }

  const originalId = snapshot.original?.chapterId;
  const chapterId =
    state.rootHandle
      ? `fs:${volume.dirName || "root"}/${fileName}`
      : originalId && !findChapter(originalId)
        ? originalId
        : uniqueId("local:chapter");
  const chapter = {
    id: chapterId,
    title: snapshot.title,
    fileName,
    handle,
    content,
  };

  const index = Number.isInteger(snapshot.original?.chapterIndex)
    ? Math.min(Math.max(snapshot.original.chapterIndex, 0), volume.chapters.length)
    : volume.chapters.length;
  volume.chapters.splice(index, 0, chapter);
  if (!state.rootHandle) setDraft(chapter.id, content);
  return chapter.id;
}

function restoreTermTrashItem(item) {
  const term = normalizeTermLibrary([item.term])[0];
  if (!term) return false;

  const existing = findTermByAnyName(term.name, term.aliases);
  let restored = term;
  if (existing) {
    mergeTermRecord(existing, term);
    restored = existing;
  } else {
    const index = Number.isInteger(item.original?.termIndex)
      ? Math.min(Math.max(item.original.termIndex, 0), state.terms.length)
      : state.terms.length;
    state.terms.splice(index, 0, term);
  }

  state.terms = dedupeTermLibrary(state.terms);
  persistTrash(state.trash.filter((trashItem) => trashItem.id !== item.id));
  persistTerms();
  selectTerm(restored.id);
  setEditorText(getEditorText(), true);
  showToast(`${item.title} 已恢复`);
  return true;
}

async function restoreTrashItem(itemId) {
  const item = state.trash.find((trashItem) => trashItem.id === itemId);
  if (!item) return;

  if (item.type === "term") {
    restoreTermTrashItem(item);
    return;
  }

  if (!state.project) return;

  try {
    const source = item.original?.source || item.chapters?.[0]?.original?.source;
    if (source === "fs" && !state.rootHandle) {
      showToast("先打开原目录，再恢复文件。");
      return;
    }

    await flushSave();
    let restoredChapterId = null;

    if (item.type === "volume") {
      const volume = await ensureVolumeForRestore(item.original, item.title);
      for (const chapter of item.chapters) {
        restoredChapterId = restoredChapterId || (await restoreChapterSnapshot(chapter, volume));
      }
      state.expanded.add(volume.id);
    } else {
      const chapter = item.chapters[0];
      const volume = await ensureVolumeForRestore(chapter.original || item.original, chapter.original?.volumeTitle || "资料");
      restoredChapterId = await restoreChapterSnapshot(chapter, volume);
      state.expanded.add(volume.id);
    }

    state.expanded.add("book");
    persistTrash(state.trash.filter((trashItem) => trashItem.id !== item.id));
    persistLocalProject();
    renderTree();
    if (restoredChapterId) await selectChapter(restoredChapterId);
    showToast(`${item.title} 已恢复`);
  } catch (error) {
    showToast(error.message || "恢复失败");
  }
}

async function loadManifestProject() {
  const response = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("no manifest");
  const manifest = await response.json();
  return {
    title: manifest.title || "本地书稿",
    source: "manifest",
    volumes: (manifest.volumes || []).map((volume, volumeIndex) => ({
      id: `manifest:volume:${volumeIndex}:${volume.title}`,
      title: volume.title || `第${volumeIndex + 1}卷`,
      chapters: (volume.chapters || []).map((chapter, chapterIndex) => ({
        id: chapter.path || `manifest:chapter:${volumeIndex}:${chapterIndex}`,
        title: chapter.title || inferChapterTitle(chapter.path || `${chapterIndex + 1}.txt`),
        path: chapter.path,
      })),
    })),
  };
}

async function scanVolume(volumeHandle, parentId) {
  const chapters = [];
  for await (const [name, handle] of volumeHandle.entries()) {
    if (handle.kind !== "file" || !isTextFile(name) || isIgnoredName(name)) continue;
    chapters.push({
      id: `fs:${parentId}/${name}`,
      title: inferChapterTitle(name),
      fileName: name,
      handle,
    });
  }
  chapters.sort(naturalSort);
  return chapters;
}

async function scanDirectory(rootHandle) {
  const volumeCandidates = [];
  const rootChapters = [];

  for await (const [name, handle] of rootHandle.entries()) {
    if (isIgnoredName(name)) continue;
    if (handle.kind === "directory") {
      volumeCandidates.push({ name, handle });
    } else if (handle.kind === "file" && isTextFile(name)) {
      rootChapters.push({
        id: `fs:root/${name}`,
        title: inferChapterTitle(name),
        fileName: name,
        handle,
      });
    }
  }

  const volumes = await Promise.all(
    volumeCandidates.map(async ({ name, handle }) => ({
      id: `fs:${name}`,
      title: name,
      dirName: name,
      handle,
      chapters: await scanVolume(handle, name),
    })),
  );

  volumes.sort(naturalSort);
  rootChapters.sort(naturalSort);
  if (rootChapters.length) {
    volumes.push({
      id: "fs:root",
      title: "资料",
      dirName: "",
      handle: rootHandle,
      chapters: rootChapters,
    });
  }

  return {
    title: rootHandle.name || "本地书稿",
    source: "fs",
    volumes,
  };
}

function getInitialExpandedVolumeIds(project) {
  const volumes = project?.volumes || [];
  const chapterCount = volumes.reduce((sum, volume) => sum + volume.chapters.length, 0);
  if (chapterCount <= MAX_INITIAL_EXPANDED_CHAPTERS) return volumes.map((volume) => volume.id);
  const firstWithChapters = volumes.find((volume) => volume.chapters.length);
  return firstWithChapters ? [firstWithChapters.id] : volumes.slice(0, 1).map((volume) => volume.id);
}

function getStartupExpandedVolumeIds(project, savedExpanded = []) {
  if (!savedExpanded.length) return getInitialExpandedVolumeIds(project);

  const volumesById = new Map((project?.volumes || []).map((volume) => [volume.id, volume]));
  const savedVolumeIds = savedExpanded.filter((id) => volumesById.has(id));
  const expandedChapterCount = savedVolumeIds.reduce((sum, id) => sum + volumesById.get(id).chapters.length, 0);
  if (expandedChapterCount <= MAX_INITIAL_EXPANDED_CHAPTERS) return savedVolumeIds;
  return savedVolumeIds.slice(0, 1);
}

async function loadDirectoryProject(handle, cachedProject = null) {
  state.rootHandle = handle;
  const [project, terms] = await Promise.all([scanDirectory(handle), loadTermsFromDisk(handle)]);
  if (cachedProject?.source === "local" && cachedProject.title) project.title = cachedProject.title;
  state.project = project;
  setTerms(terms);
  persistLocalProject();
  return project;
}

async function restoreCachedDirectory(cachedProject = null) {
  const handle = await readCachedDirectoryHandle();
  if (!handle) return false;

  try {
    const granted = await ensureDirectoryPermission(handle, true);
    if (!granted) return false;
    await loadDirectoryProject(handle, cachedProject);
    return true;
  } catch {
    await removeCachedDirectoryHandle();
    state.rootHandle = null;
    return false;
  }
}

async function openDirectory() {
  if (!("showDirectoryPicker" in window)) {
    showToast("当前浏览器不支持直接保存到本地目录，可继续使用浏览器自动保存。");
    return;
  }

  try {
    await flushSave();
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    setSaveState("正在扫描目录...");
    await nextFrame();
    await writeCachedDirectoryHandle(handle);
    await loadDirectoryProject(handle);
    state.selectedTermId = null;
    state.activeChapterId = null;
    state.activeVolumeId = null;
    setSelection("book", "book");
    state.expanded = new Set(["book", ...getInitialExpandedVolumeIds(state.project)]);
    const first = getFlatChapters()[0];
    if (first) await selectChapter(first.id);
    else {
      renderTree();
      renderTermPanel();
      setEditorText("", false);
      setEditorEnabled(false);
      setChapterHeaderMode(false, "空书稿");
      updateTermActionState();
      setSaveState("目录已连接");
      updateStats("");
      syncEditorHeight();
      saveAppState();
    }
    showToast("目录已打开，之后会自动保存到文件。");
  } catch (error) {
    if (error?.name !== "AbortError") showToast(error.message || "打开目录失败");
  }
}

async function createVolume() {
  if (!state.project) return;
  const volumeNumber = String(nextVolumeNumber());
  const volumeName = window.prompt("卷名（可留空，之后可在正文上方修改）", "")?.trim();
  if (volumeName === undefined) return;
  const title = formatVolumeTitle(volumeNumber, volumeName);

  let handle = null;
  const dirName = safeFileName(title);
  if (state.rootHandle) {
    handle = await state.rootHandle.getDirectoryHandle(dirName, { create: true });
  }

  const volume = {
    id: state.rootHandle ? `fs:${dirName}` : `local:volume:${Date.now()}`,
    title,
    volumeNumber,
    volumeName,
    dirName: state.rootHandle ? dirName : undefined,
    handle,
    chapters: [],
  };
  state.project.volumes.push(volume);
  state.project.volumes.sort(naturalSort);
  state.expanded.add("book");
  state.expanded.add(volume.id);
  state.activeVolumeId = volume.id;
  state.activeChapterId = null;
  setSelection("volume", volume.id);
  persistLocalProject();
  renderTree();
  renderTermPanel();
  setVolumeHeader(volume);
  saveAppState();
  showToast("新卷已创建");
}

async function createChapter() {
  if (!state.project) return;
  let volume = findVolume();
  if (!volume) volume = state.project.volumes.find((item) => item.handle || !state.rootHandle) || state.project.volumes[0];
  if (!volume) {
    await createVolume();
    volume = findVolume();
  }
  if (!volume) return;

  const chapterNumber = String(nextChapterNumber(volume));
  const chapterName = window.prompt("章节标题（可留空，之后可在正文上方修改）", "")?.trim();
  if (chapterName === undefined) return;
  const title = formatChapterTitle(chapterNumber, chapterName);

  const content = `${title}\n\n`;
  let handle = null;
  let fileName = `${safeFileName(title)}.txt`;
  if (state.rootHandle) {
    if (!volume.handle) {
      showToast("请先选择一个卷目录。");
      return;
    }
    handle = await volume.handle.getFileHandle(fileName, { create: true });
    await writeFile(handle, content);
  }

  const chapter = {
    id: state.rootHandle ? `fs:${volume.dirName || "root"}/${fileName}` : `local:chapter:${Date.now()}`,
    title,
    chapterNumber,
    chapterName,
    fileName,
    handle,
    content,
  };
  volume.chapters.push(chapter);
  volume.chapters.sort(naturalSort);
  state.expanded.add("book");
  state.expanded.add(volume.id);
  persistLocalProject();
  renderTree();
  await selectChapter(chapter.id);
  showToast("新章节已创建");
}

function isEditingTarget(target) {
  if (!target) return false;
  const tagName = target.tagName;
  return target.isContentEditable || tagName === "TEXTAREA" || tagName === "INPUT" || tagName === "SELECT";
}

function isEditorHistoryTarget(target) {
  if (!state.activeChapterId) return false;
  if (target?.closest?.("#editor")) return true;
  return !isEditingTarget(target);
}

function isDesktopLayout() {
  return !window.matchMedia("(max-width: 900px)").matches;
}

function normalizePanelWidth(value, limits, fallback) {
  const width = Math.round(clampNumber(value, limits, fallback));
  return width < 48 ? 0 : width;
}

function normalizeToolbarHeight(value) {
  const height = Math.round(clampNumber(value, LAYOUT_LIMITS.toolbarHeight, state.layout.toolbarHeight));
  return height < 44 ? 0 : height;
}

function fittedToolbarHeight() {
  const measured = elements.toolbar?.scrollHeight || TOOLBAR_RESTORE_HEIGHT;
  return Math.round(clampNumber(Math.max(TOOLBAR_RESTORE_HEIGHT, measured), LAYOUT_LIMITS.toolbarHeight, TOOLBAR_RESTORE_HEIGHT));
}

function restoreToolbarHeight() {
  state.layout.toolbarHeight = fittedToolbarHeight();
  applyLayout();
}

function ensureToolbarFits() {
  if (!elements.toolbar || state.layout.toolbarHeight <= 0 || !isDesktopLayout()) return;
  const fitted = fittedToolbarHeight();
  if (fitted <= state.layout.toolbarHeight) return;
  state.layout.toolbarHeight = fitted;
  applyLayout();
  saveLayout();
}

function setupResizeHandle(handle, options) {
  if (!handle) return;

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !isDesktopLayout()) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startValue = options.getValue();
    const startContext = options.onStart?.() || {};
    const sign = options.invert ? -1 : 1;

    document.body.classList.add("is-resizing");
    if (options.axis === "y") document.body.classList.add("is-resizing-vertical");
    handle.setPointerCapture?.(event.pointerId);

    const onMove = (moveEvent) => {
      moveEvent.preventDefault();
      const delta = options.axis === "y" ? moveEvent.clientY - startY : moveEvent.clientX - startX;
      options.setValue(startValue + delta * sign, delta, startContext);
    };

    const onEnd = () => {
      document.body.classList.remove("is-resizing", "is-resizing-vertical");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      options.onEnd?.();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd, { once: true });
    window.addEventListener("pointercancel", onEnd, { once: true });
  });
}

function bindResizeHandles() {
  const setPageWidth = (value) => {
    state.settings.pageWidth = Math.round(clampNumber(value, SETTING_LIMITS.pageWidth, state.settings.pageWidth));
    applySettings();
    saveSettings();
    syncEditorHeight();
  };

  setupResizeHandle(elements.pageResizeLeft, {
    axis: "x",
    invert: true,
    getValue: () => state.settings.pageWidth,
    setValue: setPageWidth,
  });

  setupResizeHandle(elements.pageResizeRight, {
    axis: "x",
    getValue: () => state.settings.pageWidth,
    setValue: setPageWidth,
  });

  const setPageHeight = (value) => {
    state.layout.pageHeight = Math.round(clampNumber(value, LAYOUT_LIMITS.pageHeight, state.layout.pageHeight));
    applyLayout();
  };

  setupResizeHandle(elements.pageResizeTop, {
    axis: "y",
    getValue: () => state.layout.pageHeight,
    onStart: () => ({
      pageHeight: state.layout.pageHeight,
      pageTopOffset: state.layout.pageTopOffset,
    }),
    setValue: (_value, delta, start) => {
      const maxOffset = Math.min(
        LAYOUT_LIMITS.pageTopOffset.max,
        start.pageTopOffset + start.pageHeight - LAYOUT_LIMITS.pageHeight.min,
      );
      const nextOffset = Math.round(
        clampNumber(start.pageTopOffset + delta, { min: LAYOUT_LIMITS.pageTopOffset.min, max: maxOffset }, state.layout.pageTopOffset),
      );
      const moved = nextOffset - start.pageTopOffset;
      state.layout.pageTopOffset = nextOffset;
      state.layout.pageHeight = Math.round(
        clampNumber(start.pageHeight - moved, LAYOUT_LIMITS.pageHeight, state.layout.pageHeight),
      );
      applyLayout();
    },
    onEnd: saveLayout,
  });

  setupResizeHandle(elements.pageResizeBottom, {
    axis: "y",
    getValue: () => state.layout.pageHeight,
    setValue: setPageHeight,
    onEnd: saveLayout,
  });
}

function bindEvents() {
  elements.openDirectory.addEventListener("click", () => void openDirectory());
  elements.newVolume.addEventListener("click", () => void createVolume());
  elements.newChapter.addEventListener("click", () => void createChapter());
  elements.saveNow.addEventListener("click", () => void saveActiveChapter());
  elements.undoEdit?.addEventListener("click", () => undoEditorChange());
  elements.redoEdit?.addEventListener("click", () => redoEditorChange());
  elements.findReplaceToggle?.addEventListener("click", () => openFindPanel());
  elements.generateChapter.addEventListener("click", () => void generateNextChapter());
  elements.expandChapter.addEventListener("click", () => void expandCurrentChapter());
  elements.generatePrompt.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    void generateNextChapter();
  });
  elements.autoTerms.addEventListener("click", () => void autoExtractTerms());
  elements.summarizeTerms.addEventListener("click", () => void summarizeTermLibrary());
  elements.addTerm.addEventListener("click", () => addManualTerm());
  elements.deleteTerm.addEventListener("click", () => deleteSelectedTerm());
  elements.chapterNumber.addEventListener("input", () => {
    setChapterNumberValue(sanitizeChapterNumber(elements.chapterNumber.value));
    if (elements.chapterNumber.value) void commitChapterTitle({ enforceNumber: false });
  });
  elements.chapterTitle.addEventListener("input", () => void commitChapterTitle({ enforceNumber: false }));
  elements.chapterNumber.addEventListener("blur", () => void commitChapterTitle());
  elements.chapterTitle.addEventListener("blur", () => void commitChapterTitle());
  elements.chapterTitleRow.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void commitChapterTitle();
    event.target.blur?.();
  });
  elements.agentModelSelect.addEventListener("change", () => {
    state.selectedAgentModel = elements.agentModelSelect.value;
    localStorage.setItem(AGENT_MODEL_KEY, state.selectedAgentModel);
    updateTermActionState();
    const selected = getSelectedAgentModelConfig();
    const label = elements.agentModelSelect.selectedOptions[0]?.textContent || "本地规则";
    showToast(selected && !selected.available ? `${label} 未配置 API Key` : `已切换模型：${label}`);
  });
  elements.openModelConfig.addEventListener("click", () => void openModelConfigModal());
  elements.closeModelConfig.addEventListener("click", closeModelConfigModal);
  elements.cancelModelConfig.addEventListener("click", closeModelConfigModal);
  elements.saveModelConfig.addEventListener("click", () => void saveModelConfigModal());
  elements.modelConfigModal.addEventListener("click", (event) => {
    if (event.target === elements.modelConfigModal) closeModelConfigModal();
    const addButton = event.target.closest?.(".config-add-model");
    if (addButton) {
      event.preventDefault();
      const section = addButton.closest(".config-provider");
      addModelConfigRow(section?.dataset.providerId);
      return;
    }

    const deleteButton = event.target.closest?.(".config-delete-model");
    if (deleteButton) {
      event.preventDefault();
      const section = deleteButton.closest(".config-provider");
      deleteModelConfigRow(section?.dataset.providerId, deleteButton.closest(".config-model-row"));
    }
  });
  elements.modelConfigModal.addEventListener("input", (event) => {
    if (event.target.closest?.(".config-model-row")) refreshModelConfigFromForm();
  });

  bindResizeHandles();

  elements.editor.addEventListener("beforeinput", (event) => {
    state.lastEditorInputType = event.inputType || "";
  });

  elements.editor.addEventListener("input", () => {
    const text = getEditorText();
    const chapter = findChapter();
    if (chapter) chapter.content = text;
    scheduleEditorHistorySnapshot(text);
    updateStats(text);
    syncEditorHeight();
    if (!elements.findPanel.hidden) refreshFindMatches({ render: false, keepIndex: true });
    queueSave();
  });

  elements.editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") || "";
    state.lastEditorInputType = "insertFromPaste";
    document.execCommand("insertText", false, text);
  });

  elements.editor.addEventListener("contextmenu", (event) => {
    const selectionInfo = getEditorSelectionInfo();
    if (!selectionInfo) {
      hideEditorContextMenu();
      return;
    }

    event.preventDefault();
    showEditorContextMenu(event, selectionInfo);
  });

  elements.editorContextMenu?.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-editor-command]");
    if (!button) return;
    event.preventDefault();
    void handleEditorContextCommand(button.dataset.editorCommand);
  });

  elements.applyBeautifyPreview.addEventListener("click", () => void applyBeautifyPreview());
  elements.rejectBeautifyPreview.addEventListener("click", closeBeautifyPreview);
  elements.cancelBeautifyPreview.addEventListener("click", closeBeautifyPreview);
  elements.beautifyPreview.addEventListener("click", (event) => {
    if (event.target === elements.beautifyPreview) closeBeautifyPreview();
  });

  elements.findInput.addEventListener("input", () => refreshFindMatches({ render: true, keepIndex: false }));
  elements.replaceInput.addEventListener("input", () => {
    state.find.replace = elements.replaceInput.value;
  });
  elements.findInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    goToFindMatch(event.shiftKey ? -1 : 1);
  });
  elements.findPrev.addEventListener("click", () => goToFindMatch(-1));
  elements.findNext.addEventListener("click", () => goToFindMatch(1));
  elements.replaceOne.addEventListener("click", () => void replaceCurrentFindMatch());
  elements.replaceAll.addEventListener("click", () => void replaceAllFindMatches());
  elements.closeFindPanel.addEventListener("click", closeFindPanel);

  elements.editor.addEventListener("click", (event) => {
    const mark = event.target.closest?.(".term-mark");
    if (!mark || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    selectTerm(mark.dataset.termId);
    void jumpToOccurrence(mark.dataset.termId, {
      chapterId: state.activeChapterId,
      index: Number(mark.dataset.termStart),
    });
  });

  elements.termName.addEventListener("change", () => commitTermName());
  elements.termName.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitTermName();
    elements.termName.blur();
  });

  elements.termPath.addEventListener("change", () => commitTermPath());
  elements.termPath.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitTermPath();
    elements.termPath.blur();
  });

  elements.termAliases.addEventListener("change", () => commitTermAliases());
  elements.termAliases.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitTermAliases();
    elements.termAliases.blur();
  });

  elements.termType.addEventListener("change", () => {
    const term = getTermById(state.selectedTermId);
    if (!term) return;
    term.manual = true;
    term.type = elements.termType.value;
    term.path = normalizeTermPath(term.path, term);
    persistTerms();
    setEditorText(getEditorText(), true);
  });

  elements.termInfo.addEventListener("input", () => {
    const term = getTermById(state.selectedTermId);
    if (!term) return;
    term.manual = true;
    term.info = elements.termInfo.value;
    persistTerms(false);
  });

  elements.trashToggle.addEventListener("click", () => {
    state.trashExpanded = !state.trashExpanded;
    renderTrash();
  });

  elements.collapseSidebar.addEventListener("click", () => {
    elements.appShell.classList.remove("sidebar-open");
  });

  elements.showToolbar.addEventListener("click", () => {
    restoreToolbarHeight();
    saveLayout();
  });

  elements.showSidebar.addEventListener("click", () => {
    elements.appShell.classList.add("sidebar-open");
  });

  elements.focusMode.addEventListener("click", () => {
    setFocusMode(!state.focusMode);
  });

  elements.exitFocusMode.addEventListener("click", () => {
    setFocusMode(false);
  });

  elements.fontFamily.addEventListener("change", () => {
    state.settings.fontFamily = elements.fontFamily.value;
    applySettings();
    saveSettings();
    syncEditorHeight();
  });

  elements.fontSize.addEventListener("input", () => {
    state.settings.fontSize = Number(elements.fontSize.value);
    applySettings();
    saveSettings();
    syncEditorHeight();
  });

  elements.lineHeight.addEventListener("input", () => {
    state.settings.lineHeight = Number(elements.lineHeight.value);
    applySettings();
    saveSettings();
    syncEditorHeight();
  });

  elements.pageWidth.addEventListener("input", () => {
    state.settings.pageWidth = Number(elements.pageWidth.value);
    applySettings();
    saveSettings();
  });

  elements.nightMode.addEventListener("change", () => {
    state.settings.nightMode = elements.nightMode.checked;
    applySettings();
    saveSettings();
  });

  window.addEventListener("resize", syncEditorHeight);
  window.addEventListener("scroll", hideEditorContextMenu, true);
  window.addEventListener("beforeunload", (event) => {
    saveAppState();
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.modelConfigModal.hidden) {
        event.preventDefault();
        closeModelConfigModal();
        return;
      }
      if (!elements.beautifyPreview.hidden) {
        event.preventDefault();
        closeBeautifyPreview();
        return;
      }
      if (!elements.findPanel.hidden && isEditingTarget(event.target)) {
        event.preventDefault();
        closeFindPanel();
        return;
      }
      hideEditorContextMenu();
      if (state.focusMode && !isEditingTarget(event.target)) {
        event.preventDefault();
        setFocusMode(false);
        return;
      }
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveActiveChapter();
    }

    const key = event.key.toLowerCase();
    const isModifier = event.ctrlKey || event.metaKey;
    if (isModifier && key === "f") {
      event.preventDefault();
      openFindPanel();
      return;
    }

    if (isModifier && key === "h") {
      event.preventDefault();
      openFindPanel({ replaceFocus: true });
      return;
    }

    if (isModifier && isEditorHistoryTarget(event.target) && (key === "z" || key === "y")) {
      const handled = key === "y" || event.shiftKey ? redoEditorChange() : undoEditorChange();
      if (handled) event.preventDefault();
      return;
    }

    if (event.key === "Delete" && canDeleteSelected() && !isEditingTarget(event.target)) {
      event.preventDefault();
      void moveSelectedToTrash();
    }
  });

  document.addEventListener("click", (event) => {
    if (elements.editorContextMenu?.contains(event.target)) return;
    hideEditorContextMenu();
  });
}

async function restoreLastEditorState(savedAppState) {
  const saved = sanitizeAppState(savedAppState);
  if (saved.focusMode) setFocusMode(true);

  const selected = saved.selectedNode || { type: "book", id: "book" };
  const chapterId = saved.activeChapterId || (selected.type === "chapter" ? selected.id : "");
  if (chapterId && findChapter(chapterId)) {
    await selectChapter(chapterId);
    return true;
  }

  const volumeId = saved.activeVolumeId || (selected.type === "volume" ? selected.id : "");
  if (volumeId && findVolume(volumeId)) {
    await selectVolume(volumeId);
    return true;
  }

  if (selected.type === "book") {
    await selectBook();
    return true;
  }

  return false;
}

async function boot() {
  const agentConfigPromise = loadAgentConfig();
  const savedAppState = sanitizeAppState(readJSON(APP_STATE_KEY, {}));
  state.settings = sanitizeSettings(readJSON(SETTINGS_KEY, {}));
  if (typeof savedAppState.nightMode === "boolean") state.settings.nightMode = savedAppState.nightMode;
  const savedLayout = readJSON(LAYOUT_KEY, {});
  state.layout = sanitizeLayout(savedLayout);
  state.agentConfig = { ...defaultAgentConfig };
  state.selectedAgentModel = chooseAgentModel(state.agentConfig);
  state.trash = readJSON(TRASH_KEY, []);
  const savedTermExpanded = readJSON(TERM_TREE_KEY, null);
  state.termExpanded = new Set(Array.isArray(savedTermExpanded) ? savedTermExpanded : []);
  state.hasSavedTermExpanded = Array.isArray(savedTermExpanded);
  setTerms(normalizeTermLibrary(readJSON(TERM_LIBRARY_KEY, [])));
  state.selectedTermId = null;
  applySettings();
  applyLayout();
  renderAgentConfig();
  bindEvents();
  void refreshAgentConfig(agentConfigPromise);

  const localProject = readJSON(PROJECT_KEY, null);
  const restoredDirectory = await restoreCachedDirectory(localProject);
  try {
    if (!restoredDirectory) state.project = localProject || (await loadManifestProject());
  } catch {
    state.project = sampleProject;
  }

  state.expanded = new Set(
    ["book", ...getStartupExpandedVolumeIds(state.project, savedAppState.expanded)],
  );
  renderTrash();

  const restored = await restoreLastEditorState(savedAppState);
  const first = getFlatChapters()[0];
  if (!restored && first) await selectChapter(first.id);
  else {
    renderTree();
    renderTermPanel();
    syncEditorHeight();
  }
}

void boot();
