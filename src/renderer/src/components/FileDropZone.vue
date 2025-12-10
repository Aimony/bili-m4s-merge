<script setup lang="ts">
import { ref } from 'vue'
import { NIcon, NButton, NSpace, NSpin } from 'naive-ui'
import { CloudUploadOutline, FolderOpenOutline, DocumentOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'

// Props
interface Props {
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits
const emit = defineEmits<{
  (e: 'files-selected', files: string[]): void
  (e: 'folder-selected', path: string): void
}>()

// 状态
const isDragging = ref(false)
const isProcessing = ref(false)
const lastAction = ref<{ type: 'files' | 'folder'; count: number } | null>(null)

// 处理拖拽进入
function handleDragEnter(e: DragEvent): void {
  e.preventDefault()
  if (!props.disabled) {
    isDragging.value = true
  }
}

// 处理拖拽离开
function handleDragLeave(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = false
}

// 处理拖拽悬停
function handleDragOver(e: DragEvent): void {
  e.preventDefault()
}

// 处理拖放
async function handleDrop(e: DragEvent): Promise<void> {
  e.preventDefault()
  isDragging.value = false

  if (props.disabled || !e.dataTransfer) return

  isProcessing.value = true

  try {
    const items = e.dataTransfer.files
    if (items.length === 0) return

    // 获取文件路径 - Electron 中 File 对象有 path 属性
    const paths: string[] = []
    let hasFolder = false

    for (let i = 0; i < items.length; i++) {
      const file = items[i]
      // 使用 webUtils.getPathForFile 获取文件路径（contextIsolation 启用时需要此方式）
      const filePath = window.api.getPathForFile(file)
      if (filePath) {
        paths.push(filePath)
        // 检查是否是文件夹（通过检查 type 是否为空）
        if (file.type === '') {
          hasFolder = true
        }
      }
    }

    if (paths.length === 0) return

    // 如果只有一个项目且是文件夹，作为文件夹处理
    if (paths.length === 1 && hasFolder) {
      lastAction.value = { type: 'folder', count: 1 }
      emit('folder-selected', paths[0])
    } else {
      // 过滤出 m4s 文件
      const m4sFiles = paths.filter(p => p.toLowerCase().endsWith('.m4s'))
      if (m4sFiles.length > 0) {
        lastAction.value = { type: 'files', count: m4sFiles.length }
        emit('files-selected', m4sFiles)
      } else if (hasFolder) {
        // 如果没有 m4s 文件但有文件夹，选择第一个文件夹
        lastAction.value = { type: 'folder', count: 1 }
        emit('folder-selected', paths[0])
      }
    }
  } finally {
    isProcessing.value = false
    // 3秒后清除提示
    setTimeout(() => {
      lastAction.value = null
    }, 3000)
  }
}

// 选择文件对话框
async function handleSelectFiles(): Promise<void> {
  if (props.disabled) return
  isProcessing.value = true
  try {
    const files = await window.api.selectFiles()
    if (files.length > 0) {
      lastAction.value = { type: 'files', count: files.length }
      emit('files-selected', files)
    }
  } finally {
    isProcessing.value = false
    setTimeout(() => {
      lastAction.value = null
    }, 3000)
  }
}

// 选择文件夹对话框
async function handleSelectFolder(): Promise<void> {
  if (props.disabled) return
  isProcessing.value = true
  try {
    const folder = await window.api.selectFolder()
    if (folder) {
      lastAction.value = { type: 'folder', count: 1 }
      emit('folder-selected', folder)
    }
  } finally {
    isProcessing.value = false
    setTimeout(() => {
      lastAction.value = null
    }, 3000)
  }
}
</script>

<template>
  <div class="file-drop-zone">
    <div
      class="drop-area"
      :class="{ 
        'is-dragging': isDragging, 
        'is-disabled': props.disabled,
        'has-action': lastAction 
      }"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <div class="drop-content">
        <!-- 处理中状态 -->
        <template v-if="isProcessing">
          <n-spin size="large" />
          <span class="drop-title">处理中...</span>
        </template>
        
        <!-- 成功提示 -->
        <template v-else-if="lastAction">
          <n-icon :size="48" color="#18a058">
            <checkmark-circle-outline />
          </n-icon>
          <span class="drop-title success">
            {{ lastAction.type === 'folder' ? '文件夹已添加' : `已选择 ${lastAction.count} 个文件` }}
          </span>
        </template>
        
        <!-- 正常状态 -->
        <template v-else>
          <n-icon :size="48" :class="{ 'icon-active': isDragging }">
            <cloud-upload-outline />
          </n-icon>
          <span class="drop-title">
            {{ isDragging ? '松开以添加文件' : '拖拽文件或文件夹到这里' }}
          </span>
          <span class="drop-hint">
            支持 .m4s 文件，或包含 B站缓存的文件夹
          </span>
        </template>
      </div>
    </div>

    <n-space class="action-buttons" justify="center">
      <n-button
        :disabled="props.disabled || isProcessing"
        secondary
        @click="handleSelectFiles"
      >
        <template #icon>
          <n-icon><document-outline /></n-icon>
        </template>
        选择文件
      </n-button>
      <n-button
        :disabled="props.disabled || isProcessing"
        secondary
        @click="handleSelectFolder"
      >
        <template #icon>
          <n-icon><folder-open-outline /></n-icon>
        </template>
        选择文件夹
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
.file-drop-zone {
  width: 100%;
}

.drop-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  cursor: pointer;
}

.drop-area:hover:not(.is-disabled) {
  border-color: rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.04);
}

.drop-area.is-dragging {
  border-color: #00a1d6;
  background-color: rgba(0, 161, 214, 0.1);
  border-style: solid;
}

.drop-area.has-action {
  border-color: #18a058;
  background-color: rgba(24, 160, 88, 0.1);
}

.drop-area.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 120px;
}

.drop-title {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.drop-title.success {
  color: #18a058;
}

.drop-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.icon-active {
  color: #00a1d6;
  animation: bounce 0.5s ease infinite alternate;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-8px);
  }
}

.action-buttons {
  margin-top: 16px;
}
</style>
