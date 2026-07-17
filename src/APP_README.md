# 小说编辑器桌面 App

这是现有本地编辑器的 Electron 桌面壳。App 启动后会在内部启动本地 HTTP 服务，并把编辑器加载进桌面窗口。

## 首次使用

双击 `install-app-deps.cmd` 安装 Electron 依赖。

## 打开 App

双击 `open-app.cmd`。

## 打包单文件 App

双击 `build-app.cmd`，产物会生成到 `dist/`。

生成后可以直接运行：

`小说编辑器.exe`

## 打包目录版 App

需要目录版调试时运行：

`npm run build:dir`

目录版入口是：

`dist\win-unpacked\小说编辑器.exe`

## 模型配置

桌面 App 里点击顶部工具栏的齿轮按钮即可配置模型 API Key。配置会保存到 Electron 的用户数据目录中，不会写进 exe。
