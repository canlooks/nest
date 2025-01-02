import {ClassType, Pattern} from '..'
import {getAllPropertyDescriptors, getMapValue, joinPattern, registerDecorator, simplifyPattern} from './utils'
import {implementPluginCallback} from './plugin'

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a?: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        registerDecorator(target.prototype, instance => {
            const controllerPattern = simplifyPattern(pattern ?? target.name)

            const descriptors = getAllPropertyDescriptors(instance)
            for (const p in descriptors) {
                const {value} = descriptors[p]
                if (typeof value === 'function') {
                    const actionPattern = prototype_property_patternAlias.get(target.prototype)?.get(p) || p
                    const joinedPattern = joinPattern(controllerPattern, actionPattern)
                    instance[p] = (...args: any[]) => {
                        return implementPluginCallback('onActionCall', joinedPattern, ...args)[0]
                    }
                }
            }
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

const prototype_property_patternAlias = new WeakMap<object, Map<PropertyKey, Pattern>>()

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        pattern = simplifyPattern(pattern ?? property.toString())
        getMapValue(prototype_property_patternAlias, prototype, () => new Map()).set(property, pattern)
    }
    return c ? fn()(a, b, c) : fn(a)
}