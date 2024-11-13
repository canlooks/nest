import {ClassType, Dict, ModularizedComponents, Pattern, PatternObject} from '..'
import {Container} from './container'

/**
 * 创建类的单例，接管new方法
 * @param Component 
 * @param args 传递给MethodDecoratorCallback {@link MethodDecoratorCallback}
 */
export function registerComponent<T>(Component: ClassType<T>, ...args: any[]): T {
    let instance = Container.get(Component)
    if (!instance) {
        // 所有组件均只实例化一次
        instance = new Component()
        // 向容器注册组件
        Container.register(Component, instance)
        // 执行修饰器
        implementDecorator(Component.prototype, instance, ...args)
    }
    return instance
}

/**
 * 结构单一组件或数组、对象形式的组件集合
 * @param components 
 */
export async function destructureComponentModule(components: ClassType | ModularizedComponents) {
    if (typeof components === 'function') {
        // 单个组件
        const instance = registerComponent(components)
        await whenReady(instance)
        return instance
    }

    // 多个组件
    const classes: ClassType[] = []
    const fn = (components: ModularizedComponents) => {
        if (Array.isArray(components)) {
            return components.map(c => {
                classes.push(c)
                return registerComponent(c)
            })
        }
        const ret: Dict = {}
        for (const k in components) {
            const c = components[k]
            if (Array.isArray(c)) {
                ret[k] = fn(c)
            } else {
                classes.push(c)
                ret[k] = registerComponent(c)
            }
        }
        return ret
    }
    const instances = fn(components)
    await Promise.all(classes.map(whenReady))
    return instances
}

type MethodDecoratorCallback = (instance: any, ...args: any[]) => any

const prototype_registeredMethods = new WeakMap<object, MethodDecoratorCallback[]>()

/**
 * 注册方法修饰器
 * @param prototype 
 * @param callback
 */
export function registerDecorator(prototype: object, callback: MethodDecoratorCallback): void {
    getValueAssignDefault(prototype_registeredMethods, prototype, () => []).push(callback)
}

/**
 * 执行方法修饰器
 * @param prototype 
 * @param instance
 * @param args 传递给MethodDecoratorCallback {@link MethodDecoratorCallback}
 */
export function implementDecorator(prototype: object, instance: any, ...args: any[]): void {
    const registeredMethods = prototype_registeredMethods.get(prototype)
    if (registeredMethods) {
        for (let i = 0, {length} = registeredMethods; i < length; i++) {
            registeredMethods[i](instance, ...args)
        }
    }
}

export const instance_pendingInitialising = new WeakMap<object, any[]>()

/**
 * 传入组件静态类或实例，得到组件的初始化函数的返回值
 * @param component 
 * @returns {Promise<any[]>} 返回一个数组，因为Initialize方法可能有多个
 */
export function whenReady(component: ClassType | object): Promise<any[]> {
    const instance = typeof component === 'function'
        ? registerComponent(component as ClassType)
        : component
    return Promise.all(instance_pendingInitialising.get(instance) || [])
}

/**
 * 获取组件初始化函数的返回值
 * @alias whenReady {@link whenReady}
 * @param component 
 */
export function getInitialValue(component: ClassType | object) {
    return whenReady(component)
}

/**
 * 获取Map的值，找不到时赋上默认值
 * @param data
 * @param key
 * @param defaultValue
 */
export function getValueAssignDefault<K, V>(data: Map<K, V>, key: K, defaultValue: () => V): V
export function getValueAssignDefault<K extends object, V>(map: WeakMap<K, V>, key: K, defaultValue: () => V): V
export function getValueAssignDefault(map: any, key: any, defaultValue: () => any) {
    if (map.has(key)) {
        return map.get(key)!
    }
    const value = defaultValue()
    map.set(key, value)
    return value
}

/**
 * 得到所有属性的描述符，包括被继承的父类
 * @param o 
 */
