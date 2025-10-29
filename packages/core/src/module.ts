import {ClassType, StructuredComponents} from '..'
import {instance_pendingInitialising, getMapValue, registerDecorator, destructureComponentModule} from './utils'

export function Module(components: StructuredComponents) {
    return (target: ClassType) => {
        registerDecorator(target.prototype, instance => {
            getMapValue(instance_pendingInitialising, instance, () => []).push(
                destructureComponentModule(components)
            )
        })
    }
}