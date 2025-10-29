import {PluginDefinition} from '@canlooks/nest'
import {ElectronPluginOptions} from '..'
import {ElectronIpcMain} from './electronIpcMain'

const ipcChannel = '@canlooks/nest/electronIpc'

export const electronPlugin: PluginDefinition<ElectronPluginOptions> = {
    onAppCreate() {
        ElectronIpcMain.listen(ipcChannel)
    }
}