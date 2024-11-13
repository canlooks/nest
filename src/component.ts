import {ClassType} from '..'
import {instance_pendingInitialising, getValueAssignDefault, registerComponent, registerDecorator} from './utils'

/**
 * 方法修饰器，被修饰的方法会在组件初始化时执行
 */
export function Initialize(): (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => void
export function Initialize(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Initialize(a?: any, b?: any, c?: any) {
    const fn = (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        registerDecorator(prototype, instance => {
            const pending = instance[property]()
            // 记录返回值，用于whenReady()
            getValueAssignDefault(instance_pendingInitialising, instance, () => []).push(pending)
        })
    }
    return c ? fn(a, b, c) : fn
}

/**
 * 属性修饰器，被修饰的属性会注入对应组件的实例
 */
export function Inject(component: ClassType) {
    return (prototype: Object, property: PropertyKey) => {
        registerDecorator(prototype, instance => {
            instance[property] = registerComponent(component)
        })
    }
}