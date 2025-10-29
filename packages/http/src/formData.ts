import formidable from 'formidable'
import {getMapValue, RouteItem} from '@canlooks/nest'
import {IncomingMessage} from 'http'

const prototype_property_index_options = new WeakMap<object, Map<PropertyKey, Map<number, formidable.Options>>>()

/**
 * 定义一个FormData参数修饰器，用于复用{@link formidable.Options}
 * @param options 
 * @returns {ParameterDecorator}
 */
export function defineFormData(options?: formidable.Options) {
    return decorator

    function decorator(prototype: Object, property: PropertyKey | undefined, index: number): void
    function decorator(): ParameterDecorator
    function decorator(a?: any, b?: any, c?: any): any {
        const fn = (prototype: Object, property: PropertyKey | undefined, index: number) => {
            if (typeof property === 'undefined') {
                return
            }
            const property_index_options = getMapValue(prototype_property_index_options, prototype, () => new Map())
            getMapValue(property_index_options, property, () => new Map()).set(index, options)
        }
        return a ? fn(a, b, c) : fn
    }
}

/**
 * 直接使用的参数修饰器
 */
export function FormData(prototype: Object, property: PropertyKey | undefined, index: number): void
export function FormData(options?: formidable.Options): ParameterDecorator
export function FormData(a?: any, b?: any, c?: any): any {
    return typeof c === 'number' ? defineFormData()(a, b, c) : defineFormData(a)
}

/**
 * -----------------------------------------------------------------
 * 内部方法
 */

export function createArgsFromFormData({prototype, property}: Required<RouteItem>, req: IncomingMessage) {
    const index_options = prototype_property_index_options.get(prototype)?.get(property)
    if (!index_options) {
        return null
    }
    const promises: Promise<void>[] = []
    const args: any[] = []
    for (const [index, options] of index_options) {
        promises.push(
            parseFormData(req, options).then(([fields, files]) => {
                args[index] = {...fields, ...files}
            })
        )
    }
    return Promise.all(promises).then(() => args)
}

export function parseFormData(req: IncomingMessage, options?: formidable.Options) {
    return formidable(options).parse(req)
}