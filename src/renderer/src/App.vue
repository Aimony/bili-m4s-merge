<script setup lang="ts">
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui'
import MainContent from './components/MainContent.vue'
</script>

<template>
  <n-config-provider :theme="darkTheme">
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
  /* 覆盖 main.css 的居中样式 */
  display: block !important;
  align-items: initial !important;
  justify-content: initial !important;
  background-image: none !important;
  background-color: #18181c !important;
}

#app {
  height: 100%;
  display: block !important;
  margin-bottom: 0 !important;
}
</style>
