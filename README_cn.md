<p align="center">
  <img src="resources/icon.png" alt="bili-m4s-merge" width="120" />
</p>

<h1 align="center">B站视频合并工具</h1>
<h3 align="center">bili-m4s-merge</h3>

<p align="center">
  <strong>🎬 跨平台 Bilibili 缓存视频合并工具</strong>
</p>

<p align="center">
  <a href="#-功能特性">功能</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-使用说明">使用说明</a> •
  <a href="#-开发">开发</a> •
  <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/Vue-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Naive%20UI-18A058?logo=vue.js&logoColor=white" alt="Naive UI" />
</p>

<p align="center">
  <img src="resources/intro.png" alt="introduction" />
</p>


---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🎬 **文件选择** | 支持拖拽或通过系统对话框选择 `.m4s` 文件 |
| 🔍 **智能识别** | 自动检测并处理 B站缓存文件的非标准文件头 |
| ⚡ **无损合并** | 调用 FFmpeg 进行 Codec Copy，无需转码，速度极快 |
| 📁 **批量处理** | 支持选择整个 B站缓存文件夹，自动识别并配对 |
| 📊 **任务管理** | 显示合并进度、实时日志输出 |
| 🌙 **主题切换** | 支持明暗主题切换，跟随系统设置 |

## 🚀 快速开始

### 方式一：直接下载

前往 [Releases](https://github.com/Aimony/bili-m4s-merge/releases) 页面下载最新版本。

> [!NOTE]
> 发布版本已内置 FFmpeg，开箱即用。

### 方式二：从源码构建

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置 FFmpeg

将 `ffmpeg.exe` 放置到 `resources/ffmpeg/` 目录下。

📥 下载地址: [ffmpeg.org](https://www.gyan.dev/ffmpeg/builds/)

#### 3. 启动开发服务器

```bash
npm run dev
```

#### 4. 构建生产版本

```bash
npm run build:win
```

## 📖 使用说明

### 单文件模式

1. 点击「选择文件」或拖拽 `video.m4s` 和 `audio.m4s` 文件
2. 设置输出目录和文件名
3. 点击「开始合并」

### 文件夹批量模式

1. 点击「选择文件夹」，选择包含 B站缓存的目录
2. 程序会自动扫描并识别所有可合并的文件对
3. 按需修改输出文件名
4. 点击「开始合并」

<details>
<summary>📂 B站缓存目录结构示例</summary>

```
download/
├─115478550814377/        # 视频ID
│  └─c_33618005690/
│      └─80/              # 画质
│          ├─video.m4s
│          └─audio.m4s
```

</details>

## 🛠️ 开发

```bash
# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 代码格式化
npm run format

# 构建 Windows
npm run build:win
```

## 📄 License

MIT
