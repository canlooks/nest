import {PluginDefinition} from '@canlooks/nest'
import {ElectronRendererPluginOptions} from '..'

const ipcChannel = '@canlooks/nest/electronIpc'

export const electronRendererPlugin: PluginDefinition<ElectronRendererPluginOptions> = {
    options: {
        ipcRenderer: null
    },
    onActionCall(pattern, ...args) {
        if (!this.options!.ipcRenderer) {
            throw Error('[@canlooks/nest] ipcRenderer is not registered, please call registerIpcRenderer() first.')
        }
        return this.options!.ipcRenderer.invoke(ipcChannel, pattern, ...args)
    }
}