import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ScanResult } from '../shared/types'

// 自定义 API
const api = {
  // 文件选择
  selectFiles: (): Promise<string[]> => ipcRenderer.invoke('select-files'),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),
  selectOutputDir: (): Promise<string | null> => ipcRenderer.invoke('select-output-dir'),
  getDesktopPath: (): Promise<string> => ipcRenderer.invoke('get-desktop-path'),

  // 文件扫描与验证
  scanFolder: (folderPath: string): Promise<ScanResult[]> =>
    ipcRenderer.invoke('scan-folder', folderPath),
  validateM4s: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('validate-m4s', filePath),
  generateOutputName: (): Promise<string> => ipcRenderer.invoke('generate-output-name'),

  // FFmpeg
  checkFFmpeg: (): Promise<boolean> => ipcRenderer.invoke('check-ffmpeg'),
  mergeM4s: (
    taskId: string,
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('merge-m4s', taskId, videoPath, audioPath, outputPath),

  // 事件监听
  onMergeProgress: (callback: (data: { taskId: string; progress: number }) => void) => {
    ipcRenderer.on('merge-progress', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('merge-progress')
  },
  onMergeLog: (callback: (data: { taskId: string; message: string }) => void) => {
    ipcRenderer.on('merge-log', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('merge-log')
  },

  // 其他
  openPath: (path: string): Promise<void> => ipcRenderer.invoke('open-path', path),
  
  // 获取拖放文件的路径（用于 contextIsolation 启用时）
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  // 窗口控制
  windowMinimize: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
  windowClose: (): Promise<void> => ipcRenderer.invoke('window-close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized')
}

// 暴露 API 到渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

