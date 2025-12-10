import { ElectronAPI } from '@electron-toolkit/preload'
import type { ElectronApi } from '../renderer/src/types/electron'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronApi
  }
}
