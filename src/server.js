const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || process.argv[2] || 8000);
const ROOT = __dirname;
const CONFIG_FILE = process.env.AGENT_CONFIG_FILE
  ? path.resolve(process.env.AGENT_CONFIG_FILE)
  : path.join(ROOT, "agent-config.json");
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_SUMMARY_TERMS = 100;
const MAX_EXISTING_TERMS = 300;
const MAX_GENERATION_TERMS = 400;
const OUTLINE_FILES = ["大纲.txt", "大纲.md", "outline.txt", "outline.md"];
const TERM_TYPES = new Set(["人物", "地点", "功法", "道具", "势力", "设定", "其他"]);
const TERM_CONFIDENCES = new Set(["high", "medium", "low"]);
const DEFAULT_PROMPT = `
你是小说设定资料整理助手。请从给定章节正文中提取需要进入“名词库”的专有名词和设定名词。

提取范围：
1. 人物：有姓名、称号、固定身份称谓，且在剧情中具有指代意义。
2. 地点：具体地名、宗门驻地、城镇、洞府、秘境、遗迹、禁区等。
3. 功法：功法、术法、剑法、心法、秘术、神通、修炼体系中的固定名称。
4. 道具：法器、丹药、灵物、材料、信物、书册、地图等具体物件名称。
5. 势力：宗门、家族、帮派、王朝、商会、组织等。
6. 设定：境界、血脉、灵根、规则、历史事件、世界观概念、特殊制度等。

排除规则：
1. 不要提取普通名词、泛称、动作、情绪、天气、身体部位、家具、普通动物或普通物品。
2. 不要提取章节标题、序号、量词、时间词、颜色词、修饰词。
3. 不要把短句、描述性片段或带标点的文本当作名词。
4. 不要臆造正文中没有出现的信息；不确定时宁可不返回。
5. “少年、男人、父亲、师兄、长老、弟子”等泛称不单独提取，除非它在正文中作为跨章固定称号使用。

输出要求：
1. 只返回合法 JSON 数组，不要 Markdown，不要解释，不要额外文本。
2. 每一项必须包含 name、type、info 三个字段。
3. type 只能是：人物、地点、功法、道具、势力、设定、其他。
4. name 使用正文中连续出现的原始名称，通常为 2-12 个汉字；去掉书名号、引号、括号和多余空格。
5. info 用一句简短中文说明该名词在本章中的作用或身份；没有可靠信息时填空字符串。
6. 同一名词只返回一次，按其首次出现顺序排列。
`.trim();

const DEFAULT_SUMMARY_PROMPT = `
你是小说设定资料库整理助手。请根据章节正文、已有名词库和本次提取关键词，将词条整理成可层级收纳的设定目录。

目标：
1. 不要只做平铺列表，要为每个词条判断它应该放入的层级目录 path。
2. path 是从大类到具体条目的数组，例如：
   ["世界设定","修炼体系","境界","筑基"]
   ["世界设定","丹药","回春丹"]
   ["地点","云州","青石镇","破庙"]
   ["势力","玄天宗","外门"]
3. 对修仙小说，优先识别以下世界设定目录：修炼体系、境界、功法、术法、神通、丹药、法器、灵材、血脉、灵根、规则、历史事件。
4. 对地点，尽量根据正文里的包含关系建立层级：州 > 郡/府 > 城/镇 > 村/庙/洞府/遗迹/秘境。只有正文明确或强烈暗示包含关系时才建立父子层级；不确定则放在 ["地点", 名称]。
5. 对势力，尽量根据上下级关系建立层级：宗门/家族/王朝 > 分支/堂口/外门/内门/职位机构。
6. 对人物，通常放在 ["人物", 角色名]，如果正文明确属于某势力，可额外在 relations 中标注。
7. 不要臆造正文没有的信息。不确定的父级不要硬编。
8. 已有名词库中存在的词条，尽量沿用原 path；只有正文提供更明确关系时才调整。
9. 总结前必须先检查已有名词库的 name 和 aliases；如果本次关键词与已有词条高度重复，返回已有词条的 name，不要创建新词条。
10. 同一实体的不同称呼合并到 aliases。尤其是境界、修炼阶段的简称和全称要合并，例如：炼气、练气、炼气期、练气期应视为同一词条；筑基、筑基期也应视为同一词条。
11. 如果已有词条已经有 path、info、relations，本次只补充或修正更明确的信息，不要把已有层级打散。

只返回合法 JSON，不要 Markdown，不要解释。
返回格式：
{
  "terms": [
    {
      "name": "词条主名",
      "type": "人物|地点|功法|道具|势力|设定|其他",
      "path": ["一级目录","二级目录","词条主名"],
      "info": "一句到两句中文说明",
      "aliases": [],
      "relations": [{"type":"位于|隶属|包含|使用|修炼|相关","target":"另一个词条名"}],
      "confidence": "high|medium|low"
    }
  ]
}
`.trim();

