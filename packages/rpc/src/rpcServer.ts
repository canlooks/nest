import {ResponseError, ResponseSuccess, RpcServerPluginOptions} from '..'
import {Server} from 'socket.io'
import {HttpServer} from '@canlooks/nest-plugin-http'
import {invoke, Pattern} from '@canlooks/nest'
import {rpcEventName} from './rpcPlugin'

export class RpcServer {
    static server: Server
    static options: RpcServerPluginOptions

    static async createServer(options: RpcServerPluginOptions) {
        this.options = options
        const {port, ...opts} = options
        if (typeof port === 'number') {
            this.server = new Server(port, options)
            console.log(`[@canlooks/nest] RPC server is running on port ${port}`)
        } else {
            const httpServer = await new Promise<typeof HttpServer.server>(resolve => {
                if (HttpServer.server) {
                    resolve(HttpServer.server)
                } else {
                    HttpServer.onCreate = resolve
                }
            })
            this.server = new Server(httpServer, opts)
            console.log('[@canlooks/nest] RPC server is attaching to httpServer')
        }
        this.addListener()
    }

    private static addListener() {
        this.server.on('connection', socket => {
            socket.on(rpcEventName, async (responseEvent: string, pattern: Pattern, ...args) => {
                try {
                    const data = await invoke(pattern, ...args)
                    socket.emit(responseEvent, {
                        ok: true,
                        data
                    } as ResponseSuccess)
                } catch (error) {
                    socket.emit(responseEvent, {
                        ok: false,
                        error
                    } as ResponseError)
                }
            })
        })
    }
}