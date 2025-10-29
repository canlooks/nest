import {ClassType, registerDecorator} from '@canlooks/nest'
import {Namespace as IONamespace} from 'socket.io'
import {SocketServer} from './socketServer'
import {nameStrategy} from './utils'

const prototype_namespace = new WeakMap<object, IONamespace>()

export function Namespace(target: ClassType): void
export function Namespace(name?: string): ClassDecorator
export function Namespace(a?: any) {
    const fn = (name?: string) => (target: ClassType) => {
        name ||= nameStrategy(target.name, SocketServer.options.nameStrategy)
        prototype_namespace.set(target.prototype, SocketServer.server.of('/' + name))
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

export function Listener(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Listener(eventName?: string): MethodDecorator
export function Listener(a?: any, b?: any, c?: any): any {
    const fn = (eventName?: string) => (prototype: Object, property: string, descriptor: TypedPropertyDescriptor<any>) => {
        registerDecorator(prototype, instance => {
            const server = prototype_namespace.get(prototype) || SocketServer.server.sockets
            eventName ||= nameStrategy(property, SocketServer.options.nameStrategy)
            server.on(eventName, instance[property].bind(instance))
        })
    }
    return c ? fn()(a, b, c) : fn(a)
}

export function Emitter(prototype: Object, property: PropertyKey): void
export function Emitter(): PropertyDecorator
export function Emitter(a?: any, b?: any): any {
    const fn = () => (prototype: Object, property: PropertyKey) => {
        registerDecorator(prototype, instance => {
            const server = prototype_namespace.get(prototype) || SocketServer.server.sockets
            instance[property] = server.emit.bind(server)
        })
    }
    return a ? fn()(a, b) : fn()
}

export class Socket {
    static Namespace = Namespace
    static Listener = Listener
    static Emitter = Emitter
}