export function getAllPropertyDescriptors(o: any): {[p: PropertyKey]: PropertyDescriptor} {
    const {constructor, ...desc} = Object.getOwnPropertyDescriptors(o)
    const prototype = Object.getPrototypeOf(o)
    if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== Function.prototype) {
        return {
            ...getAllPropertyDescriptors(prototype),
            ...desc
        }
    }
    return desc
}

/**
 * 用于区分class与function
 * @param fn 
 */
export function isClass(fn: Function | ClassType): fn is ClassType {
    if (fn.prototype?.constructor !== fn) {
        return false
    }
    return /^class/.test(fn.toString())
}

export function commonParameterDecorator(map: WeakMap<object, Map<PropertyKey, number>>) {
    return (prototype: Object, property: PropertyKey | undefined, index: number) => {
        typeof property !== 'undefined' && getValueAssignDefault(map, prototype, () => new Map()).set(property, index)
    }
}

/**
 * -------------------------------------------------------------------
 * controller 相关
 */

/**
 * 简化字符串形式的pattern，去掉分隔符，统一成小写
 * @param pattern 
 */
export function simplifyPattern<T extends Pattern>(pattern: T): T {
    if (typeof pattern === 'string') {
        return pattern.replace(/[-_]/g, '').toLowerCase() as T
    }
    return pattern
}

/**
 * 全部统一使用"/"
 * @param path
 */
export function unifySlash(path: string) {
    return path.replace(/\\/g, '/')
}

/**
 * 统一path格式，统一使用"/"；选择性以"/"开头，且末尾无"/"
 * @param path
 * @param endWithSlash 是否以"/"开头，默认为true
 */
export function unifyPath(path: string, endWithSlash = true) {
    return unifySlash(path)
        // 去掉末尾的"/"
        .replace(/\/+$/, '')
        // 如果没有以"/"开头，则选择性加上"/"
        .replace(/^\/*/, endWithSlash ? '/' : '')
}

/**
 * 读取动态路径参数，并得到替换后的路径
 * @param params
 * @param routePath
 * @param referencePath
 * @returns {string} 替换后的路径
 * @returns {null} 路径不匹配会得到null
 */
export function insertPathParams(params: Record<string, string>, routePath: string, referencePath: string): string | null {
    const paramKeys = unifyPath(routePath, false).split('/')
    const paramValues = unifyPath(referencePath, false).split('/')
    if (paramKeys.length > paramValues.length) {
        return null
    }
    for (let i = 0, {length} = paramKeys; i < length; i++) {
        const key = paramKeys[i]
        const value = paramValues[i]
        if (key[0] === ':') {
            // 保存动态参数并替换动态路径
            params[key.slice(1)] = paramKeys[i] = value
        }
    }
    return paramKeys.join('/')
}

/**
 * 从前端截断路径
 * @param fullPath
 * @param truncation
 * @returns {string} 返回截断后的子路径
 * @returns {null} 如果路径不匹配，返回null
 */
export function truncatePath(fullPath: string, truncation: string | undefined): string | null {
    fullPath = unifyPath(fullPath)
    truncation = unifyPath(truncation || '')
    // truncation为undefined、空字符串或'/'时无需截断
    if (truncation === '/') {
        // 特殊情况，当fullPath为"/"时匹配了undefined或空字符串，会得到空字符串
        return fullPath === '/' ? '' : fullPath
    }
    if (!RegExp(`^${truncation}(/[^/]+)*$`).test(fullPath)) {
        return null
    }

    return fullPath.replace(RegExp(`^${truncation}`), '')
}

/**
 * 判断pattern的包含关系
 * @param referenceObj 完整的对象
 * @param obj 子对象
 * @returns {PatternObject | null} 返回剩余的未匹配的属性，如果全部匹配则返回null
 */
export function shallowContain(referenceObj: PatternObject, obj: PatternObject): PatternObject | null {
    const objKeys = Object.keys(obj)
    if (objKeys.length > Object.keys(referenceObj).length) {
        return null
    }
    const restObj = {...referenceObj}
    for (const k in obj) {
        if (obj[k] !== restObj[k]) {
            return null
        }
        delete restObj[k]
    }
    return restObj
}