import {ClassType, Pattern, RouteItem} from '..'
import {getAllPropertyDescriptors, getMapValue, registerDecorator, simplifyPattern} from './utils'

export const routeMap = new Map<Pattern, RouteItem>()

export const CONTROLLER_PATTERN = Symbol('CONTROLLER_PATTERN')

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a?: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        pattern = target.prototype[CONTROLLER_PATTERN] = simplifyPattern(pattern ?? target.name)
        registerDecorator(target.prototype, instance => {
            const {children} = getMapValue(routeMap, pattern, () => ({children: new Map()}))
            const descriptors = getAllPropertyDescriptors(instance)
            for (const p in descriptors) {
                const {value} = descriptors[p]
                if (typeof value === 'function') {
                    const actionPattern = target.prototype[PROPERTY_PATTERN]?.get(p) || p
                    children!.set(actionPattern, {
                        prototype: target.prototype,
                        property: p,
                        action: instance[p].bind(instance)
                    })
                }
            }
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

export const PROPERTY_PATTERN = Symbol('PROPERTY_PATTERN_ALIAS')

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: any, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        pattern = simplifyPattern(pattern ?? property.toString())
        const propertyPattern = prototype[PROPERTY_PATTERN] ||= new Map()
        propertyPattern.set(property, pattern)
    }
    return c ? fn()(a, b, c) : fn(a)
}