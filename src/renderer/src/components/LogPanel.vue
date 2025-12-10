<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NCard, NScrollbar, NEmpty, NButton, NIcon } from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'

// Props
interface Props {
  logs: string[]
}
const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'clear'): void
}>()

// 滚动条引用
const scrollbarRef = ref<InstanceType<typeof NScrollbar> | null>(null)

// 自动滚动到底部
watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    scrollbarRef.value?.scrollTo({ top: 999999 })
  }
)

// 清空日志
function handleClear(): void {
  emit('clear')
}
</script>

<template>
  <n-card title="日志输出" size="small" class="log-panel">
    <template #header-extra>
      <n-button
        v-if="props.logs.length > 0"
        size="tiny"
        quaternary
        @click="handleClear"
      >
        <template #icon>
          <n-icon><trash-outline /></n-icon>
        </template>
        清空
      </n-button>
    </template>

    <n-scrollbar ref="scrollbarRef" style="max-height: 200px">
      <div v-if="props.logs.length > 0" class="log-content">
        <div v-for="(log, index) in props.logs" :key="index" class="log-line">
          {{ log }}
        </div>
      </div>
      <n-empty v-else description="暂无日志" size="small" />
    </n-scrollbar>
  </n-card>
</template>

<style scoped>
.log-panel {
  width: 100%;
}

.log-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line {
  padding: 2px 0;
  color: var(--n-text-color);
}

.log-line:hover {
  background-color: var(--n-color-hover);
}
</style>
