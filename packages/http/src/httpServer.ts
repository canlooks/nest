import http, {IncomingMessage, Server, ServerResponse} from 'http'
import {HttpPluginOptions} from '..'
import {Exception, findMatchedRoute, implementMatchedAction, MatchedRoute, Pattern, RouteItem, truncatePath} from '@canlooks/nest'
import {checkMethod, getRedirectConfig, getResponseConfig} from './method'
import {createInvokeArgs} from './parameter'
import {createArgsFromFormData} from './formData'

export class HttpServer {
    static server?: Server
    private static options: HttpPluginOptions
    /** 提供给需要HttpServer作为前置的插件，如socket */
    static onCreate?(server: Server): void

    static createServer(options: HttpPluginOptions) {
        return new Promise<void>(resolve => {
            this.options = options
            this.server = http
                .createServer(this.requestListener.bind(this))
                .listen(options, () => {
                    resolve()
                    console.log(`[@canlooks/nest] Server is running on port ${options.port}`)
                })
            this.onCreate?.(this.server)
        })
    }

    private static async requestListener(req: IncomingMessage, res: ServerResponse) {
        res.setHeader('Content-Type', 'application/json')
        req.on('error', e => {
            this.makeResponse(res, void 0, 500, e.toString())
        })

        if (typeof req.url === 'undefined' || !req.method) {
            this.makeResponse(res, void 0, 400, 'Bad Request')
            return
        }

        const url = truncatePath(req.url, this.options.base!)
        if (url === null) {
            this.makeResponse(res, void 0, 404, 'Not Found')
            return
        }

        let pattern: Pattern = url
        if (url === '') {
            // PatternObject模式，使用body作为pattern
            const buffer = await this.getBuffer(req)
            pattern = this.parseBody(buffer, req, res)
        }

        let matchedRoute: MatchedRoute
        try {
            matchedRoute = findMatchedRoute(pattern)
        } catch (e) {
            this.catchException(e, res)
            return
        }
        const {code, message} = checkMethod(matchedRoute.item, req.method!)
        if (code !== 200) {
            this.makeResponse(res, void 0, code, message)
            return
        }

        const parsingFormData = createArgsFromFormData(matchedRoute.item, req)
        let args: any[]
        if (parsingFormData) {
            try {
                args = await parsingFormData
            } catch (e: any) {
                this.makeResponse(res, void 0, e.httpCode || 400, e.toString())
                return
            }
        } else {
            try {
                args = await this.createArgsFromBody(matchedRoute.item, req, res, pattern)
            } catch (e) {
                // this.createArgsFromBody()方法已经处理了异常，这里不用处理
                return
            }
        }
        this.setResponseConfig(matchedRoute.item, res)
        await this.invokeAction(matchedRoute, res, args)
    }

    private static getBuffer(req: IncomingMessage) {
        return new Promise<Buffer>((resolve) => {
            let buffer = Buffer.from('')
            req.on('data', data => {
                buffer = Buffer.concat([buffer, data])
            })
            req.on('end', () => {
                resolve(buffer)
            })
        })
    }

    private static async createArgsFromBody(routeItem: Required<RouteItem>, req: IncomingMessage, res: ServerResponse, body?: any) {
        if (typeof body === 'string') {
            const buffer = await this.getBuffer(req)
            body = this.parseBody(buffer, req, res)
        }
        return createInvokeArgs(routeItem, req, res, body)
    }

    private static parseBody(buffer: Buffer, req: IncomingMessage, res: ServerResponse) {
        try {
            const contentType = req.headers['content-type']
            switch (contentType) {
                case 'application/json':
                    return JSON.parse(buffer.toString(this.options.encoding))
                case 'application/x-www-form-urlencoded':
                    return Object.fromEntries(new URLSearchParams(buffer.toString(this.options.encoding)).entries())
                default:
                    if (contentType?.includes('multipart/form-data')) {
                        this.makeResponse(res, void 0, 400, 'FormData is not supported in object pattern')
                        return
                    }
                    return buffer
            }
        } catch (e) {
            this.makeResponse(res, void 0, 400, 'Cannot Parse Body')
            throw e
        }
    }

    private static setResponseConfig(routeItem: Required<RouteItem>, res: ServerResponse) {
        const {statusCode, headers} = getResponseConfig(routeItem)
        if (typeof statusCode === 'number') {
            res.statusCode = statusCode
        }
        if (headers) {
            for (const name in headers) {
                res.setHeader(name, headers[name])
            }
        }
    }

    private static async invokeAction(matchedRoute: MatchedRoute, res: ServerResponse, args: any[]) {
        try {
            const ret = await implementMatchedAction(matchedRoute, ...args)
            const redirect = getRedirectConfig(matchedRoute.item)
            if (redirect) {
                // 使用action的返回值覆盖重定向location
                const Location = typeof ret === 'string' ? ret
                    : typeof ret === 'object' && ret !== null ? (ret.url ?? ret.location)
                        : redirect.location
                res.writeHead(redirect.statusCode, {Location})
                res.end()
            } else {
                this.makeResponse(res, ret)
            }
        } catch (e: any) {
            this.catchException(e, res)
        }
    }

    private static makeResponse(res: ServerResponse, success: any, statusCode?: number, error?: any) {
        if (typeof statusCode === 'number') {
            res.statusCode = statusCode
        }
        const ok = !error
        res.end(JSON.stringify({
            ok,
            ...ok ? {data: success} : {error},
        }))
    }

    private static catchException(e: any, res: ServerResponse) {
        let statusCode = 500
        let error
        if (e instanceof Exception) {
            if (typeof e.statusCode === 'number') {
                statusCode = e.statusCode
            }
            error = e.code ?? e.toString()
        } else {
            error = e.toString()
        }
        this.makeResponse(res, void 0, statusCode, error)
    }
}