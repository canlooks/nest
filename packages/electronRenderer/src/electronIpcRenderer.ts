import {IpcRenderer} from 'electron'
import {Pattern} from '@canlooks/nest'
import {electronRendererPlugin} from './electronRendererPlugin'

export function registerIpcRenderer(ipcRenderer: IpcRenderer) {
    electronRendererPlugin.options!.ipcRenderer = ipcRenderer
}

export function invoke(pattern: Pattern, ...args: any[]) {
    return electronRendererPlugin.onActionCall!(pattern, ...args)
}