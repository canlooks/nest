import {ListenOptions} from 'net'
import {Pattern, PluginDefinition} from '@canlooks/nest'
import formidable from 'formidable'
import {Server} from 'http'

declare namespace NestPluginHttp {
    interface HttpPluginOptions extends ListenOptions {
        base?: string
        encoding?: BufferEncoding
    }

    const httpPlugin: PluginDefinition<HttpPluginOptions>

    class HttpServer {
        static server?: Server
        static onCreate?(server: Server): void
    }

    /**
     * --------------------------------------------------------------------
     * 方法修饰器，同@Action()修饰器，用于定义路由方法
     */

    type MethodEnum =
        'get' | 'GET' |
        'delete' | 'DELETE' |
        'head' | 'HEAD' |
        'options' | 'OPTIONS' |
        'post' | 'POST' |
        'put' | 'PUT' |
        'patch' | 'PATCH' |
        'purge' | 'PURGE' |
        'link' | 'LINK' |
        'unlink' | 'UNLINK'

    function Method(method: MethodEnum, pattern?: Pattern): MethodDecorator
    function Method(methods: MethodEnum[], pattern?: Pattern): MethodDecorator

    /** @alias {@link Method} */
    const Get: MethodDecorator & ((pattern?: Pattern) => MethodDecorator)

    /** @alias {@link Method} */
    const Post: MethodDecorator & ((pattern?: Pattern) => MethodDecorator)

    /**
     * 用于设置路由方法的响应状态码
     * @param statusCode 
     */
    function StatusCode(statusCode: number): MethodDecorator

    /**
     * 用于设置路由方法的响应头
     * @param name 
     * @param value 
     */
    function Header(name: string, value: string): MethodDecorator

    /**
     * 用于批量设置路由方法的响应头
     * @param headers 
     */
    function Headers(headers: Record<string, string>): MethodDecorator

    /**
     * --------------------------------------------------------------------
     * 参数修饰器，被修饰的参数赋值为对应的请求参数
     */

    const Body: ParameterDecorator & (() => ParameterDecorator)

    const Req: ParameterDecorator & (() => ParameterDecorator)

    const Res: ParameterDecorator & (() => ParameterDecorator)

    const FormData: ParameterDecorator & ((options?: formidable.Options) => ParameterDecorator)
}

export = NestPluginHttp