import {PluginDefinition} from '@canlooks/nest'
import {RpcServerPluginOptions} from '../index'
import {RpcServer} from './rpcServer'

export const rpcEventName = '@canlooks/nest/rpc'

export const rpcServerPlugin: PluginDefinition<RpcServerPluginOptions> = {
    onAppCreate() {
        return RpcServer.createServer(this.options!)
    }
}