import {PluginDefinition} from '@canlooks/nest'
import {HttpPluginOptions} from '..'
import {HttpServer} from './httpServer'

export const httpPlugin: PluginDefinition<HttpPluginOptions> = {
    options: {
        base: '/',
        encoding: 'utf-8',
        port: 3000
    },
    onAppCreate() {
        return HttpServer.createServer(this.options!)
    }
}