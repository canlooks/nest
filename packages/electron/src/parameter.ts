import {commonParameterDecorator, RouteItem} from '@canlooks/nest'
import {IpcMainInvokeEvent} from 'electron'

/**
 * 修改args数组，将event参数放到指定位置
 * @param routeItem
 * @param event
 * @param args
 */
export function transformInvokeArgs({prototype, property}: Required<RouteItem>, event: IpcMainInvokeEvent, ...args: any[]) {
    // 提取第一个参数，即event
    const eventIndex = prototype_property_eventIndex.get(prototype)?.get(property)
    if (typeof eventIndex === 'number') {
        args[eventIndex] = event
    }
    return args
}

const prototype_property_eventIndex = new WeakMap<object, Map<PropertyKey, number>>()

/**
 * 参数修饰器，被修饰的参数赋值为Electron.IpcMainInvokeEvent {@link IpcMainInvokeEvent}
 * @param prototype 
 * @param property 
 * @param index 
 */
export function IpcEvent(prototype: Object, property: PropertyKey | undefined, index: number): void
export function IpcEvent(): ParameterDecorator
export function IpcEvent(a?: any, b?: any, c?: any): any {
    const decorator = commonParameterDecorator(prototype_property_eventIndex)
    return a ? decorator(a, b, c) : decorator
}