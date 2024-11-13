import {ClassType, ModularizedComponents} from '..'
import {instance_pendingInitialising, getValueAssignDefault, registerDecorator, destructureComponentModule} from './utils'

export function Module(component: ClassType): ClassDecorator
export function Module(components: ModularizedComponents): ClassDecorator
export function Module(a: ClassType | ModularizedComponents) {
    return (target: ClassType) => {
        registerDecorator(target.prototype, instance => {
            getValueAssignDefault(instance_pendingInitialising, instance, () => []).push(
                destructureComponentModule(a)
            )
        })
    }
}