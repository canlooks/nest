import {ServerOptions} from 'socket.io'
import {ManagerOptions} from 'socket.io-client/build/esm/manager'
import {SocketOptions} from 'socket.io-client/build/esm/socket'
import {ClassType, PluginDefinition} from '@canlooks/nest'

declare namespace NestPluginRpc {
    interface RpcServerPluginOptions extends Partial<ServerOptions> {
        /**
         * 若不指定该字段，则使用已有的Http服务器；
         * 否则使用指定的port新建socket服务器
         */
        port?: number
    }

    const rpcServerPlugin: PluginDefinition<RpcServerPluginOptions>

    type RpcClientPluginOptions = Partial<ManagerOptions & SocketOptions>

    type ResponseSuccess<T = any> = {
        ok: true
        data?: T
    }

    type ResponseError = {
        ok: false
        error: any
    }

    /**
     * 类修饰器，定义一个RPC客户端
     */
    function RpcClient(options?: RpcClientPluginOptions): ClassDecorator
    function RpcClient(uri: string, options?: RpcClientPluginOptions): ClassDecorator

    /**
     * 属性修饰器，注入一个RPC Emitter
     * @example
     * ```ts
     * @RpcClient('/example')
     * class ExampleComponent {
     *     @Rpc(ExternalService)
     *     service: ExternalService
     *
     *     method() {
     *          this.service.externalMethod()
     *     }
     * }
     * ```
     */
    function Rpc(component: ClassType, options?: RpcClientPluginOptions): PropertyDecorator
    function Rpc(component: ClassType, uri: string, options?: RpcClientPluginOptions): PropertyDecorator
}

export = NestPluginRpc