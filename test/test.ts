@ClassDec
class Test {
    @MethodDec
    method(@ParamDec a: any) {

    }
}

function ClassDec(target: any) {
    console.log('class')
}

function MethodDec(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log('method')
}

function ParamDec(target: any, propertyKey: string, index: number) {
    console.log('param')
}