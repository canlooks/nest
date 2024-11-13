import {ClassType, PluginDefinition} from '..'
import {usePlugin} from './plugin'

export class Nest {
    static async create() {
        /**
         * in browser environment, create does nothing
         */
    }

    static use<O>(plugin: PluginDefinition<O> | ClassType, options?: O): typeof Nest {
        usePlugin(plugin, options)
        return this
    }
}