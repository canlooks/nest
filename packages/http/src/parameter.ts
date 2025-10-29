import {commonParameterDecorator, RouteItem} from '@canlooks/nest'
import {IncomingMessage, ServerResponse} from 'http'

/**
 * @private 生成用于invoke的参数
 * @param param0 
 * @param args 
 * @returns 
 */
export function createInvokeArgs({prototype, property}: Pick<Required<RouteItem>, 'prototype' | 'property'>, req: IncomingMessage, res: ServerResponse, body: any) {
    const args: any[] = [body, req, res]

    const fn = (map: WeakMap<object, Map<PropertyKey, number>>, value: any) => {
        const index = map.get(prototype)?.get(property)
        if (typeof index === 'number') {
            args[index] = value
        }
    }
    fn(prototype_property_bodyIndex, body)
    fn(prototype_property_reqIndex, req)
    fn(prototype_property_resIndex, res)

    return args
}

/**
 * --------------------------------------------------------------------
 * 参数修饰器，被修饰的参数赋值为对应的请求参数
 */

const prototype_property_bodyIndex = new WeakMap<object, Map<PropertyKey, number>>()

export function Body(prototype: Object, property: PropertyKey | undefined, index: number): void
export function Body(): ParameterDecorator
export function Body(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_bodyIndex)
    return a ? decorator(a, b, c) : decorator
}

const prototype_property_reqIndex = new WeakMap<object, Map<PropertyKey, number>>()

export function Req(prototype: Object, property: PropertyKey | undefined, index: number): void
export function Req(): ParameterDecorator
export function Req(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_reqIndex)
    return a ? decorator(a, b, c) : decorator
}

const prototype_property_resIndex = new WeakMap<object, Map<PropertyKey, number>>()

export function Res(prototype: Object, property: PropertyKey | undefined, index: number): void
export function Res(): ParameterDecorator
export function Res(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_resIndex)
    return a ? decorator(a, b, c) : decorator
}