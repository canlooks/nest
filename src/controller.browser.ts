import {ClassType, Pattern} from '../index'
import {getMapValue, joinPattern, registerComponent, registerDecorator, simplifyPattern} from './utils'
import {implementPluginCallback} from './plugin'

const prototype_pattern = new WeakMap<object, Pattern>()

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        pattern = simplifyPattern(pattern ?? target.name)
        prototype_pattern.set(target.prototype, pattern)

        registerDecorator(target.prototype, (instance, isSubController: symbol, parentPattern) => {
            const property_pattern = prototype_property_pattern.get(target.prototype)
            if (property_pattern) {
                for (const [property, subPattern] of property_pattern) {
                    const joinedPattern = joinPattern(
                        isSubController === IS_SUB_CONTROLLER ? parentPattern : pattern,
                        subPattern
                    )
                    property_pattern.set(property, joinedPattern)
                }
            }
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

const prototype_property_pattern = new WeakMap<object, Map<PropertyKey, Pattern>>()

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<(...a: any[]) => any>) => {
        pattern = simplifyPattern(pattern ?? property.toString())
        getMapValue(prototype_property_pattern, prototype, () => new Map()).set(property, pattern)

        descriptor.value = (...args) => {
            const finalPattern = prototype_property_pattern.get(prototype)?.get(property)!
            return implementPluginCallback('onActionCall', finalPattern, ...args)
        }
    }
    return c ? fn()(a, b, c) : fn(a)
}

const IS_SUB_CONTROLLER = Symbol('IS_SUB_CONTROLLER')

export function SubController(controller: ClassType): PropertyDecorator
export function SubController(controller: ClassType): MethodDecorator
export function SubController(pattern: Pattern, controller: ClassType): PropertyDecorator
export function SubController(pattern: Pattern, controller: ClassType): MethodDecorator
export function SubController(a: any, b?: any) {
    const fn = (controller: ClassType, pattern?: Pattern) => {
        return (prototype: Object, property: PropertyKey, descriptor?: TypedPropertyDescriptor<any>) => {
            descriptor && console.warn(`@SubController can only be used as property decorator in browser. "${prototype.constructor.name}.${property.toString()}" doesn't work`)

            pattern = simplifyPattern(pattern ?? property.toString())

            registerDecorator(prototype, instance => {
                const controllerPattern = prototype_pattern.get(prototype)
                if (!controllerPattern) {
                    throw Error(`"${prototype.constructor.name}" doesn't have @Controller decorator`)
                }
                const subInstance = registerComponent(controller, IS_SUB_CONTROLLER, joinPattern(controllerPattern, pattern!))
                if (!descriptor) {
                    instance[property] = subInstance
                }
            })
        }
    }
    return b ? fn(b, a) : fn(a)
}