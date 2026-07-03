const MANIFEST_URL = "./novel-editor.json";
const SETTINGS_KEY = "novelEditor.settings.v1";
const DRAFT_PREFIX = "novelEditor.draft.";
const PROJECT_KEY = "novelEditor.localProject.v1";
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
const TOOLBAR_RESTORE_HEIGHT = 132;

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
  trashToggle: $("#trashToggle"),
  trashList: $("#trashList"),
  trashCount: $("#trashCount"),
  autoTerms: $("#autoTerms"),
  summarizeTerms: $("#summarizeTerms"),
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
  generatePrompt: $("#generatePrompt"),
  generateChapter: $("#generateChapter"),
  expandChapter: $("#expandChapter"),
  openDirectory: $("#openDirectory"),
  newVolume: $("#newVolume"),
  newChapter: $("#newChapter"),
  saveNow: $("#saveNow"),
  collapseSidebar: $("#collapseSidebar"),
  showSidebar: $("#showSidebar"),
  fontFamily: $("#fontFamily"),
  fontSize: $("#fontSize"),
  lineHeight: $("#lineHeight"),
  pageWidth: $("#pageWidth"),
  fontSizeValue: $("#fontSizeValue"),
  lineHeightValue: $("#lineHeightValue"),
  pageWidthValue: $("#pageWidthValue"),
  bgColor: $("#bgColor"),
  textColor: $("#textColor"),
  bgSwatches: $("#bgSwatches"),
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
  bgColor: "#fbf3df",
  textColor: "#24211d",
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
  },
  dirty: false,
  settings: { ...defaultSettings },
  layout: { ...defaultLayout },
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
  return {
    ...defaultSettings,
    ...settings,
    fontSize: clampNumber(settings.fontSize, SETTING_LIMITS.fontSize, defaultSettings.fontSize),
    lineHeight: clampNumber(settings.lineHeight, SETTING_LIMITS.lineHeight, defaultSettings.lineHeight),
    pageWidth: clampNumber(settings.pageWidth, SETTING_LIMITS.pageWidth, defaultSettings.pageWidth),
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
  const saved = getSavedAgentModel();
  if (saved === "") return "";
  if (saved) {
    const savedModel = models.find((model) => model.id === saved || model.model === saved);
    if (savedModel) return savedModel.id;
  }
  const defaultModel = models.find(
    (model) => model.available && (model.id === config.defaultModel || model.model === config.defaultModel),
  );
  if (defaultModel) return defaultModel.id;
  return models.find((model) => model.available)?.id || models[0]?.id || "";
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
    option.textContent = model.label === model.id ? model.id : `${model.id} / ${model.label}`;
    if (!model.available) option.textContent += "（未配置 Key）";
    option.title = model.label;
    elements.agentModelSelect.append(option);
  });

  elements.agentModelSelect.value = state.selectedAgentModel;
  elements.agentModelSelect.disabled = false;
}

function saveSettings() {
  writeJSON(SETTINGS_KEY, state.settings);
}

function applySettings() {
  const root = document.documentElement;
  root.style.setProperty("--novel-font", state.settings.fontFamily);
  root.style.setProperty("--novel-size", `${state.settings.fontSize}px`);
  root.style.setProperty("--novel-line", state.settings.lineHeight);
  root.style.setProperty("--page-width", `${state.settings.pageWidth}px`);
  root.style.setProperty("--reader-bg", state.settings.bgColor);
  root.style.setProperty("--reader-ink", state.settings.textColor);

  elements.fontFamily.value = state.settings.fontFamily;
  elements.fontSize.value = state.settings.fontSize;
  elements.lineHeight.value = state.settings.lineHeight;
  elements.pageWidth.value = state.settings.pageWidth;
  elements.bgColor.value = normalizeColor(state.settings.bgColor);
  elements.textColor.value = normalizeColor(state.settings.textColor);
  elements.fontSizeValue.value = state.settings.fontSize;
  elements.lineHeightValue.value = state.settings.lineHeight;
  elements.pageWidthValue.value = state.settings.pageWidth;

  document.querySelectorAll(".swatch").forEach((button) => {
    button.classList.toggle("is-active", normalizeColor(button.dataset.bg) === normalizeColor(state.settings.bgColor));
  });
}

