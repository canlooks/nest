import {ClassType} from '..'

export class Container {
    private static map = new WeakMap<ClassType, any>()

    static register<T>(component: ClassType<T>, instance: T) {
        Container.map.set(component, instance)
    }

    static get<T = any>(component: ClassType<T>): T | undefined {
        return Container.map.get(component)
    }
}