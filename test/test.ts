import {Action, Nest, Controller, invoke} from '../src'

@Controller('/index/test')
class TestController {
    msg = 'hello'

    @Action('action/hello')
    async hello(name: string) {
        return `${this.msg} ${name}`
    }
}

Nest.create([TestController]).then(async () => {
    const res = await invoke('/index/test/action/hello', 'canlooks')
    console.log(res)
})