function saveLayout() {
  writeJSON(LAYOUT_KEY, state.layout);
}

function applyLayout() {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-width", `${state.layout.sidebarWidth}px`);
  root.style.setProperty("--term-width", `${state.layout.termWidth}px`);
  root.style.setProperty("--toolbar-height", `${state.layout.toolbarHeight <= 0 ? 28 : state.layout.toolbarHeight}px`);
  root.style.setProperty("--page-height", `${state.layout.pageHeight}px`);
  root.style.setProperty("--page-top-offset", `${state.layout.pageTopOffset}px`);
  elements.appShell.classList.toggle("is-sidebar-zero", state.layout.sidebarWidth <= 0);
  elements.appShell.classList.toggle("is-term-zero", state.layout.termWidth <= 0);
  elements.appShell.classList.toggle("is-toolbar-zero", state.layout.toolbarHeight <= 0);
  requestAnimationFrame(syncEditorHeight);
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

function getEditorText() {
  return elements.editor.innerText.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
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

function resetEditorHistory(chapterId = state.activeChapterId, text = "") {
  state.editorHistory = {
    chapterId,
    undo: chapterId ? [String(text || "")] : [],
    redo: [],
    lastText: String(text || ""),
    applying: false,
  };
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

  const value = String(text || "");
  if (value === history.lastText) return;
  history.undo.push(value);
  if (history.undo.length > EDITOR_HISTORY_LIMIT) history.undo.splice(0, history.undo.length - EDITOR_HISTORY_LIMIT);
  if (clearRedo) history.redo = [];
  history.lastText = value;
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
  return true;
}

function redoEditorChange() {
  const history = ensureEditorHistory();
  if (!history) return false;

  if (!history.redo.length) {
    showToast("没有可重做的正文修改");
    return true;
  }

  const next = history.redo.pop();
  history.undo.push(next);
  if (history.undo.length > EDITOR_HISTORY_LIMIT) history.undo.splice(0, history.undo.length - EDITOR_HISTORY_LIMIT);
  history.lastText = next;
  applyEditorHistoryText(next);
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
  updateStats(text);
  state.dirty = true;
  if (saveNow) await saveActiveChapter();
  else queueSave();
}

function renderEditorText(text, highlight = true) {
  elements.editor.replaceChildren();
  if (!text) return;

  const matches = highlight ? getTermMatches(text) : [];
  if (!matches.length) {
    elements.editor.textContent = text;
    return;
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start > cursor) {
      fragment.append(document.createTextNode(text.slice(cursor, match.start)));
    }

    const span = document.createElement("span");
    span.className = "term-mark";
    span.dataset.termId = match.term.id;
    span.dataset.termStart = String(match.start);
    span.setAttribute("role", "link");
    span.textContent = text.slice(match.start, match.end);
    fragment.append(span);
    cursor = match.end;
  });

  if (cursor < text.length) {
    fragment.append(document.createTextNode(text.slice(cursor)));
  }

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

function persistTerms(render = true) {
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

function getTermMatches(text) {
  if (!text || !state.terms.length) return [];
  const candidates = [];
  const used = [];
  const names = [];

  state.terms.forEach((term) => {
    [term.name, ...(term.aliases || [])].forEach((name) => {
      const normalized = normalizeTermName(name);
      if (normalized.length >= 2) names.push({ name: normalized, term });
    });
  });

  names.sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name, "zh-Hans-CN"));

  names.forEach(({ name, term }) => {
    let start = text.indexOf(name);
    while (start !== -1) {
      const end = start + name.length;
      const overlaps = used.some((range) => start < range.end && end > range.start);
      if (!overlaps) {
        candidates.push({ start, end, term });
        used.push({ start, end });
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
  if (!prompt) {
    showToast("先写一句下一章提示");
    elements.generatePrompt.focus();
    return;
  }

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

function parseChapterTitle(title = "") {
  const value = String(title || "").trim();
  const match = value.match(/^第\s*([^\s第章]+)\s*章(?:[\s,，、:：-]*(.*))?$/);
  if (!match) return { number: "", name: value };
  return {
    number: match[1].trim(),
    name: String(match[2] || "").trim(),
  };
}

function parseVolumeTitle(title = "") {
  const value = String(title || "").trim();
  const match = value.match(/^第\s*([^\s第卷]+)\s*卷(?:[\s,，、:：-]*(.*))?$/);
  if (!match) return { number: "", name: value };
  return {
    number: match[1].trim(),
    name: String(match[2] || "").trim(),
  };
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
  return {
    number: String(chapter?.chapterNumber || parsed.number || "").trim(),
    name: String(chapter?.chapterName ?? parsed.name ?? "").trim(),
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
  const number = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function sanitizeChapterNumber(value) {
  return String(value || "")
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
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

function setChapterHeaderMode(active, title = "", unit = "章") {
  elements.titleUnit.textContent = unit;
  elements.chapterTitleRow.classList.toggle("is-chapter-active", active);
  elements.chapterNumber.readOnly = !active;
  elements.chapterTitle.readOnly = !active;
  elements.chapterNumber.disabled = !active;
  elements.chapterTitle.disabled = !active;
  if (!active) {
    elements.chapterNumber.value = "";
    elements.chapterTitle.value = title;
  }
}

function setChapterHeader(chapter) {
  const parts = getChapterTitleParts(chapter);
  elements.titleUnit.textContent = "章";
  elements.chapterNumber.value = parts.number || String(nextChapterNumber(chapter.volume));
  elements.chapterTitle.value = parts.name;
  setChapterHeaderMode(true, "", "章");
}

function setVolumeHeader(volume) {
  const parts = getVolumeTitleParts(volume);
  elements.titleUnit.textContent = "卷";
  elements.chapterNumber.value = parts.number || String(nextVolumeNumber());
  elements.chapterTitle.value = parts.name;
  setChapterHeaderMode(true, "", "卷");
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

function commitChapterTitle({ enforceNumber = true } = {}) {
  let number = sanitizeChapterNumber(elements.chapterNumber.value);
  elements.chapterNumber.value = number;
  const name = elements.chapterTitle.value.trim();

  if (state.selectedNode.type === "volume") {
    const volume = findVolume(state.selectedNode.id);
    if (!volume) return;
    if (!number && enforceNumber) {
      number = String(nextVolumeNumber());
      elements.chapterNumber.value = number;
    }
    if (!number && !name) return;

    volume.volumeNumber = number;
    volume.volumeName = name;
    volume.title = formatVolumeTitle(number, name);
    elements.chapterTitle.value = name;
    persistLocalProject();
    renderTree();
    if (!state.dirty) setSaveState("卷名已更新");
    return;
  }

  const chapter = findChapter();
  if (!chapter) return;

  if (!number && enforceNumber) {
    number = String(nextChapterNumber(chapter.volume));
    elements.chapterNumber.value = number;
  }
  if (!number && !name) return;

  chapter.chapterNumber = number;
  chapter.chapterName = name;
  chapter.title = formatChapterTitle(number, name);
  elements.chapterTitle.value = name;
  refreshTermOccurrenceChapterTitles(chapter);
  persistLocalProject();
  renderTree();
  if (!state.dirty) setSaveState("标题已更新");
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

function setSaveState(text) {
  elements.saveState.textContent = text;
}

async function loadChapterContent(chapter) {
  const draft = getDraft(chapter.id);
  if (draft !== null && !chapter.handle) return draft;
  if (typeof chapter.content === "string") return chapter.content;
  if (chapter.handle) {
    const file = await chapter.handle.getFile();
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
  elements.tree.append(
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

  if (!state.expanded.has("book")) return;

  state.project.volumes.forEach((volume) => {
    const volumeTitle = volumeDisplayTitle(volume);
    elements.tree.append(
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
      elements.tree.append(
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
  const volumes = [];
  const rootChapters = [];

  for await (const [name, handle] of rootHandle.entries()) {
    if (isIgnoredName(name)) continue;
    if (handle.kind === "directory") {
      const volume = {
        id: `fs:${name}`,
        title: name,
        dirName: name,
        handle,
        chapters: await scanVolume(handle, name),
      };
      volumes.push(volume);
    } else if (handle.kind === "file" && isTextFile(name)) {
      rootChapters.push({
        id: `fs:root/${name}`,
        title: inferChapterTitle(name),
        fileName: name,
        handle,
      });
    }
  }

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

async function openDirectory() {
  if (!("showDirectoryPicker" in window)) {
    showToast("当前浏览器不支持直接保存到本地目录，可继续使用浏览器自动保存。");
    return;
  }

  try {
    await flushSave();
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    state.rootHandle = handle;
    state.project = await scanDirectory(handle);
    state.terms = await loadTermsFromDisk(handle);
    state.selectedTermId = null;
    state.activeChapterId = null;
    state.activeVolumeId = null;
    setSelection("book", "book");
    state.expanded = new Set(["book", ...state.project.volumes.map((volume) => volume.id)]);
    renderTree();
    renderTermPanel();
    const first = getFlatChapters()[0];
    if (first) await selectChapter(first.id);
    else {
      setEditorText("", false);
      setEditorEnabled(false);
      setChapterHeaderMode(false, "空书稿");
      updateTermActionState();
      setSaveState("目录已连接");
      updateStats("");
      syncEditorHeight();
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
  elements.toolbarResize.addEventListener("dblclick", () => {
    if (state.layout.toolbarHeight <= 0) restoreToolbarHeight();
    else {
      state.layout.toolbarHeight = 0;
      applyLayout();
    }
    saveLayout();
  });

  elements.sidebarResize.addEventListener("dblclick", () => {
    if (!isDesktopLayout()) return;
    state.layout.sidebarWidth = state.layout.sidebarWidth <= 0 ? SIDEBAR_RESTORE_WIDTH : 0;
    applyLayout();
    saveLayout();
  });

  elements.termPanelResize.addEventListener("dblclick", () => {
    if (!isDesktopLayout()) return;
    state.layout.termWidth = state.layout.termWidth <= 0 ? TERM_RESTORE_WIDTH : 0;
    applyLayout();
    saveLayout();
  });

  setupResizeHandle(elements.sidebarResize, {
    axis: "x",
    getValue: () => state.layout.sidebarWidth,
    setValue: (value) => {
      state.layout.sidebarWidth = normalizePanelWidth(value, LAYOUT_LIMITS.sidebarWidth, state.layout.sidebarWidth);
      applyLayout();
    },
    onEnd: saveLayout,
  });

  setupResizeHandle(elements.toolbarResize, {
    axis: "y",
    getValue: () => (state.layout.toolbarHeight <= 0 ? 28 : state.layout.toolbarHeight),
    setValue: (value) => {
      state.layout.toolbarHeight = normalizeToolbarHeight(value);
      applyLayout();
    },
    onEnd: saveLayout,
  });

  setupResizeHandle(elements.termPanelResize, {
    axis: "x",
    invert: true,
    getValue: () => state.layout.termWidth,
    setValue: (value) => {
      state.layout.termWidth = normalizePanelWidth(value, LAYOUT_LIMITS.termWidth, state.layout.termWidth);
      applyLayout();
    },
    onEnd: saveLayout,
  });

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
  elements.generateChapter.addEventListener("click", () => void generateNextChapter());
  elements.expandChapter.addEventListener("click", () => void expandCurrentChapter());
  elements.generatePrompt.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void generateNextChapter();
  });
  elements.autoTerms.addEventListener("click", () => void autoExtractTerms());
  elements.summarizeTerms.addEventListener("click", () => void summarizeTermLibrary());
  elements.addTerm.addEventListener("click", () => addManualTerm());
  elements.deleteTerm.addEventListener("click", () => deleteSelectedTerm());
  elements.chapterNumber.addEventListener("input", () => {
    elements.chapterNumber.value = sanitizeChapterNumber(elements.chapterNumber.value);
    if (elements.chapterNumber.value) commitChapterTitle({ enforceNumber: false });
  });
  elements.chapterTitle.addEventListener("input", () => commitChapterTitle({ enforceNumber: false }));
  elements.chapterNumber.addEventListener("blur", () => commitChapterTitle());
  elements.chapterTitle.addEventListener("blur", () => commitChapterTitle());
  elements.chapterTitleRow.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitChapterTitle();
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

  bindResizeHandles();

  elements.editor.addEventListener("input", () => {
    const text = getEditorText();
    recordEditorSnapshot(text);
    updateStats(text);
    syncEditorHeight();
    queueSave();
  });

  elements.editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") || "";
    document.execCommand("insertText", false, text);
  });

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
    if (!isDesktopLayout()) {
      elements.appShell.classList.remove("sidebar-open");
      return;
    }

    state.layout.sidebarWidth = state.layout.sidebarWidth <= 0 ? SIDEBAR_RESTORE_WIDTH : 0;
    applyLayout();
    saveLayout();
  });

  elements.showToolbar.addEventListener("click", () => {
    restoreToolbarHeight();
    saveLayout();
  });

  elements.showSidebar.addEventListener("click", () => {
    elements.appShell.classList.add("sidebar-open");
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

  elements.bgColor.addEventListener("input", () => {
    state.settings.bgColor = elements.bgColor.value;
    applySettings();
    saveSettings();
  });

  elements.textColor.addEventListener("input", () => {
    state.settings.textColor = elements.textColor.value;
    applySettings();
    saveSettings();
  });

  elements.bgSwatches.addEventListener("click", (event) => {
    const button = event.target.closest(".swatch");
    if (!button) return;
    state.settings.bgColor = button.dataset.bg;
    if (button.dataset.bg === "#20221f") state.settings.textColor = "#ece6d8";
    else if (normalizeColor(state.settings.textColor) === "#ece6d8") state.settings.textColor = "#24211d";
    applySettings();
    saveSettings();
  });

  window.addEventListener("resize", syncEditorHeight);
  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveActiveChapter();
    }

    const key = event.key.toLowerCase();
    const isModifier = event.ctrlKey || event.metaKey;
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
}

async function boot() {
  state.settings = sanitizeSettings(readJSON(SETTINGS_KEY, {}));
  const savedLayout = readJSON(LAYOUT_KEY, {});
  state.layout = sanitizeLayout(savedLayout);
  state.agentConfig = await loadAgentConfig();
  state.selectedAgentModel = chooseAgentModel(state.agentConfig);
  state.trash = readJSON(TRASH_KEY, []);
  const savedTermExpanded = readJSON(TERM_TREE_KEY, null);
  state.termExpanded = new Set(Array.isArray(savedTermExpanded) ? savedTermExpanded : []);
  state.hasSavedTermExpanded = Array.isArray(savedTermExpanded);
  state.terms = normalizeTermLibrary(readJSON(TERM_LIBRARY_KEY, []));
  state.selectedTermId = null;
  applySettings();
  applyLayout();
  renderAgentConfig();
  if (!Number.isFinite(Number(savedLayout.toolbarHeight))) {
    requestAnimationFrame(() => restoreToolbarHeight());
  }
  bindEvents();

  const localProject = readJSON(PROJECT_KEY, null);
  try {
    state.project = localProject || (await loadManifestProject());
  } catch {
    state.project = sampleProject;
  }

  state.expanded = new Set(["book", ...state.project.volumes.map((volume) => volume.id)]);
  renderTree();
  renderTrash();
  renderTermPanel();

  const first = getFlatChapters()[0];
  if (first) await selectChapter(first.id);
  else syncEditorHeight();
}

void boot();
