# B站视频合并工具 (bili-m4s-merge)

一款跨平台桌面应用，用于将 B站缓存的 `.m4s` 视频流和音频流无损合并为 MP4 格式。

## 功能特性

- 🎬 **文件选择**: 支持拖拽或通过系统对话框选择 `.m4s` 文件
- 🔍 **智能识别**: 自动检测并处理 B站缓存文件的非标准文件头
- ⚡ **无损合并**: 调用 FFmpeg 进行 Codec Copy，无需转码，速度极快
- 📁 **批量处理**: 支持选择整个 B站缓存文件夹，自动识别并配对
- 📊 **任务管理**: 显示合并进度、实时日志输出

## 技术栈

- **Runtime**: Electron
- **Build Tool**: Vite
- **Frontend**: Vue 3 + TypeScript
- **UI Framework**: Naive UI

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 FFmpeg

将 `ffmpeg.exe` 放置到 `resources/ffmpeg/` 目录下。

下载地址: https://www.gyan.dev/ffmpeg/builds/

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build:win
```

## 使用说明

### 单文件模式

1. 点击「选择文件」或拖拽 `video.m4s` 和 `audio.m4s` 文件
2. 设置输出目录和文件名
3. 点击「开始合并」

### 文件夹批量模式

1. 点击「选择文件夹」，选择包含 B站缓存的目录
2. 程序会自动扫描并识别所有可合并的文件对
3. 按需修改输出文件名
4. 点击「开始合并」

B站缓存目录结构示例：
```
download/
├─115478550814377/        # 视频ID，用作默认文件名
│  └─c_33618005690/
│      └─80/              # 画质
│          ├─video.m4s
│          └─audio.m4s
```

## 开发

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

## License

MIT