const DEFAULT_GENERATE_PROMPT = `
你是长篇中文小说续写助手。请根据用户给出的故事梗概或章节计划，结合已有大纲、名词库和最近章节上下文，生成下一章正文。用户输入可能是一句话，也可能是一段较完整的剧情安排；如果用户没有提供输入，请自行根据大纲和最近章节推断下一章最合理的推进方向。

写作要求：
1. 必须尊重已有名词库，不要随意改名、改境界、改地点层级、改人物关系。
2. 必须参考大纲推进剧情；如果用户输入与大纲冲突，优先保持大纲主线，并把用户输入中不冲突的部分自然融入。
3. 用户输入越具体，越优先执行其中的事件顺序、人物目标和情绪落点；用户输入为空或很笼统时，根据大纲、名词库和最近章节自行补足本章事件。
4. 最近章节上下文用于承接语气、人物状态、情节位置、叙述视角和文风密度，不要机械复述。
5. 生成完整章节，不要只写梗概；要有场景、行动、对话、心理和章节推进。
6. 本章只推进一个主要事件，结构为：承接上章 -> 出现阻力 -> 人物行动/选择 -> 阶段结果或小钩子。
7. 目标篇幅为 3000-5000 个中文字符；如果最近章节明显更短或更长，贴近最近章节长度。
8. 不要提前剧透太远，不要一次解决过多主线矛盾。
9. 不新增大纲外的核心设定、重要强者、关键法宝或会改变主线走向的人物。
10. 不要输出 Markdown，不要解释创作思路。
11. 章节标题可简短，正文不要包含大纲分析、知识库说明或提示词痕迹。

只返回合法 JSON：
{
  "title": "章节标题，不含第几章",
  "content": "完整章节正文"
}
`.trim();

const DEFAULT_EXPAND_PROMPT = `
你是中文小说章节扩写助手。请根据当前章节原文，结合大纲库、名词库和最近章节上下文，对当前章节进行扩写。

扩写原则：
1. 不改变当前章节的剧情走势、事件顺序、人物决定和结局落点，只在原走势上增加细节密度。
2. 必须符合大纲，不新增与大纲冲突的支线、设定、人物关系或关键事件。
3. 必须尊重名词库，不改人物名、地名、境界、功法、物品、势力关系和世界设定。
4. 遣词造句、叙述节奏、对白习惯和文风要贴合当前章节原文。
5. 优先扩写场景感、动作过程、心理层次、对话承接、氛围和因果过渡。
6. 扩写后约为原文的 1.5-2 倍；原文超过 5000 字时只增加 20%-40%。
7. 新增内容只能补足场景、动作、心理、对话承接和因果过渡，不新增影响后续连续性的设定或剧情。
8. 不要总结，不要写大纲，不要解释扩写思路，不要输出 Markdown。
9. 返回扩写后的完整章节正文；可以保留原文内容并自然加厚，但不要把章节改写成另一个方向。

只返回合法 JSON：
{
  "content": "扩写后的完整章节正文"
}
`.trim();

