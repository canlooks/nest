import {IpcRenderer} from 'electron'
import {Pattern, PluginDefinition} from '@canlooks/nest'

declare namespace NestPluginElectronRenderer {
    type ElectronRendererPluginOptions = {
        ipcRenderer: IpcRenderer | null
    }

    const electronRendererPlugin: PluginDefinition<ElectronRendererPluginOptions>

    function setIpcChannel(channel: string): void

    /**
     * 注册渲染进程的ipcRenderer实例，必须在{@link invoke}之前执行
     * @param ipcRenderer
     */
    function registerIpcRenderer(ipcRenderer: IpcRenderer): void

    /**
     * 提供给electron renderer的ipc调用方法
     * @param pattern
     * @param args
     */
    function invoke(pattern: Pattern, ...args: any[]): Promise<any>
}

export = NestPluginElectronRenderer