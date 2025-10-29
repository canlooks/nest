import {MethodEnum} from '..'
import {Action, getMapValue, Pattern, RouteItem} from '@canlooks/nest'

const prototype_property_methodSet = new WeakMap<object, Map<PropertyKey, Set<MethodEnum>>>()

export function Method(method: MethodEnum, pattern?: Pattern): MethodDecorator
export function Method(methods: MethodEnum[], pattern?: Pattern): MethodDecorator
export function Method(a: any, pattern?: Pattern) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        const property_methodSet = getMapValue(prototype_property_methodSet, prototype, () => new Map())
        const methodSet = getMapValue(property_methodSet, property, () => new Set())
        const methodArr = Array.isArray(a) ? a : [a]
        for (let i = 0, {length} = methodArr; i < length; i++) {
            methodSet.add(methodArr[i].toLowerCase())
        }
        (Action as any)(pattern)(prototype, property, descriptor)
    }
}

/**
 * @alias {@link Method}
 */
export function Get(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Get(pattern?: Pattern): MethodDecorator
export function Get(a?: any, b?: any, c?: any) {
    return c ? Method('get')(a, b, c) : Method('get', a)
}

/**
 * @alias {@link Method}
 */
export function Post(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Post(pattern?: Pattern): MethodDecorator
export function Post(a?: any, b?: any, c?: any) {
    return c ? Method('post')(a, b, c) : Method('post', a)
}

/**
 * @private 检查对应action的method是否正确
 * @param prototype, property 
 * @param method 
 * @returns 200表示正确，404表示未找到，405表示method不正确
 */
export function checkMethod({prototype, property}: Required<RouteItem>, method: string) {
    const methodSet = prototype_property_methodSet.get(prototype)?.get(property)
    if (!methodSet) {
        return {code: 404, message: 'Method Not Found'}
    }
    if (!methodSet.has(method.toLowerCase() as MethodEnum)) {
        return {code: 405, message: 'Method Not Allowed'}
    }
    return {code: 200}
}

/**
 * -------------------------------------------------------------------
 * 响应头与状态码
 */

const prototype_property_statusCode = new WeakMap<object, Map<PropertyKey, number>>()

export function StatusCode(statusCode: number) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        getMapValue(prototype_property_statusCode, prototype, () => new Map()).set(property, statusCode)
    }
}

const prototype_property_headers = new WeakMap<object, Map<PropertyKey, Record<string, string>>>()

export function Header(key: string, value: string) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        const property_headers = getMapValue(prototype_property_headers, prototype, () => new Map())
        getMapValue(property_headers, property, () => ({}))[key] = value
    }
}

export function Headers(headers: Record<string, string>) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        const property_headers = getMapValue(prototype_property_headers, prototype, () => new Map())
        const currentHeaders = getMapValue(property_headers, property, () => ({}))
        Object.assign(currentHeaders, headers)
    }
}

/**
 * @private 获取对应action的statusCode和headers
 * @param param0 
 */
export function getResponseConfig({prototype, property}: Required<RouteItem>) {
    const statusCode = prototype_property_statusCode.get(prototype)?.get(property) ?? 200
    const headers = prototype_property_headers.get(prototype)?.get(property)
    return {statusCode, headers}
}

/**
 * -------------------------------------------------------------------
 * 重定向
 */

type RedirectConfig = {
    location: string,
    statusCode: number
}

const prototype_property_redirect = new WeakMap<object, Map<PropertyKey, RedirectConfig>>()

export function Redirect(location: string, statusCode = 302) {
    return (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        getMapValue(prototype_property_redirect, prototype, () => new Map()).set(property, {location, statusCode})
    }
}

export function getRedirectConfig({prototype, property}: Required<RouteItem>) {
    return prototype_property_redirect.get(prototype)?.get(property)
}