const DEFAULT_BEAUTIFY_PROMPT = `
你是中文小说局部润色助手。请只美化用户选中的文本片段，文风偏白描。

润色原则：
1. 保留原文事实、人物、称呼、地点、物品、境界、视角、叙述时序和对白含义。
2. 可以基于原文已有事实做轻度扩写，把概括句改成更具体的画面、动作、物象和环境细节。例如“今天下雪了”可以改为“皑皑大雪铺满了大地”。
3. 扩写只服务于原句表达，不续写后续剧情，不补充新设定，不改变角色决定，不新增关键人物、法宝、境界、地点或因果。
4. 白描为主：用朴素、准确、克制的句子呈现场景和动作，少用华丽辞藻、空泛抒情、过密比喻和夸张形容。
5. 优先优化语句顺畅度、节奏、画面感、动作衔接、心理描写和标点分段；可以适当补足缺失的视觉、听觉、触感或动作承接。
6. 保持原文风格和上下文语气；如果原文是对白，保留对白性质、说话人意图和信息量，只润色表达。
7. 只返回美化后的选中文本，不要返回整章，不要 Markdown，不要额外说明。

只返回合法 JSON：
{
  "content": "美化后的选中文本"
}
`.trim();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendJSON(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

async function readJSONFile(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJSONFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readFirstExistingText(fileNames) {
  for (const fileName of fileNames) {
    try {
      const content = await fs.readFile(path.join(ROOT, fileName), "utf8");
      if (content.trim()) return content;
    } catch {
      // Try the next outline file candidate.
    }
  }
  return "";
}

function normalizeModel(provider, model) {
  if (typeof model === "string") {
    const id = model.trim();
    if (!id) return null;
    return { id: `${provider.id}:${id}`, providerId: provider.id, model: id, label: `${provider.label} / ${id}` };
  }

  const modelId = String(model?.id || "").trim();
  if (!modelId) return null;
  const label = String(model.label || model.name || modelId).trim();
  return {
    id: `${provider.id}:${modelId}`,
    providerId: provider.id,
    model: modelId,
    label: `${provider.label} / ${label}`,
    temperature: model.temperature,
  };
}

function normalizeProvider(provider) {
  const id = String(provider?.id || "").trim();
  const baseUrl = String(provider?.baseUrl || provider?.endpoint || "").trim();
  if (!id || !baseUrl) return null;

  const normalized = {
    id,
    label: String(provider.label || provider.name || id).trim(),
    baseUrl,
    apiKey: String(provider.apiKey || (provider.apiKeyEnv ? process.env[provider.apiKeyEnv] : "") || "").trim(),
    allowNoApiKey: Boolean(provider.allowNoApiKey),
    temperature: provider.temperature,
    models: [],
  };
  normalized.models = Array.isArray(provider.models)
    ? provider.models.map((model) => normalizeModel(normalized, model)).filter(Boolean)
    : [];
  return normalized;
}

function isProviderAvailable(provider) {
  return Boolean(provider.apiKey || provider.allowNoApiKey);
}

function matchesModelId(model, modelId) {
  return model.id === modelId || model.model === modelId || `${model.providerId}:${model.model}` === modelId;
}

function normalizeConfig(config) {
  const providers = Array.isArray(config.providers) ? config.providers.map(normalizeProvider).filter(Boolean) : [];
  const configuredModels = providers.flatMap((provider) => {
    return provider.models.map((model) => ({
      ...model,
      available: isProviderAvailable(provider),
    }));
  });
  const availableModels = configuredModels.filter((model) => model.available);
  const requestedDefault = String(config.defaultModel || "").trim();
  const defaultModel =
    availableModels.find((model) => requestedDefault && matchesModelId(model, requestedDefault)) ||
    availableModels[0] ||
    configuredModels.find((model) => requestedDefault && matchesModelId(model, requestedDefault)) ||
    configuredModels[0];
  return {
    enabled: Boolean(config.enabled && configuredModels.length),
    defaultModel: defaultModel?.id || "",
    providers,
    models: configuredModels,
    temperature: config.temperature,
    prompt: typeof config.prompt === "string" ? config.prompt : DEFAULT_PROMPT,
    summaryPrompt: typeof config.summaryPrompt === "string" ? config.summaryPrompt : DEFAULT_SUMMARY_PROMPT,
    generatePrompt: typeof config.generatePrompt === "string" ? config.generatePrompt : DEFAULT_GENERATE_PROMPT,
    expandPrompt: typeof config.expandPrompt === "string" ? config.expandPrompt : DEFAULT_EXPAND_PROMPT,
    beautifyPrompt: typeof config.beautifyPrompt === "string" ? config.beautifyPrompt : DEFAULT_BEAUTIFY_PROMPT,
  };
}

async function loadConfig() {
  return normalizeConfig(await readJSONFile(CONFIG_FILE, { enabled: false, providers: [] }));
}

async function loadRawConfig() {
  return await readJSONFile(CONFIG_FILE, { enabled: false, providers: [] });
}

function publicConfig(config) {
  return {
    enabled: config.enabled,
    defaultModel: config.defaultModel,
    models: config.models.map((model) => ({
      id: model.id,
      model: model.model,
      providerId: model.providerId,
      label: model.label,
      available: model.available,
    })),
  };
}

function editableModel(model = {}) {
  if (typeof model === "string") {
    const id = model.trim();
    return id ? { id, label: id } : null;
  }
  const id = String(model?.id || "").trim();
  if (!id) return null;
  return {
    id,
    label: String(model?.label || model?.name || id).trim(),
    temperature: model?.temperature,
  };
}

function editableProvider(provider = {}) {
  return {
    id: String(provider.id || "").trim(),
    label: String(provider.label || provider.name || provider.id || "").trim(),
    baseUrl: String(provider.baseUrl || provider.endpoint || "").trim(),
    apiKey: String(provider.apiKey || "").trim(),
    apiKeyEnv: String(provider.apiKeyEnv || "").trim(),
    allowNoApiKey: Boolean(provider.allowNoApiKey),
    temperature: provider.temperature,
    models: (Array.isArray(provider.models) ? provider.models : []).map(editableModel).filter(Boolean),
  };
}

function mergeEditableModels(previousModels = [], models = []) {
  const previousById = new Map(
    (Array.isArray(previousModels) ? previousModels : [])
      .map(editableModel)
      .filter(Boolean)
      .map((model) => [model.id, model]),
  );

  return (Array.isArray(models) ? models : [])
    .map((model) => {
      const editable = editableModel(model);
      if (!editable) return null;
      const previous = previousById.get(editable.id) || {};
      return {
        ...previous,
        id: editable.id,
        label: editable.label || previous.label || previous.name || editable.id,
        temperature: editable.temperature ?? previous.temperature,
      };
    })
    .filter(Boolean);
}

function editableConfig(raw = {}) {
  return {
    enabled: Boolean(raw.enabled),
    defaultModel: String(raw.defaultModel || "").trim(),
    temperature: raw.temperature,
    providers: (Array.isArray(raw.providers) ? raw.providers : []).map(editableProvider).filter((provider) => provider.id),
  };
}

function mergeEditableConfig(existing = {}, editable = {}) {
  const existingProviders = new Map((Array.isArray(existing.providers) ? existing.providers : []).map((provider) => [provider.id, provider]));
  const providers = (Array.isArray(editable.providers) ? editable.providers : [])
    .map((provider) => {
      const id = String(provider?.id || "").trim();
      if (!id) return null;
      const previous = existingProviders.get(id) || {};
      return {
        ...previous,
        id,
        label: String(provider.label || previous.label || previous.name || id).trim(),
        baseUrl: String(provider.baseUrl || previous.baseUrl || previous.endpoint || "").trim(),
        apiKey: String(provider.apiKey || "").trim(),
        apiKeyEnv: String(provider.apiKeyEnv || previous.apiKeyEnv || "").trim(),
        allowNoApiKey: Boolean(provider.allowNoApiKey),
        temperature: provider.temperature ?? previous.temperature,
        models: Array.isArray(provider.models)
          ? mergeEditableModels(previous.models, provider.models)
          : previous.models || [],
      };
    })
    .filter(Boolean);

  return {
    ...existing,
    enabled: Boolean(editable.enabled),
    defaultModel: String(editable.defaultModel || existing.defaultModel || "").trim(),
    temperature: editable.temperature ?? existing.temperature,
    providers,
  };
}

async function readEditableAgentConfig(_request, response) {
  sendJSON(response, 200, editableConfig(await loadRawConfig()));
}

async function saveEditableAgentConfig(request, response) {
  const existing = await loadRawConfig();
  const payload = await readRequestJSON(request);
  const next = mergeEditableConfig(existing, payload);
  const normalized = normalizeConfig(next);
  if (!normalized.models.length) {
    sendJSON(response, 400, { message: "至少需要保留一个模型配置" });
    return;
  }
  await writeJSONFile(CONFIG_FILE, next);
  sendJSON(response, 200, {
    config: publicConfig(normalized),
    editable: editableConfig(next),
  });
}

function findModel(config, modelId) {
  const model = config.models.find((item) => matchesModelId(item, modelId));
  if (!model) return null;
  const provider = config.providers.find((item) => item.id === model.providerId);
  if (!provider || !isProviderAvailable(provider)) return null;
  return { provider, model };
}

function chatCompletionsUrl(baseUrl) {
  const value = baseUrl.replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(value)) return value;
  if (/\/v\d+$/i.test(value)) return `${value}/chat/completions`;
  return `${value}/chat/completions`;
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("请求内容过大");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function parseJSONFromText(text) {
  const clean = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(clean);
  } catch {
    const arrayStart = clean.indexOf("[");
    const arrayEnd = clean.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd > arrayStart) return JSON.parse(clean.slice(arrayStart, arrayEnd + 1));

    const objectStart = clean.indexOf("{");
    const objectEnd = clean.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd > objectStart) return JSON.parse(clean.slice(objectStart, objectEnd + 1));

    throw new Error("Agent 返回内容不是有效 JSON");
  }
}

