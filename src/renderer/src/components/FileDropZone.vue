<script setup lang="ts">
import { ref, computed } from 'vue'
import { NUpload, NUploadDragger, NIcon, NButton, NText, NSpace } from 'naive-ui'
import { CloudUploadOutline, FolderOpenOutline, DocumentOutline } from '@vicons/ionicons5'
import type { UploadFileInfo } from 'naive-ui'

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
const fileList = ref<UploadFileInfo[]>([])

// 是否有文件
const hasFiles = computed(() => fileList.value.length > 0)

// 处理文件上传
function handleUploadChange(data: { fileList: UploadFileInfo[] }): void {
  fileList.value = data.fileList
  const paths = data.fileList.map((f) => f.file?.path).filter(Boolean) as string[]
  if (paths.length > 0) {
    emit('files-selected', paths)
  }
}

// 选择文件对话框
async function handleSelectFiles(): Promise<void> {
  const files = await window.api.selectFiles()
  if (files.length > 0) {
    emit('files-selected', files)
  }
}

// 选择文件夹对话框
async function handleSelectFolder(): Promise<void> {
  const folder = await window.api.selectFolder()
  if (folder) {
    emit('folder-selected', folder)
  }
}

// 拖拽事件
function handleDragEnter(): void {
  isDragging.value = true
}

function handleDragLeave(): void {
  isDragging.value = false
}

function handleDrop(): void {
  isDragging.value = false
}
</script>

<template>
  <div class="file-drop-zone">
    <n-upload
      :disabled="props.disabled"
      :file-list="fileList"
      :show-file-list="false"
      accept=".m4s"
      multiple
      directory-dnd
      @change="handleUploadChange"
    >
      <n-upload-dragger
        :class="{ 'is-dragging': isDragging }"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="drop-content">
          <n-icon :size="48" :depth="3">
            <cloud-upload-outline />
          </n-icon>
          <n-text class="drop-title"> 拖拽文件或文件夹到这里 </n-text>
          <n-text depth="3" class="drop-hint">
            支持 .m4s 文件，或包含 B站缓存的文件夹
          </n-text>
        </div>
      </n-upload-dragger>
    </n-upload>

    <n-space class="action-buttons" justify="center">
      <n-button
        :disabled="props.disabled"
        secondary
        @click="handleSelectFiles"
      >
        <template #icon>
          <n-icon><document-outline /></n-icon>
        </template>
        选择文件
      </n-button>
      <n-button
        :disabled="props.disabled"
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

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.drop-title {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
}

.drop-hint {
  margin-top: 8px;
  font-size: 13px;
}

.is-dragging {
  border-color: var(--n-border-color-hover);
  background-color: var(--n-color-hover);
}

.action-buttons {
  margin-top: 16px;
}
</style>
