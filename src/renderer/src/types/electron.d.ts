import type { ScanResult } from '../../shared/types'

// 渲染进程可用的 API 接口
export interface ElectronApi {
  // 文件选择
  selectFiles: () => Promise<string[]>
  selectFolder: () => Promise<string | null>
  selectOutputDir: () => Promise<string | null>
  getDesktopPath: () => Promise<string>

  // 文件扫描与验证
  scanFolder: (folderPath: string) => Promise<ScanResult[]>
  validateM4s: (filePath: string) => Promise<boolean>
  generateOutputName: () => Promise<string>

  // FFmpeg
  checkFFmpeg: () => Promise<boolean>
  mergeM4s: (
    taskId: string,
    videoPath: string,
    audioPath: string,
    outputPath: string
  ) => Promise<{ success: boolean; error?: string }>

  // 事件监听
  onMergeProgress: (callback: (data: { taskId: string; progress: number }) => void) => () => void
  onMergeLog: (callback: (data: { taskId: string; message: string }) => void) => () => void

  // 其他
  openPath: (path: string) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
