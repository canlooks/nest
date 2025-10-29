import {ServerOptions} from 'socket.io'
import {PluginDefinition} from '@canlooks/nest'

declare namespace NestPluginSocket {
    interface SocketPluginOptions extends Partial<ServerOptions> {
        /** 
         * 若不指定该字段，则使用已有的Http服务器；
         * 否则使用指定的port新建socket服务器
         */
        port?: number
        /**
         * 命名的转换方式
         * 默认为`origin`
         * @enum {'origin'} 原始事件名
         * @enum {'camelCase'} 驼峰命名法
         * @enum {'kebabCase'} 分隔符命名法
         * @enum {'snakeCase'} 下划线命名法
         * @enum {'startCase'} 首字母大写空格命名法(标题命名法)
         */
        nameStrategy?: 'origin' | 'camelCase' | 'kebabCase' | 'snakeCase' | 'startCase'
    }

    const socketPlugin: PluginDefinition<SocketPluginOptions>

    /**
     * 类修饰器
     * @param name 命名空间名称
     */
    const Namespace: ClassDecorator & ((name?: string) => ClassDecorator)

    /**
     * 方法修饰器
     * @param eventName 事件名称默认为方法名
     */
    const Listener: MethodDecorator & ((eventName?: string) => MethodDecorator)

    /**
     * 属性修饰器，注入一个socket.emit方法
     */
    const Emitter: PropertyDecorator & (() => PropertyDecorator)
}

export = NestPluginSocket