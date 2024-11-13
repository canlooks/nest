// TODO 做到这里
import {ClassType, Pattern} from '../index'

export function Controller(target: ClassType): void
export function Controller(pattern?: Pattern): ClassDecorator
export function Controller(a: any) {
    const fn = (pattern?: Pattern) => (target: ClassType) => {

    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

export function Action(prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
export function Action(pattern?: Pattern): MethodDecorator
export function Action(a?: any, b?: any, c?: any): any {
    const fn = (pattern?: Pattern) => (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {

    }
    return c ? fn()(a, b, c) : fn(a)
}