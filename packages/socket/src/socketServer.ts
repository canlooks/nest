import {SocketPluginOptions} from '..'
import {Server} from 'socket.io'
import {HttpServer} from '@canlooks/nest-plugin-http'

export class SocketServer {
    static server: Server
    static options: SocketPluginOptions

    static async createServer(options: SocketPluginOptions) {
        this.options = options
        const {port, ...opts} = options
        if (typeof port === 'number') {
            this.server = new Server(port, options)
            console.log(`[@canlooks/nest] Socket server is running on port ${port}`)
        } else {
            const httpServer = await new Promise<typeof HttpServer.server>(resolve => {
                if (HttpServer.server) {
                    resolve(HttpServer.server)
                } else {
                    HttpServer.onCreate = resolve
                }
            })
            this.server = new Server(httpServer, opts)
            console.log('[@canlooks/nest] Socket server is attaching to httpServer')
        }
    }
}