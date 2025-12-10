import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'

/**
 * 获取 FFmpeg 可执行文件路径
 * 开发环境使用 resources 目录，生产环境使用 app.getPath
 */
function getFFmpegPath(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return join(process.cwd(), 'resources', 'ffmpeg', 'ffmpeg.exe')
  }
  return join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
}

/**
 * 检测 m4s 文件的有效偏移量
 * B站缓存文件前几个字节包含非标准数据，需要查找 'ftyp' 标记
 */
async function getValidOffset(filePath: string): Promise<number> {
  const buffer = Buffer.alloc(1024)
  const fileHandle = await fs.open(filePath, 'r')
  try {
    await fileHandle.read(buffer, 0, 1024, 0)
    // 查找 'ftyp' 标记 (0x66747970)
    const ftypIndex = buffer.indexOf('ftyp')
    if (ftypIndex > 4) {
      // ftyp 前 4 字节是 box size
      return ftypIndex - 4
    }
    return 0
  } finally {
    await fileHandle.close()
  }
}

/**
 * 创建去除非标准头的临时文件
 */
async function createCleanM4s(inputPath: string, outputPath: string): Promise<void> {
  const offset = await getValidOffset(inputPath)
  if (offset === 0) {
    // 无需处理，直接复制
    await fs.copyFile(inputPath, outputPath)
    return
  }

  const inputBuffer = await fs.readFile(inputPath)
  const cleanBuffer = inputBuffer.subarray(offset)
  await fs.writeFile(outputPath, cleanBuffer)
}

/**
 * 合并视频和音频流
 */
export async function mergeM4s(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  onProgress?: (progress: number) => void,
  onLog?: (message: string) => void
): Promise<void> {
  const ffmpegPath = getFFmpegPath()
  const tempDir = join(app.getPath('temp'), 'bili-m4s-merge')
  await fs.mkdir(tempDir, { recursive: true })

  const tempVideo = join(tempDir, `temp_video_${Date.now()}.m4s`)
  const tempAudio = join(tempDir, `temp_audio_${Date.now()}.m4s`)

  try {
    onLog?.('正在处理视频文件头...')
    await createCleanM4s(videoPath, tempVideo)

    onLog?.('正在处理音频文件头...')
    await createCleanM4s(audioPath, tempAudio)

    // 确保输出目录存在
    await fs.mkdir(dirname(outputPath), { recursive: true })

    onLog?.('开始合并...')

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-y',
        '-i', tempVideo,
        '-i', tempAudio,
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputPath
      ]

      const ffmpeg = spawn(ffmpegPath, args)
      let duration = 0
      let lastProgress = 0

      ffmpeg.stderr.on('data', (data: Buffer) => {
        const output = data.toString()
        onLog?.(output)

        // 解析总时长
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (durationMatch) {
          const hours = parseInt(durationMatch[1])
          const minutes = parseInt(durationMatch[2])
          const seconds = parseInt(durationMatch[3])
          duration = hours * 3600 + minutes * 60 + seconds
        }

        // 解析当前进度
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (timeMatch && duration > 0) {
          const hours = parseInt(timeMatch[1])
          const minutes = parseInt(timeMatch[2])
          const seconds = parseInt(timeMatch[3])
          const currentTime = hours * 3600 + minutes * 60 + seconds
          const progress = Math.min(100, Math.round((currentTime / duration) * 100))
          if (progress > lastProgress) {
            lastProgress = progress
            onProgress?.(progress)
          }
        }
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          onProgress?.(100)
          resolve()
        } else {
          reject(new Error(`FFmpeg 退出，错误码: ${code}`))
        }
      })

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg 启动失败: ${err.message}`))
      })
    })

    onLog?.('合并完成!')
  } finally {
    // 清理临时文件
    try {
      await fs.unlink(tempVideo)
      await fs.unlink(tempAudio)
    } catch {
      // 忽略清理错误
    }
  }
}

/**
 * 检查 FFmpeg 是否可用
 */
export async function checkFFmpeg(): Promise<boolean> {
  const ffmpegPath = getFFmpegPath()
  try {
    await fs.access(ffmpegPath)
    return true
  } catch {
    return false
  }
}
