<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme, lightTheme } from 'naive-ui'
import MainContent from './components/MainContent.vue'

// 主题模式: 'light' | 'dark' | 'system'
const themeMode = ref<'light' | 'dark' | 'system'>('system')
const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// 计算当前实际主题
const isDark = computed(() => {
  if (themeMode.value === 'system') {
    return systemDark.value
  }
  return themeMode.value === 'dark'
})

// 当前使用的 Naive UI 主题
const currentTheme = computed(() => isDark.value ? darkTheme : lightTheme)

// 切换主题
function setTheme(mode: 'light' | 'dark' | 'system') {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)
}

// 监听系统主题变化
onMounted(() => {
  // 读取保存的主题设置
  const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | 'system' | null
  if (saved) {
    themeMode.value = saved
  }
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
})

// Provide 主题相关数据给子组件
provide('isDark', isDark)
provide('themeMode', themeMode)
provide('setTheme', setTheme)
</script>

<template>
  <n-config-provider :theme="currentTheme">
    <n-message-provider>
      <MainContent />
    </n-message-provider>
  </n-config-provider>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

body {
  display: block !important;
  align-items: initial !important;
  justify-content: initial !important;
  background-image: none !important;
  transition: background-color 0.3s ease;
}

#app {
  height: 100%;
  display: block !important;
  margin-bottom: 0 !important;
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.6);
}

/* 暗色模式下的滚动条 */
.dark-mode ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}
</style>

