<script setup lang="ts">
import { h, computed } from 'vue'
import {
  NDataTable,
  NProgress,
  NTag,
  NButton,
  NIcon,
  NInput,
  NSpace,
  NEmpty
} from 'naive-ui'
import { FolderOpenOutline, TrashOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import type { MergeTask } from '../../../shared/types'

// Props
interface Props {
  tasks: MergeTask[]
}
const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update-name', taskId: string, name: string): void
  (e: 'remove-task', taskId: string): void
  (e: 'open-output', path: string): void
}>()

// 状态标签颜色
function getStatusType(
  status: MergeTask['status']
): 'default' | 'info' | 'success' | 'error' {
  switch (status) {
    case 'pending':
      return 'default'
    case 'processing':
      return 'info'
    case 'completed':
      return 'success'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

// 状态标签文字
function getStatusText(status: MergeTask['status']): string {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'error':
      return '失败'
    default:
      return status
  }
}

// 表格列定义
const columns = computed<DataTableColumns<MergeTask>>(() => [
  {
    title: '输出文件名',
    key: 'outputName',
    width: 200,
    render(row) {
      return h(NInput, {
        value: row.outputName,
        disabled: row.status !== 'pending',
        placeholder: '文件名',
        onUpdateValue: (val: string) => emit('update-name', row.id, val)
      })
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: getStatusType(row.status), size: 'small' },
        { default: () => getStatusText(row.status) }
      )
    }
  },
  {
    title: '进度',
    key: 'progress',
    width: 150,
    render(row) {
      if (row.status === 'pending') {
        return h('span', { style: { color: '#999' } }, '等待中')
      }
      return h(NProgress, {
        type: 'line',
        percentage: row.progress,
        status: row.status === 'error' ? 'error' : undefined,
        showIndicator: true
      })
    }
  },
  {
    title: '视频文件',
    key: 'videoPath',
    ellipsis: { tooltip: true },
    render(row) {
      const fileName = row.videoPath.split(/[/\\]/).pop()
      return h('span', { title: row.videoPath }, fileName)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(NSpace, {}, () => [
        row.status === 'completed' &&
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              onClick: () => emit('open-output', row.outputPath)
            },
            {
              icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) })
            }
          ),
        row.status === 'pending' &&
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              onClick: () => emit('remove-task', row.id)
            },
            {
              icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
            }
          )
      ])
    }
  }
])

// 是否有任务
const hasTasks = computed(() => props.tasks.length > 0)
</script>

<template>
  <div class="task-list">
    <n-data-table
      v-if="hasTasks"
      :columns="columns"
      :data="props.tasks"
      :row-key="(row: MergeTask) => row.id"
      size="small"
      :bordered="false"
      :single-line="false"
      max-height="300"
    />
    <n-empty v-else description="暂无任务，请先添加文件" />
  </div>
</template>

<style scoped>
.task-list {
  width: 100%;
}
</style>
