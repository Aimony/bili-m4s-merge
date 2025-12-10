<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NIcon,
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NAlert,
  useMessage
} from 'naive-ui'
import { PlayOutline, FolderOutline } from '@vicons/ionicons5'
import { join } from 'path-browserify'
import FileDropZone from './FileDropZone.vue'
import TaskList from './TaskList.vue'
import LogPanel from './LogPanel.vue'
import type { MergeTask, ScanResult } from '../../../shared/types'

// 消息提示 - 此组件在 NMessageProvider 内使用
const message = useMessage()

// 状态
const tasks = ref<MergeTask[]>([])
const logs = ref<string[]>([])
const outputDir = ref('')
const isProcessing = ref(false)
const ffmpegAvailable = ref(true)

// 计算属性
const hasPendingTasks = computed(() =>
  tasks.value.some((t) => t.status === 'pending')
)

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 初始化
onMounted(async () => {
  // 设置默认输出目录为桌面
  outputDir.value = await window.api.getDesktopPath()

  // 检查 FFmpeg
  ffmpegAvailable.value = await window.api.checkFFmpeg()
  if (!ffmpegAvailable.value) {
    message.warning('未检测到 FFmpeg，请确保 resources/ffmpeg 目录下有 ffmpeg.exe')
  }

  // 监听进度更新
  const removeProgressListener = window.api.onMergeProgress((data) => {
    const task = tasks.value.find((t) => t.id === data.taskId)
    if (task) {
      task.progress = data.progress
    }
  })

  // 监听日志
  const removeLogListener = window.api.onMergeLog((data) => {
    if (data.message.trim()) {
      logs.value.push(data.message.trim())
      if (logs.value.length > 500) {
        logs.value = logs.value.slice(-500)
      }
    }
  })

  // 清理
  onUnmounted(() => {
    removeProgressListener()
    removeLogListener()
  })
})

// 处理文件选择
async function handleFilesSelected(files: string[]): Promise<void> {
  const m4sFiles = files.filter((f) => f.toLowerCase().endsWith('.m4s'))

  if (m4sFiles.length < 2) {
    message.warning('请至少选择两个 m4s 文件（video.m4s 和 audio.m4s）')
    return
  }

  const videoFile = m4sFiles.find((f) => f.toLowerCase().includes('video'))
  const audioFile = m4sFiles.find((f) => f.toLowerCase().includes('audio'))

  if (!videoFile || !audioFile) {
    message.warning('无法识别视频和音频文件，请确保文件名包含 video 或 audio')
    return
  }

  const isVideoValid = await window.api.validateM4s(videoFile)
  const isAudioValid = await window.api.validateM4s(audioFile)

  if (!isVideoValid || !isAudioValid) {
    message.error('文件验证失败，可能不是有效的 m4s 文件')
    return
  }

  const outputName = await window.api.generateOutputName()

  tasks.value.push({
    id: generateId(),
    videoPath: videoFile,
    audioPath: audioFile,
    outputPath: join(outputDir.value, `${outputName}.mp4`),
    outputName,
    status: 'pending',
    progress: 0
  })

  message.success('已添加任务')
}

// 处理文件夹选择
async function handleFolderSelected(folderPath: string): Promise<void> {
  message.info('正在扫描文件夹...')

  const results: ScanResult[] = await window.api.scanFolder(folderPath)

  if (results.length === 0) {
    message.warning('未找到可合并的 m4s 文件对')
    return
  }

  for (const result of results) {
    tasks.value.push({
      id: generateId(),
      videoPath: result.videoPath,
      audioPath: result.audioPath,
      outputPath: join(outputDir.value, `${result.folderId}.mp4`),
      outputName: result.folderId,
      status: 'pending',
      progress: 0
    })
  }

  message.success(`已添加 ${results.length} 个任务`)
}

// 更新任务名称
function handleUpdateName(taskId: string, name: string): void {
  const task = tasks.value.find((t) => t.id === taskId)
  if (task) {
    task.outputName = name
    task.outputPath = join(outputDir.value, `${name}.mp4`)
  }
}

