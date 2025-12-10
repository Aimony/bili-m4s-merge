// 合并任务接口
export interface MergeTask {
  id: string
  videoPath: string
  audioPath: string
  outputPath: string
  outputName: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

// 文件夹扫描结果
export interface ScanResult {
  folderId: string // 视频ID，用作默认文件名
  folderPath: string
  videoPath: string
  audioPath: string
}

// IPC 通信消息类型
export interface MergeProgress {
  taskId: string
  progress: number
  status: 'processing' | 'completed' | 'error'
  error?: string
}

// FFmpeg 合并选项
export interface MergeOptions {
  videoPath: string
  audioPath: string
  outputPath: string
  onProgress?: (progress: number) => void
}

// 日志条目
export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
}
