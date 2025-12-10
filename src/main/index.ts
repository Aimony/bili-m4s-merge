import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { mergeM4s, checkFFmpeg } from './services/ffmpeg'
import { scanBiliCacheFolder, validateM4sFile, generateOutputName } from './services/fileScanner'
import type { ScanResult } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 注册 IPC 处理器
function setupIpcHandlers(): void {
  // 选择文件对话框
  ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'M4S 文件', extensions: ['m4s'] }]
    })
    return result.filePaths
  })

  // 选择文件夹对话框
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths[0] || null
  })

  // 选择输出目录
  ipcMain.handle('select-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    return result.filePaths[0] || null
  })

  // 获取桌面路径
  ipcMain.handle('get-desktop-path', () => {
    return app.getPath('desktop')
  })

  // 扫描文件夹
  ipcMain.handle('scan-folder', async (_event, folderPath: string): Promise<ScanResult[]> => {
    return await scanBiliCacheFolder(folderPath)
  })

  // 验证 m4s 文件
  ipcMain.handle('validate-m4s', async (_event, filePath: string): Promise<boolean> => {
    return await validateM4sFile(filePath)
  })

  // 生成输出文件名
  ipcMain.handle('generate-output-name', () => {
    return generateOutputName()
  })

  // 检查 FFmpeg
  ipcMain.handle('check-ffmpeg', async () => {
    return await checkFFmpeg()
  })

  // 执行合并任务
  ipcMain.handle(
    'merge-m4s',
    async (
      event,
      taskId: string,
      videoPath: string,
      audioPath: string,
      outputPath: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await mergeM4s(
          videoPath,
          audioPath,
          outputPath,
          (progress) => {
            event.sender.send('merge-progress', { taskId, progress })
          },
          (message) => {
            event.sender.send('merge-log', { taskId, message })
          }
        )
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // 打开文件所在目录
  ipcMain.handle('open-path', async (_event, path: string) => {
    shell.showItemInFolder(path)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bili-m4s-merge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

