import {ResponseError, ResponseSuccess, RpcClientPluginOptions} from '..'
import {ClassType, CONTROLLER_PATTERN, getAllPropertyDescriptors, getMapValue, joinPattern, Pattern, PROPERTY_PATTERN, registerDecorator} from '@canlooks/nest'
import {io, Socket} from 'socket.io-client'
import {rpcEventName} from './rpcPlugin'

type ISocketOptions = { uri?: string } & RpcClientPluginOptions

const prototype_options = new WeakMap<object, ISocketOptions>()
const prototype_socket = new WeakMap<object, Socket>()

export function RpcClient(options?: RpcClientPluginOptions): ClassDecorator
export function RpcClient(uri: string, options?: RpcClientPluginOptions): ClassDecorator
export function RpcClient(a?: any, b?: any) {
    return (target: Function) => {
        const options = typeof a === 'string' ? {uri: a, ...b} : a
        prototype_options.set(target.prototype, options)
    }
}

export function Rpc(component: ClassType, options?: RpcClientPluginOptions): PropertyDecorator
export function Rpc(component: ClassType, uri: string, options?: RpcClientPluginOptions): PropertyDecorator
export function Rpc(component: ClassType, a?: any, b?: any): PropertyDecorator {
    return (prototype: Object, property: PropertyKey) => {
        registerDecorator(prototype, instance => {
            const socket = a
                ? io(a, b)
                : getMapValue(prototype_socket, prototype, () => {
                    const {uri, ...opts} = prototype_options.get(prototype) || {}
                    return io(uri, opts)
                })
            instance[property] = destructureComponent(component, socket)
        })
    }
}

function destructureComponent(component: ClassType, socket?: Socket) {
    if (!socket) {
        throw Error('[@canlooks/nest] RpcClient is not initialized, please use "@RpcClient(uri, options)" to decorate the class, or specify the uri or options in "@Rpc(component, uri, options)"')
    }
    const instance = new component()
    const controllerPattern = instance[CONTROLLER_PATTERN]
    const descriptors = getAllPropertyDescriptors(instance)
    for (const p in descriptors) {
        const {value} = descriptors[p]
        if (typeof value === 'function') {
            const actionPattern = instance[PROPERTY_PATTERN]?.get(p) || p
            const joinedPattern = joinPattern(controllerPattern, actionPattern)
            instance[p] = (...args: any[]) => {
                return socketEmitter(socket, joinedPattern, ...args)
            }
        }
    }
    return instance
}

/**
 * @private socket事件发射器
 * @param socket
 * @param pattern
 * @param args
 */
function socketEmitter(socket: Socket, pattern: Pattern, ...args: any[]) {
    return new Promise<any>((resolve, reject) => {
        const responseEvent = randomEventName()
        socket.emit(rpcEventName, responseEvent, pattern, ...args)
        socket.once(responseEvent, (res: ResponseSuccess | ResponseError) => {
            res.ok
                ? resolve(res.data)
                : reject(res.error)
        })
    })
}

/**
 * @private 生成随机事件名
 */
function randomEventName() {
    return `${rpcEventName}${Date.now()}${Math.random().toString(36).slice(2)}`
}