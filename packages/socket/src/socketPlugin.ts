import {PluginDefinition} from '@canlooks/nest'
import {SocketPluginOptions} from '..'
import {SocketServer} from './socketServer'

export const socketPlugin: PluginDefinition<SocketPluginOptions> = {
    options: {
        nameStrategy: 'origin'
    },
    onAppCreate() {
        return SocketServer.createServer(this.options!)
    }
}