import {MatchedRoute, Pattern, PatternObject, RouteItem} from '../index'
import {Exception} from './exception'
import {commonParameterDecorator, insertPathParams, shallowContain, simplifyPattern, truncatePath, unifyPath} from './utils'
import {routeMap} from './controller'

/**
 * 公开的调用方法
 * @param pattern
 * @param args
 */
export function invoke(pattern: Pattern, ...args: any[]) {
    const matchedRoute = findMatchedRoute(pattern)
    return typeof pattern === 'object'
        // 对象模式将pattern作为第一个参数
        ? implementMatchedAction(matchedRoute, pattern, ...args)
        : implementMatchedAction(matchedRoute, ...args)
}

export function findMatchedRoute(pattern: Pattern): MatchedRoute {
    const matchedRoute = typeof pattern === 'string'
        ? invokeInPath(pattern)
        : invokeInObject(pattern)

    if (!matchedRoute.item?.action) {
        throw new Exception('[@canlooks/nest] Cannot find method', {
            statusCode: 404,
            code: 'Method Not Found',
            pattern
        })
    }
    return matchedRoute as MatchedRoute

    /**
     * 路径模式
     * @param invokePath
     */
    function invokeInPath(invokePath: string) {
        const params: Record<string, string> = {}
        const fn = (routeMap: Map<Pattern, RouteItem>, referencePath: string): RouteItem | null => {
            let subPath: string | null = null
            let matchedRoute: RouteItem | null = null
            for (let [path, routeItem] of routeMap) {
                if (typeof path !== 'string') {
                    continue
                }
                if (path[0] === '/') {
                    // 以"/"开头使用invokePath匹配
                    referencePath = invokePath
                }

                if (path.includes(':')) {
                    // 路径中存在动态参数
                    const replacedPath = insertPathParams(params, path, referencePath)
                    if (replacedPath === null) {
                        matchedRoute = null
                        break
                    }
                    // 得到替换后的路径
                    path = replacedPath
                }

                subPath = truncatePath(referencePath, path)
                if (routeItem.children.size) {
                    if (subPath !== null) {
                        // 有子路由，只要subPath不为null均可匹配成功
                        matchedRoute = routeItem
                        break
                    }
                } else if (subPath === '') {
                    // 无子路由需精准匹配
                    matchedRoute = routeItem
                    break
                }
            }

            // 匹配到的路由存在子路由，并且存在剩余的subPath，则继续递归匹配
            return matchedRoute?.children.size && subPath
                ? fn(matchedRoute!.children, subPath!)
                : matchedRoute
        }
        let search: string | undefined
        [invokePath, search] = invokePath.split('?')
        const item = fn(routeMap, simplifyPattern(unifyPath(invokePath)))
        return {item, params, search}
    }

    /**
     * 对象模式
     * @param invokeObj
     * @returns
     */
    function invokeInObject(invokeObj: PatternObject) {
        const fn = (routeMap: Map<Pattern, RouteItem>, referenceObj: PatternObject): RouteItem | null => {
            for (let [obj, routeItem] of routeMap) {
                if (typeof obj !== 'object' || obj === null) {
                    continue
                }
                const restObj = shallowContain(referenceObj, obj)
                if (restObj) {
                    return Object.keys(restObj).length && routeItem.children.size
                        ? fn(routeItem.children, restObj)
                        : routeItem
                }
            }
            return null
        }
        const item = fn(routeMap, invokeObj)
        return {item, params: {}, search: void 0}
    }
}

export function implementMatchedAction({
    item,
    params,
    search
}: MatchedRoute, ...args: any[]) {
    const paramIndex = prototype_property_paramIndex.get(item.prototype)?.get(item.property)
    if (typeof paramIndex === 'number') {
        args[paramIndex] = params
    }
    const queryIndex = prototype_property_queryIndex.get(item.prototype)?.get(item.property)
    if (typeof queryIndex === 'number') {
        args[queryIndex] = new URLSearchParams(search)
    }

    return item.action!(...args)
}

/**
 * -----------------------------------------------------------------
 * 参数修饰器
 */

const prototype_property_paramIndex = new WeakMap<object, Map<PropertyKey, number>>()

export function Param(prototype: Object, property: PropertyKey | undefined, index: number): void
export function Param(): ParameterDecorator
export function Param(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_paramIndex)
    return a ? decorator(a, b, c) : decorator
}

const prototype_property_queryIndex = new WeakMap<object, Map<PropertyKey, number>>()

export function Query(prototype: Object, property: PropertyKey | undefined, index: number): void
export function Query(): ParameterDecorator
export function Query(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_queryIndex)
    return a ? decorator(a, b, c) : decorator
}