// 移除任务
function handleRemoveTask(taskId: string): void {
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
}

// 打开输出目录
async function handleOpenOutput(path: string): Promise<void> {
  await window.api.openPath(path)
}

// 选择输出目录
async function handleSelectOutputDir(): Promise<void> {
  const dir = await window.api.selectOutputDir()
  if (dir) {
    outputDir.value = dir
    for (const task of tasks.value) {
      if (task.status === 'pending') {
        task.outputPath = join(dir, `${task.outputName}.mp4`)
      }
    }
  }
}

// 清空日志
function handleClearLogs(): void {
  logs.value = []
}

// 开始合并
async function handleStartMerge(): Promise<void> {
  const pendingTasks = tasks.value.filter((t) => t.status === 'pending')
  if (pendingTasks.length === 0) {
    message.warning('没有待处理的任务')
    return
  }

  isProcessing.value = true
  logs.value.push(`开始处理 ${pendingTasks.length} 个任务...`)

  for (const task of pendingTasks) {
    task.status = 'processing'
    logs.value.push(`处理中: ${task.outputName}`)

    const result = await window.api.mergeM4s(
      task.id,
      task.videoPath,
      task.audioPath,
      task.outputPath
    )

    if (result.success) {
      task.status = 'completed'
      task.progress = 100
      logs.value.push(`完成: ${task.outputName}`)
    } else {
      task.status = 'error'
      task.error = result.error
      logs.value.push(`失败: ${task.outputName} - ${result.error}`)
    }
  }

  isProcessing.value = false
  const completedCount = tasks.value.filter((t) => t.status === 'completed').length
  const errorCount = tasks.value.filter((t) => t.status === 'error').length
  message.success(`处理完成: ${completedCount} 成功, ${errorCount} 失败`)
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">B站视频合并工具</h1>
      <span class="app-subtitle">bili-m4s-merge</span>
    </header>

    <main class="app-content">
      <!-- FFmpeg 警告 -->
      <n-alert
        v-if="!ffmpegAvailable"
        title="FFmpeg 未就绪"
        type="warning"
        style="margin-bottom: 16px"
      >
        请将 ffmpeg.exe 放置到 resources/ffmpeg 目录下
      </n-alert>

      <!-- 文件选择区域 -->
      <n-card title="添加文件" size="small">
        <FileDropZone
          :disabled="isProcessing"
          @files-selected="handleFilesSelected"
          @folder-selected="handleFolderSelected"
        />
      </n-card>

      <!-- 输出设置 -->
      <div class="output-settings">
        <n-input-group>
          <n-input-group-label>输出目录</n-input-group-label>
          <n-input
            v-model:value="outputDir"
            :disabled="isProcessing"
            style="flex: 1"
            placeholder="选择输出目录"
          />
          <n-button :disabled="isProcessing" @click="handleSelectOutputDir">
            <template #icon>
              <n-icon><folder-outline /></n-icon>
            </template>
          </n-button>
        </n-input-group>

        <n-button
          type="primary"
          :disabled="!hasPendingTasks || isProcessing || !ffmpegAvailable"
          :loading="isProcessing"
          @click="handleStartMerge"
        >
          <template #icon>
            <n-icon><play-outline /></n-icon>
          </template>
          开始合并
        </n-button>
      </div>

      <!-- 任务列表 -->
      <n-card title="任务列表" size="small" style="margin-bottom: 16px">
        <TaskList
          :tasks="tasks"
          @update-name="handleUpdateName"
          @remove-task="handleRemoveTask"
          @open-output="handleOpenOutput"
        />
      </n-card>

      <!-- 日志面板 -->
      <LogPanel :logs="logs" @clear="handleClearLogs" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #18181c;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #00a1d6 0%, #fb7299 100%);
  flex-shrink: 0;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.app-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.app-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.output-settings {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.output-settings .n-input-group {
  flex: 1;
}
</style>

