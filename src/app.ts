import {ClassType, Dict, ModularizedComponents, PluginDefinition} from '..'
import {implementPluginCallback, usePlugin} from './plugin'
import {destructureComponentModule} from './utils'

export class Nest {
    private static created = false

    static async create<T>(component: ClassType<T>): Promise<T>
    static async create(components: ModularizedComponents): Promise<any[] | Dict>
    static async create(a: ClassType | ModularizedComponents) {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot run create() twice')
        }
        this.created = true
        await Promise.all(implementPluginCallback('onAppCreate'))
        return destructureComponentModule(a)
    }

    static use<O>(plugin: PluginDefinition<O> | ClassType, options?: O): typeof Nest {
        if (this.created) {
            throw Error('[@canlooks/nest] Cannot extend plugin after Nest has been created')
        }
        usePlugin(plugin, options)
        return this
    }
}