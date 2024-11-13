import {ClassType, MiddlewareFunction, MiddlewareItem} from '..'
import {Exception} from './exception'
import {getAllPropertyDescriptors, getValueAssignDefault, isClass, registerComponent, registerDecorator} from './utils'

const instance_middlewareProviderSet = new Map<Function, Set<MiddlewareFunction>>()

export function Provide(): MethodDecorator
export function Provide(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<MiddlewareFunction>): void
export function Provide(a?: any, b?: any, c?: any): any {
    const fn = (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<MiddlewareFunction>) => {
        registerDecorator(prototype, instance => {
            getValueAssignDefault(instance_middlewareProviderSet, instance, () => new Set())
                .add(instance[property].bind(instance))
        })
    }
    return c ? fn(a, b, c) : fn
}

export function defineMiddleware<T extends MiddlewareFunction>(provider: T): T {
    return provider
}

/**
 * 类修饰器，被修饰的类所有方法都使用中间件
 * @param middlewares 
 */
export function Consume(...middlewares: MiddlewareItem[]) {
    return (target: ClassType) => {
        registerDecorator(target.prototype, instance => {
            const providerQueue = makeProviderQueue(middlewares)

            const descriptors = getAllPropertyDescriptors(instance)
            for (const p in descriptors) {
                const {value} = descriptors[p]
                if (typeof value === 'function') {
                    instance[p] = {
                        async [p](...args: any[]) {
                            try {
                                return value.apply(this, await filterArgs(providerQueue, args))
                            } catch (error) {
                                throw new Exception('[@canlooks/nest] An error occurred in middleware', {
                                    position: `${target.name}.${p}`,
                                    args,
                                    error
                                })
                            }
                        }
                    }[p]
                }
            }
        })
    }
}

/**
 * 方法修饰器，被修饰的方法使用中间件
 * @param middlewares 
 */
export function Use(...middlewares: MiddlewareItem[]) {
    return (prototype: Object, property: string, descriptor: TypedPropertyDescriptor<any>) => {
        const providerQueue = makeProviderQueue(middlewares)
        const {value} = descriptor
        descriptor.value = {
            async [property](...args: any[]) {
                try {
                    return value.apply(this, await filterArgs(providerQueue, args))
                } catch (error) {
                    throw new Exception('[@canlooks/nest] An error occurred in middleware', {
                        position: `${prototype.constructor.name}.${property}`,
                        args,
                        error
                    })
                }
            }
        }[property]
    }
}

/**
 * 生成一个中间件队列
 * @param middlewares 
 */
function makeProviderQueue(middlewares: MiddlewareItem[]) {
    const queue: MiddlewareFunction[] = []
    const middlewareSet = new Set(middlewares)
    const fn = (set: Set<MiddlewareItem>) => {
        for (const item of set) {
            if (isClass(item)) {
                const instance = registerComponent(item)
                if (!instance) {
                    throw new Error(`No provider in middleware class "${item.name}"`)
                }
            }
            const itemInstance = isClass(item) && registerComponent(item as ClassType)
            if (itemInstance) {
                // 能在容器中找到实例，说明item为ClassType
                const providerSet = instance_middlewareProviderSet.get(itemInstance)
                providerSet && fn(providerSet)
            } else {
                // 否则item为MiddlewareFunction
                queue.push(item as MiddlewareFunction)
            }
        }
    }
    fn(middlewareSet)
    return queue
}

/**
 * 应用队列过滤args
 * @param queue 
 * @param inputArgs 
 * @returns outputArgs
 */
async function filterArgs(queue: MiddlewareFunction[], inputArgs: any[]) {
    for (let i = 0, {length} = queue; i < length; i++) {
        const provider = queue[i]
        try {
            inputArgs = await new Promise(async (resolve, reject) => {
                try {
                    await provider((...nextArgs: any[]) => {
                        resolve(nextArgs.length ? nextArgs : inputArgs)
                    }, ...inputArgs)
                } catch (e) {
                    reject(e)
                }
            })
        } catch (error) {
            throw new Exception('[@canlooks/nest] An error occurred in middleware', {
                provider: provider.name,
                error
            })
        }
    }
    return inputArgs
}