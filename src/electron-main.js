const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, Menu, shell } = require("electron");

let mainWindow = null;
let serverInfo = null;
let editorServer = null;

const ELECTRON_APP_PORT = Number(process.env.NOVEL_EDITOR_PORT || 17645);

function ensureAppConfig() {
  const configPath = path.join(app.getPath("userData"), "agent-config.json");
  process.env.AGENT_CONFIG_FILE = configPath;

  if (fs.existsSync(configPath)) return;

  const sourcePath = path.join(__dirname, "agent-config.json");
  const fallbackPath = path.join(__dirname, "agent-config.example.json");
  const templatePath = fs.existsSync(sourcePath) ? sourcePath : fallbackPath;
  if (!fs.existsSync(templatePath)) return;

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.copyFileSync(templatePath, configPath);
}

function createMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        { role: "reload", label: "刷新" },
        { role: "forceReload", label: "强制刷新" },
        { type: "separator" },
        { role: "quit", label: "退出" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "togglefullscreen", label: "全屏" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
        { role: "resetZoom", label: "实际大小" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  ensureAppConfig();
  const { listen, server } = require("./server");
  editorServer = server;
  serverInfo = await listen(ELECTRON_APP_PORT);
  const appUrl = `http://${serverInfo.host}:${serverInfo.port}/`;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "小说编辑器",
    backgroundColor: "#0b0b0c",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(appUrl)) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  await mainWindow.loadURL(appUrl);
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    createMenu();
    await createWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });

  app.on("before-quit", () => {
    editorServer?.close();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
