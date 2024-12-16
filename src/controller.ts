import {ClassType, Pattern, RouteItem} from '../index'
import {getMapValue, registerDecorator, simplifyPattern} from './utils'
import {implementPluginCallback} from './plugin'

export const routeMap = new Map<Pattern, RouteItem>()

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a?: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        registerDecorator(target.prototype, () => {
            pattern = simplifyPattern(pattern ?? target.name)
            const routeItem = getMapValue(routeMap, pattern, () => ({children: new Map()}))
            const actionMap = prototype_actionMap.get(target.prototype)
            if (actionMap) {
                for (const [pattern, actionItem] of actionMap) {
                    routeItem.children.set(pattern, actionItem)
                }
            }

            implementPluginCallback('onControllerRegister')
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

const prototype_actionMap = new WeakMap<object, Map<Pattern, RouteItem>>()

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        registerDecorator(prototype, instance => {
            pattern = simplifyPattern(pattern ?? property.toString())
            const actionMap = getMapValue(prototype_actionMap, prototype, () => new Map())
            getMapValue(actionMap, pattern, () => ({
                children: new Map(),
                prototype,
                property,
                action: instance[property].bind(instance)
            }))
        })
    }
    return c ? fn()(a, b, c) : fn(a)
}