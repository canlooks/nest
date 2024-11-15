import {ClassType, PluginDefinition} from '..'
import {getMapValue, registerComponent, registerDecorator} from './utils'

const instance_pluginDefinition = new WeakMap<object, PluginDefinition>()

export function Plugin(target: ClassType): void
export function Plugin(): ClassDecorator
export function Plugin(a?: any) {
    const fn = (target: ClassType) => {
        registerDecorator(target, instance => {
            const optionsProperty = instance_optionsProperty.get(instance)
            instance_pluginDefinition.set(instance, {
                ...typeof optionsProperty !== 'undefined' && {options: instance[optionsProperty]},
                ...instance_definition.get(instance)
            })
        })
    }
    return a ? fn(a) : fn
}

export function definePlugin<O>(plugin: PluginDefinition<O>): PluginDefinition<O> {
    return plugin
}

/**
 * ------------------------------------------------------------------
 * 属性与回调函数修饰器
 */

const instance_optionsProperty = new WeakMap<object, PropertyKey>()

export function Options(prototype: Object, property: PropertyKey): void
export function Options(): PropertyDecorator
export function Options(a?: any, b?: any): any {
    const fn = (prototype: Object, property: PropertyKey) => {
        registerDecorator(prototype, instance => {
            instance_optionsProperty.set(instance, property)
        })
    }
    return a ? fn(a, b) : fn
}

const instance_definition = new WeakMap<object, PluginDefinition>()

function commonDefinitionDecorator(type: keyof PluginDefinition) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        registerDecorator(prototype, instance => {
            getMapValue(instance_definition, instance, () => ({} as PluginDefinition))[type] = instance[property]
        })
    }
}

export function SetOptions(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function SetOptions(): MethodDecorator
export function SetOptions(a?: any, b?: any, c?: any): any {
    const decorator = commonDefinitionDecorator('setOptions')
    return c ? decorator(a, b, c) : decorator
}

export function OnAppCreate(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function OnAppCreate(): MethodDecorator
export function OnAppCreate(a?: any, b?: any, c?: any): any {
    const decorator = commonDefinitionDecorator('onAppCreate')
    return c ? decorator(a, b, c) : decorator
}

export function OnControllerRegister(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function OnControllerRegister(): MethodDecorator
export function OnControllerRegister(a?: any, b?: any, c?: any): any {
    const decorator = commonDefinitionDecorator('onControllerRegister')
    return c ? decorator(a, b, c) : decorator
}

export function OnActionCall(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function OnActionCall(): MethodDecorator
export function OnActionCall(a?: any, b?: any, c?: any): any {
    const decorator = commonDefinitionDecorator('onActionCall')
    return c ? decorator(a, b, c) : decorator
}

/**
 * ------------------------------------------------------------------
 * 使用插件
 */

const usingPluginSet = new Set<PluginDefinition>()

export function usePlugin<O>(plugin: PluginDefinition<O> | ClassType, options?: O) {
    const pluginInstance = registerPlugin(plugin)
    usingPluginSet.add(pluginInstance)
    options && pluginInstance.setOptions?.(options)
}

/**
 * 统一class与对象形式的插件
 * @param plugin 
 */
function registerPlugin(plugin: PluginDefinition | ClassType): PluginDefinition {
    if (typeof plugin === 'function') {
        const instance = registerComponent(plugin)
        const ret = instance_pluginDefinition.get(instance)
        if (!ret) {
            throw TypeError(`[@canlooks/nest] Plugin class "${plugin.name}" must be decorated with @Plugin`)
        }
        return ret
    }
    return plugin
}

/**
 * ------------------------------------------------------------------
 * 执行回调
 */

export function implementPluginCallback<T extends keyof PluginDefinition>(type: T, ...args: Parameters<PluginDefinition[T]>) {
    const ret = []
    for (const plugin of usingPluginSet) {
        ret.push(plugin[type]?.(...args))
    }
    return ret
}