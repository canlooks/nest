import {Action, Controller, Nest, SubController} from '../src/index.browser'

@Controller
class HelloController {
    @Action
    hi() {
        return 'haha'
    }
}

@Controller('index')
class IndexController {
    @SubController(HelloController)
    sub!: HelloController

    @Action
    async hello() {
        return 'my name is canlooks'
    }
}

Nest.create(IndexController).then(async (index) => {
    // const res = await invoke('index/sub/hi')
    // console.log(20, res)

    const t = await index.sub.hi()
    console.log(27, t)
})