import {ClassType, Pattern} from '../index'
import {joinPattern, simplifyPattern} from './utils'
import {implementPluginCallback} from './plugin'

const prototype_pattern = new WeakMap<object, Pattern>()

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        prototype_pattern.set(target.prototype, simplifyPattern(pattern ?? target.name))
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<(...a: any[]) => any>) => {
        descriptor.value = function (...args: any[]) {
            const controllerPattern = prototype_pattern.get(prototype)
            if (controllerPattern) {
                const joinedPattern = joinPattern(controllerPattern, simplifyPattern(pattern ?? property.toString()))
                implementPluginCallback('onActionCall', joinedPattern, ...args)
            }
        }
    }
    return c ? fn()(a, b, c) : fn(a)
}