function getOpenAICompatibleContent(data) {
  const message = data?.choices?.[0]?.message;
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content.map((part) => part?.text || "").filter(Boolean).join("\n");
  }
  if (typeof data?.output_text === "string") return data.output_text;
  if (typeof data?.content === "string") return data.content;
  if (typeof data?.text === "string") return data.text;
  return "";
}

function compactText(text, maxLength = 240) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseUpstreamJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const isHTML = /^\s*<!doctype|\s*<html[\s>]/i.test(String(text || ""));
    const hint = isHTML ? "模型接口返回的是 HTML 网页，不是 JSON" : "模型接口返回内容不是 JSON";
    throw new Error(`${hint}。请检查 agent-config.json 里的 baseUrl、模型 id 和 API Key。`);
  }
}

function normalizeTermName(name) {
  return String(name || "")
    .replace(/[《》“”"'`【】[\]()（）]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeTermType(type) {
  const value = String(type || "").trim();
  return TERM_TYPES.has(value) ? value : "其他";
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

function normalizeTermPath(pathValue, term = {}) {
  const name = normalizeTermName(term.name);
  let segments = Array.isArray(pathValue) ? pathValue.map(normalizeTermName).filter(Boolean) : [];
  if (!segments.length) segments = [...inferTermPathRoot(term), name].filter(Boolean);

  if (name) {
    segments = segments.filter((segment, index) => segment !== name || index === segments.length - 1);
    if (segments[segments.length - 1] !== name) segments.push(name);
  }

  return segments.filter((segment, index) => segment && segment !== segments[index - 1]);
}

function normalizeRelations(relations) {
  const map = new Map();
  (Array.isArray(relations) ? relations : []).forEach((relation) => {
    const type = String(relation?.type || "相关").trim() || "相关";
    const target = normalizeTermName(relation?.target || relation?.name || relation);
    if (!target) return;
    const key = `${type}\u001f${target}`;
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

function normalizeAliases(aliases, name = "") {
  const excluded = new Set([normalizeTermName(name)]);
  return [
    ...new Set(
      (Array.isArray(aliases) ? aliases : [])
        .map(normalizeTermName)
        .filter((alias) => alias && !excluded.has(alias)),
    ),
  ];
}

function normalizeTerms(payload) {
  const source = Array.isArray(payload) ? payload : payload?.terms;
  if (!Array.isArray(source)) return [];
  return source
    .map((term) => {
      const name = normalizeTermName(term.name);
      const normalized = {
        name,
        type: normalizeTermType(term.type),
        info: String(term.info || "").trim(),
        aliases: normalizeAliases(term.aliases, name),
        relations: normalizeRelations(term.relations),
        confidence: normalizeConfidence(term.confidence),
      };
      normalized.path = normalizeTermPath(term.path, normalized);
      return normalized;
    })
    .filter((term) => term.name);
}

function normalizeRecentChapters(value) {
  return (Array.isArray(value) ? value : [])
    .map((chapter) => ({
      title: String(chapter?.title || "").trim(),
      content: String(chapter?.content || "").trim().slice(0, 2200),
    }))
    .filter((chapter) => chapter.title || chapter.content)
    .slice(-3);
}

function normalizeGeneratedChapter(payload, fallbackTitle = "") {
  const source = payload?.chapter || payload;
  if (typeof source === "string") {
    return { title: fallbackTitle, content: source.trim() };
  }

  const title = String(source?.title || source?.chapterTitle || fallbackTitle || "").trim();
  const content = String(source?.content || source?.text || source?.body || "").trim();
  return { title, content };
}

function normalizeBeautifiedSelection(payload) {
  const source = payload?.selection || payload;
  if (typeof source === "string") return source.trim();
  return String(source?.content || source?.text || source?.body || "").trim();
}

async function callChatModel(config, selected, messages) {
  const headers = { "Content-Type": "application/json" };
  if (selected.provider.apiKey) headers.Authorization = `Bearer ${selected.provider.apiKey}`;

  const upstream = await fetch(chatCompletionsUrl(selected.provider.baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: selected.model.model,
      temperature: Number(selected.model.temperature ?? selected.provider.temperature ?? config.temperature ?? 0.1),
      messages,
    }),
  });

  const upstreamText = await upstream.text();
  if (!upstream.ok) {
    const message = compactText(upstreamText);
    const error = new Error(message || `上游模型请求失败：${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }

  const data = parseUpstreamJSON(upstreamText);
  const directTerms = normalizeTerms(data);
  if (directTerms.length) return directTerms;

  const content = getOpenAICompatibleContent(data);
  return normalizeTerms(parseJSONFromText(content));
}

async function callChatTextModel(config, selected, messages) {
  const headers = { "Content-Type": "application/json" };
  if (selected.provider.apiKey) headers.Authorization = `Bearer ${selected.provider.apiKey}`;

  const upstream = await fetch(chatCompletionsUrl(selected.provider.baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: selected.model.model,
      temperature: Number(selected.model.temperature ?? selected.provider.temperature ?? config.temperature ?? 0.65),
      messages,
    }),
  });

  const upstreamText = await upstream.text();
  if (!upstream.ok) {
    const message = compactText(upstreamText);
    const error = new Error(message || `上游模型请求失败：${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }

  const data = parseUpstreamJSON(upstreamText);
  const content = getOpenAICompatibleContent(data);
  return content || JSON.stringify(data);
}

async function extractTerms(request, response) {
  const config = await loadConfig();
  const body = await readBody(request);
  const selected = findModel(config, String(body.model || ""));
  if (!config.enabled || !selected) {
    sendJSON(response, 400, { message: "Agent 未启用或模型不可用" });
    return;
  }

  const text = String(body.text || "").trim();
  if (!text) {
    sendJSON(response, 400, { message: "章节内容为空" });
    return;
  }

  try {
    const terms = await callChatModel(config, selected, [
      { role: "system", content: String(config.prompt || DEFAULT_PROMPT).trim() },
      { role: "user", content: `章节正文：\n${text}` },
    ]);
    sendJSON(response, 200, { terms });
  } catch (error) {
    sendJSON(response, error.status || 500, { message: error.message || "Agent 识别失败" });
  }
}

async function summarizeTerms(request, response) {
  const config = await loadConfig();
  const body = await readBody(request);
  const selected = findModel(config, String(body.model || ""));
  if (!config.enabled || !selected) {
    sendJSON(response, 400, { message: "Agent 未启用或模型不可用" });
    return;
  }

  const text = String(body.text || "").trim();
  if (!text) {
    sendJSON(response, 400, { message: "章节内容为空" });
    return;
  }

  const terms = normalizeTerms(body.terms).slice(0, MAX_SUMMARY_TERMS);
  const existingTerms = normalizeTerms(body.existingTerms).slice(0, MAX_EXISTING_TERMS);
  if (!terms.length) {
    sendJSON(response, 400, { message: "没有可总结的关键词" });
    return;
  }

  try {
    const summaries = await callChatModel(config, selected, [
      { role: "system", content: String(config.summaryPrompt || DEFAULT_SUMMARY_PROMPT).trim() },
      {
        role: "user",
        content: `章节正文：\n${text}\n\n已有名词库(JSON)：\n${JSON.stringify(existingTerms, null, 2)}\n\n本次待整理关键词(JSON)：\n${JSON.stringify(terms, null, 2)}`,
      },
    ]);
    sendJSON(response, 200, { terms: summaries });
  } catch (error) {
    sendJSON(response, error.status || 500, { message: error.message || "智能总结失败" });
  }
}

async function generateChapter(request, response) {
  const config = await loadConfig();
  const body = await readBody(request);
  const selected = findModel(config, String(body.model || ""));
  if (!config.enabled || !selected) {
    sendJSON(response, 400, { message: "Agent 未启用或模型不可用" });
    return;
  }

  const prompt = String(body.prompt || body.storyBrief || "").trim();
  const nextChapterTitle = String(body.nextChapterTitle || "下一章").trim();
  const outline = (String(body.outline || "").trim() || (await readFirstExistingText(OUTLINE_FILES))).slice(0, 30000);
  const terms = normalizeTerms(body.terms).slice(0, MAX_GENERATION_TERMS);
  const recentChapters = normalizeRecentChapters(body.recentChapters);
  const promptForModel = prompt || "（用户未提供故事梗概或章节计划，请根据大纲、名词库和最近章节上下文自行推断下一章内容。）";

  try {
    const raw = await callChatTextModel(config, selected, [
      { role: "system", content: String(config.generatePrompt || DEFAULT_GENERATE_PROMPT).trim() },
      {
        role: "user",
        content: [
          `下一章预期标题：${nextChapterTitle}`,
          `用户提供的故事梗概或章节计划：\n${promptForModel}`,
          `大纲库：\n${outline || "（暂无大纲）"}`,
          `名词库(JSON)：\n${JSON.stringify(terms, null, 2)}`,
          `最近章节上下文(JSON)：\n${JSON.stringify(recentChapters, null, 2)}`,
        ].join("\n\n"),
      },
    ]);

    let generated;
    try {
      generated = normalizeGeneratedChapter(parseJSONFromText(raw), nextChapterTitle);
    } catch {
      generated = normalizeGeneratedChapter(raw, nextChapterTitle);
    }

    if (!generated.content) {
      sendJSON(response, 502, { message: "模型没有返回章节正文" });
      return;
    }

    sendJSON(response, 200, generated);
  } catch (error) {
    sendJSON(response, error.status || 500, { message: error.message || "章节生成失败" });
  }
}

async function beautifySelection(request, response) {
  const config = await loadConfig();
  const body = await readBody(request);
  const selected = findModel(config, String(body.model || ""));
  if (!config.enabled || !selected) {
    sendJSON(response, 400, { message: "Agent 未启用或模型不可用" });
    return;
  }

  const text = String(body.text || "").trim();
  if (!text) {
    sendJSON(response, 400, { message: "选中文本为空" });
    return;
  }

  const chapterTitle = String(body.chapterTitle || "当前章节").trim();
  const currentContent = String(body.currentContent || "").trim().slice(0, 10000);

  try {
    const raw = await callChatTextModel(config, selected, [
      { role: "system", content: String(config.beautifyPrompt || DEFAULT_BEAUTIFY_PROMPT).trim() },
      {
        role: "user",
        content: [
          `当前章节标题：${chapterTitle}`,
          `选中文本：\n${text}`,
          `当前章节上下文：\n${currentContent || "（暂无上下文）"}`,
        ].join("\n\n"),
      },
    ]);

    let content;
    try {
      content = normalizeBeautifiedSelection(parseJSONFromText(raw));
    } catch {
      content = normalizeBeautifiedSelection(raw);
    }

    if (!content) {
      sendJSON(response, 502, { message: "模型没有返回美化文本" });
      return;
    }

    sendJSON(response, 200, { content });
  } catch (error) {
    sendJSON(response, error.status || 500, { message: error.message || "自动美化失败" });
  }
}

async function expandChapter(request, response) {
  const config = await loadConfig();
  const body = await readBody(request);
  const selected = findModel(config, String(body.model || ""));
  if (!config.enabled || !selected) {
    sendJSON(response, 400, { message: "Agent 未启用或模型不可用" });
    return;
  }

  const chapterTitle = String(body.chapterTitle || "当前章节").trim();
  const currentContent = String(body.currentContent || "").trim();
  if (!currentContent) {
    sendJSON(response, 400, { message: "当前章节内容为空" });
    return;
  }

  const outline = (String(body.outline || "").trim() || (await readFirstExistingText(OUTLINE_FILES))).slice(0, 30000);
  const terms = normalizeTerms(body.terms).slice(0, MAX_GENERATION_TERMS);
  const recentChapters = normalizeRecentChapters(body.recentChapters);

  try {
    const raw = await callChatTextModel(config, selected, [
      { role: "system", content: String(config.expandPrompt || DEFAULT_EXPAND_PROMPT).trim() },
      {
        role: "user",
        content: [
          `当前章节标题：${chapterTitle}`,
          `当前章节原文：\n${currentContent}`,
          `大纲库：\n${outline || "（暂无大纲）"}`,
          `名词库(JSON)：\n${JSON.stringify(terms, null, 2)}`,
          `最近章节上下文(JSON)：\n${JSON.stringify(recentChapters, null, 2)}`,
        ].join("\n\n"),
      },
    ]);

    let expanded;
    try {
      expanded = normalizeGeneratedChapter(parseJSONFromText(raw), chapterTitle);
    } catch {
      expanded = normalizeGeneratedChapter(raw, chapterTitle);
    }

    if (!expanded.content) {
      sendJSON(response, 502, { message: "模型没有返回扩写正文" });
      return;
    }

    sendJSON(response, 200, { content: expanded.content });
  } catch (error) {
    sendJSON(response, error.status || 500, { message: error.message || "章节扩写失败" });
  }
}

async function serveStatic(request, response, pathname) {
  const decodedPathname = decodeURIComponent(pathname);
  if (
    /^\/(?:agent-config|server\.js)(?:\.json|\.js)?$/i.test(decodedPathname) ||
    /\/\.env/i.test(decodedPathname) ||
    decodedPathname.startsWith("/.git/")
  ) {
    sendText(response, 404, "Not found");
    return;
  }

  const relativePath = decodedPathname === "/" ? "index.html" : decodedPathname.slice(1);
  const filePath = path.resolve(ROOT, relativePath);
  const relativeToRoot = path.relative(ROOT, filePath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    sendText(response, 404, "Not found");
  }
}

async function handleRequest(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
    if (request.method === "GET" && url.pathname === "/api/agent-config") {
      sendJSON(response, 200, publicConfig(await loadConfig()));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/agent-config/edit") {
      await readEditableAgentConfig(request, response);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/agent-config") {
      await saveEditableAgentConfig(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/extract-terms") {
      await extractTerms(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/summarize-terms") {
      await summarizeTerms(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/generate-chapter") {
      await generateChapter(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/beautify-selection") {
      await beautifySelection(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/expand-chapter") {
      await expandChapter(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJSON(response, 405, { message: "Method not allowed" });
      return;
    }

    await serveStatic(request, response, url.pathname);
  } catch (error) {
    sendJSON(response, 500, { message: error.message || "Server error" });
  }
}

const server = http.createServer(handleRequest);

function listen(port, startPort = port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      if (error.code === "EADDRINUSE" && !process.env.PORT && port < startPort + 20) {
        listen(port + 1, startPort).then(resolve, reject);
        return;
      }
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      console.log(`Novel editor server: http://${HOST}:${resolvedPort}/`);
      resolve({ host: HOST, port: resolvedPort, server });
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

if (require.main === module) {
  listen(PORT).catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  HOST,
  PORT,
  server,
  listen,
};
