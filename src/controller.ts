import {ClassType, Pattern, RouteItem} from '..'
import {getValueAssignDefault, registerComponent, registerDecorator, simplifyPattern} from './utils'

export const routeMap = new Map<Pattern, RouteItem>()

const prototype_routeItem = new WeakMap<Object, RouteItem>()

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a?: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        registerDecorator(target.prototype, (instance, isSubController: symbol) => {
            const routeItem: RouteItem = {children: new Map()}
            // 非@SubController()注册的控制器均添加至路由表顶层
            isSubController !== IS_SUB_CONTROLLER && routeMap.set(simplifyPattern(pattern ?? target.name), routeItem)
            prototype_routeItem.set(target.prototype, routeItem)
            // 当前控制器
            const property_actionItem = prototype_property_actionItem.get(target.prototype)
            if (property_actionItem) {
                for (const [property, {pattern, fn}] of property_actionItem) {
                    routeItem.children.set(pattern, {
                        prototype: target.prototype,
                        property,
                        action: fn.bind(instance),
                        children: new Map()
                    })
                }
            }
            // 子控制器 
            const property_subRouteMap = prototype_property_subRouteMap.get(target.prototype)
            if (property_subRouteMap) {
                for (const [property, subRouteMap] of property_subRouteMap) {
                    for (const [pattern, {children}] of subRouteMap) {
                        const targetRoute = getValueAssignDefault(routeItem.children, pattern, () => ({
                            prototype: target.prototype,
                            property,
                            children: new Map()
                        }))
                        // @SubController可能修饰多层，或者同时被@Action修饰，需要合并children
                        targetRoute.children = new Map([...targetRoute.children, ...children])
                    }
                }
            }
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

const prototype_property_actionItem = new WeakMap<Object, Map<PropertyKey, {
    pattern: Pattern
    fn: Function
}>>()

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        getValueAssignDefault(prototype_property_actionItem, prototype, () => new Map()).set(property, {
            pattern: simplifyPattern(pattern ?? property.toString()),
            fn: descriptor.value
        })
    }
    return c ? fn()(a, b, c) : fn(a)
}

const IS_SUB_CONTROLLER = Symbol('IS_SUB_CONTROLLER')

const prototype_property_subRouteMap = new WeakMap<Object, Map<PropertyKey, Map<Pattern, RouteItem>>>()

export function SubController(controller: ClassType): PropertyDecorator
export function SubController(controller: ClassType): MethodDecorator
export function SubController(pattern: Pattern, controller: ClassType): PropertyDecorator
export function SubController(pattern: Pattern, controller: ClassType): MethodDecorator
export function SubController(a: any, b?: any) {
    const fn = (controller: ClassType, pattern?: Pattern) => {
        return (prototype: Object, property: PropertyKey, descriptor?: TypedPropertyDescriptor<any>) => {
            registerDecorator(prototype, instance => {
                const subInstance = registerComponent(controller, IS_SUB_CONTROLLER)
                const subRouteItem = prototype_routeItem.get(controller.prototype)
                if (!subRouteItem) {
                    throw Error(`[@canlooks/nest] SubController "${controller.name}" must be decorated by @Controller`)
                }
                // pattern优先使用@SubController的指定，其次使用@Action的指定，最后使用属性名
                pattern ??= prototype_property_actionItem.get(prototype)?.get(property)?.pattern ?? simplifyPattern(property.toString())
                
                const property_subRouteMap = getValueAssignDefault(prototype_property_subRouteMap, prototype, () => new Map())
                getValueAssignDefault(property_subRouteMap, property, () => new Map()).set(pattern, subRouteItem)

                if (!descriptor) {
                    // descriptor为undefined，表示@SubController当作属性修饰器，需要实现Inject功能
                    instance[property] = subInstance
                }
            })
        }
    }
    return b ? fn(b, a) : fn(a)
}