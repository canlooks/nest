import {ClassType, Dict, Instances, PluginDefinition} from '..'
import {implementPluginCallback, usePlugin} from './plugin'
import {destructureComponentModule} from './utils'

export class Nest {
    private static created = false

    static async create<T>(component: ClassType<T>): Promise<T>
    static async create<T extends ClassType[]>(components: T): Promise<Instances<T>>
    static async create<T extends ClassType[]>(...components: T): Promise<Instances<T>>
    static async create<T extends Dict<ClassType>>(components: T): Promise<Instances<T>>
    static async create(...a: any[]) {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot run create() twice')
        }
        this.created = true
        await Promise.all(implementPluginCallback('onAppCreate'))
        return destructureComponentModule(a.length > 1 ? a : a[0])
    }

    static use<O>(plugin: PluginDefinition<O> | ClassType, options?: Partial<O>): typeof Nest {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot extend plugin after Nest has been created')
        }
        usePlugin(plugin, options)
        return this
    }
}