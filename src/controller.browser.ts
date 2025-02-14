import {ClassType, Pattern} from '..'
import {getAllPropertyDescriptors, joinPattern, registerDecorator, simplifyPattern} from './utils'
import {implementPluginCallback} from './plugin'
import {Action, CONTROLLER_PATTERN, PROPERTY_PATTERN} from './controller'

export {Action, CONTROLLER_PATTERN, PROPERTY_PATTERN}

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a?: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {
        const controllerPattern = target.prototype[CONTROLLER_PATTERN] = simplifyPattern(pattern ?? target.name)
        registerDecorator(target.prototype, instance => {
            const descriptors = getAllPropertyDescriptors(instance)
            for (const p in descriptors) {
                const {value} = descriptors[p]
                if (typeof value === 'function') {
                    const actionPattern = target.prototype[PROPERTY_PATTERN]?.get(p) || p
                    const joinedPattern = joinPattern(controllerPattern, actionPattern)
                    instance[p] = (...args: any[]) => {
                        return implementPluginCallback('onActionCall', joinedPattern, ...args)[0]
                    }
                }
            }
        })
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}