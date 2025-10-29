export function Initialize(a?: any, b?: any, c?: any) {
    const fn = (prototype: Object, property: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    }
    return c ? fn(a, b, c) : fn
}

export function Inject(component: any) {
    return (prototype: Object, property: PropertyKey) => {
    }
}