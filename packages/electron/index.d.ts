import {PluginDefinition} from '@canlooks/nest'
import {IpcMainInvokeEvent} from 'electron'

declare namespace NestPluginElectron {
    type ElectronPluginOptions = {}

    const electronPlugin: PluginDefinition<ElectronPluginOptions>

    /**
     * 参数修饰器，被修饰的参数赋值为Electron.IpcMainInvokeEvent {@link IpcMainInvokeEvent}
     * @param prototype
     * @param property
     * @param index
     */
    const IpcEvent: ParameterDecorator & (() => ParameterDecorator)
}

export = NestPluginElectron