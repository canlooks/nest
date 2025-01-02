import {ClassType, Dict, Instances, PluginDefinition} from '..'
import {implementPluginCallback, usePlugin} from './plugin'
import {destructureComponentModule} from './utils'

export class Nest {
    private static created = false
    private static resolvers = Promise.withResolvers<void>()

    static get ready() {
        if (!this.created) {
            throw Error('[@canlooks/nest] Nest is not create yet, cannot access ready')
        }
        return this.resolvers.promise
    }

    static use<O>(plugin: PluginDefinition<O> | ClassType, options?: Partial<O>): typeof Nest {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot extend plugin after Nest has been created')
        }
        usePlugin(plugin, options)
        return this
    }

    static async create<T>(component: ClassType<T>): Promise<T>
    static async create<T extends ClassType[]>(components: T): Promise<Instances<T>>
    static async create<T extends ClassType[]>(...components: T): Promise<Instances<T>>
    static async create<T extends Dict<ClassType>>(components: T): Promise<Instances<T>>
    static async create(...a: any[]) {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot run create() twice')
        }
        this.created = true

        try {
            const [instances] = await Promise.all([
                destructureComponentModule(a.length > 1 ? a : a[0]),
                ...implementPluginCallback('onAppCreate')
            ])
            this.resolvers.resolve()
            return instances
        } catch (e) {
            this.resolvers.reject(e)
        }
    }
}