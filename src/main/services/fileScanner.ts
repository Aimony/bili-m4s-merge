import { promises as fs } from 'fs'
import { join, basename, dirname } from 'path'
import type { ScanResult } from '../../shared/types'

/**
 * 递归扫描文件夹，查找 B站缓存结构
 * 目录结构: download/{视频ID}/c_{cid}/{quality}/video.m4s + audio.m4s
 */
export async function scanBiliCacheFolder(folderPath: string): Promise<ScanResult[]> {
  const results: ScanResult[] = []

  async function findM4sPairs(currentPath: string, rootVideoId?: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    // 检查当前目录是否包含 video.m4s 和 audio.m4s
    const files = entries.filter((e) => e.isFile()).map((e) => e.name.toLowerCase())
    const hasVideo = files.includes('video.m4s')
    const hasAudio = files.includes('audio.m4s')

    if (hasVideo && hasAudio) {
      // 尝试从路径中提取视频ID
      let folderId = rootVideoId || basename(dirname(dirname(currentPath)))

      // 如果是纯数字，使用它作为文件名
      if (!/^\d+$/.test(folderId)) {
        folderId = basename(currentPath)
      }

      results.push({
        folderId,
        folderPath: currentPath,
        videoPath: join(currentPath, 'video.m4s'),
        audioPath: join(currentPath, 'audio.m4s')
      })
      return
    }

    // 递归搜索子目录
    const dirs = entries.filter((e) => e.isDirectory())
    for (const dir of dirs) {
      const subPath = join(currentPath, dir.name)
      // 如果是第一层数字目录，记录为视频ID
      const videoId = /^\d+$/.test(dir.name) ? dir.name : rootVideoId
      await findM4sPairs(subPath, videoId)
    }
  }

  await findM4sPairs(folderPath)
  return results
}

/**
 * 验证 m4s 文件是否有效
 */
export async function validateM4sFile(filePath: string): Promise<boolean> {
  try {
    const buffer = Buffer.alloc(1024)
    const fileHandle = await fs.open(filePath, 'r')
    try {
      await fileHandle.read(buffer, 0, 1024, 0)
      // 检查是否包含 'ftyp' 标记
      return buffer.includes('ftyp')
    } finally {
      await fileHandle.close()
    }
  } catch {
    return false
  }
}

/**
 * 生成默认输出文件名
 */
export function generateOutputName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}
